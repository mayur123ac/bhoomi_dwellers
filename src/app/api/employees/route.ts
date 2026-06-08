// src/app/api/employees/route.ts
// Phase 2A: bcrypt passwords + requireRoleAndOrganization + tenant-scoped queries
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireRoleAndOrganization } from "@/lib/serverAuth";
import { audit, AuditAction } from "@/lib/auditLog";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

// ── GET: Fetch all employees in org ──────────────────────────────────────────
export async function GET() {
  try {
    const auth = await requireRoleAndOrganization(["admin", "company_admin"]);
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const users = await query(
      `SELECT id, name, username, email, password, role, is_active AS "isActive", created_at
       FROM users
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [auth.organizationId]
    );

    const mapped = users.map((u: any) => ({ ...u, _id: String(u.id) }));
    return NextResponse.json(mapped, { status: 200 });

  } catch (error: any) {
    console.error("GET /api/employees error:", error);
    return NextResponse.json({ message: "Error fetching employees." }, { status: 500 });
  }
}

// ── POST: Add new employee ────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const auth = await requireRoleAndOrganization(["admin", "company_admin"]);
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { name, username, email, password, role } = await req.json();

    // ── Quota Check: max_users ────────────────────────────────────────────────
    const [orgData] = await query(
      `SELECT 
         (SELECT COUNT(*) FROM users WHERE organization_id = $1) as current_users,
         max_users 
       FROM organizations 
       WHERE id = $1`,
      [auth.organizationId]
    ) as any[];

    if (orgData && parseInt(orgData.current_users, 10) >= orgData.max_users) {
      return NextResponse.json(
        { message: `Quota exceeded: Your plan allows a maximum of ${orgData.max_users} users. Please contact support to upgrade your plan.` },
        { status: 403 }
      );
    }

    // Email uniqueness check — scoped to THIS org only
    const emailCheck = await query(
      `SELECT id FROM users WHERE email = $1 AND organization_id = $2 LIMIT 1`,
      [email?.trim().toLowerCase(), auth.organizationId]
    );
    if (emailCheck.length > 0) {
      return NextResponse.json({ message: "Email already exists in this organization." }, { status: 400 });
    }

    // Username uniqueness check — scoped to THIS org only
    if (username?.trim()) {
      const usernameCheck = await query(
        `SELECT id FROM users WHERE username = $1 AND organization_id = $2 LIMIT 1`,
        [username.trim(), auth.organizationId]
      );
      if (usernameCheck.length > 0) {
        return NextResponse.json({ message: "Username already taken in this organization." }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const [newUser] = await query(
      `INSERT INTO users (name, username, email, password, role, is_active, organization_id, status)
       VALUES ($1, $2, $3, $4, $5, true, $6, 'active')
       RETURNING id, name, email, role`,
      [name, username?.trim() ?? null, email?.trim().toLowerCase(), hashedPassword, role, auth.organizationId]
    ) as any[];

    await audit({
      organizationId: auth.organizationId,
      userId: auth.session?._id,
      userEmail: auth.session?.email,
      action: AuditAction.USER_CREATED,
      entityType: "user",
      entityId: String(newUser.id),
      metadata: { role, createdEmployeeEmail: newUser.email },
      req,
    });

    return NextResponse.json({ message: "Employee added successfully." }, { status: 201 });

  } catch (error: any) {
    console.error("POST /api/employees error:", error);
    return NextResponse.json({ message: "Error adding employee." }, { status: 500 });
  }
}

// ── PUT: Update employee ──────────────────────────────────────────────────────
export async function PUT(req: Request) {
  try {
    const auth = await requireRoleAndOrganization(["admin", "company_admin"]);
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ message: "User ID is required." }, { status: 400 });
    }

    // Verify the target user belongs to the same org (prevent cross-tenant update)
    const ownerCheck = await query(
      `SELECT id FROM users WHERE id = $1 AND organization_id = $2 LIMIT 1`,
      [userId, auth.organizationId]
    );
    if (ownerCheck.length === 0) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // ── FULL EDIT ────────────────────────────────────────────────────────────
    if (body.editData) {
      const { name, username, email, password, role } = body.editData;

      if (username) {
        const conflict = await query(
          `SELECT id FROM users WHERE username = $1 AND id != $2 AND organization_id = $3 LIMIT 1`,
          [username.trim(), userId, auth.organizationId]
        );
        if (conflict.length > 0) {
          return NextResponse.json({ message: "Username already taken by another user." }, { status: 400 });
        }
      }

      if (email) {
        const conflict = await query(
          `SELECT id FROM users WHERE email = $1 AND id != $2 AND organization_id = $3 LIMIT 1`,
          [email.trim().toLowerCase(), userId, auth.organizationId]
        );
        if (conflict.length > 0) {
          return NextResponse.json({ message: "Email already in use by another user." }, { status: 400 });
        }
      }

      const setClauses: string[] = [];
      const values: any[] = [];
      let p = 1;

      if (name)     { setClauses.push(`name = $${p++}`);     values.push(name); }
      if (username) { setClauses.push(`username = $${p++}`); values.push(username.trim()); }
      if (email)    { setClauses.push(`email = $${p++}`);    values.push(email.trim().toLowerCase()); }
      if (password) {
        const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
        setClauses.push(`password = $${p++}`);
        values.push(hashed);
      }
      if (role) { setClauses.push(`role = $${p++}`); values.push(role); }

      if (setClauses.length === 0) {
        return NextResponse.json({ message: "No fields to update." }, { status: 400 });
      }

      values.push(userId, auth.organizationId);
      const updated = await query(
        `UPDATE users SET ${setClauses.join(", ")}
         WHERE id = $${p} AND organization_id = $${p + 1}
         RETURNING *`,
        values
      ) as any[];

      if (updated.length === 0) {
        return NextResponse.json({ message: "User not found." }, { status: 404 });
      }

      await audit({
        organizationId: auth.organizationId,
        userId: auth.session?._id,
        userEmail: auth.session?.email,
        action: AuditAction.USER_UPDATED,
        entityType: "user",
        entityId: String(userId),
        metadata: { fieldsUpdated: setClauses.map((c) => c.split(" ")[0]) },
        req,
      });

      const u = updated[0];
      return NextResponse.json(
        { message: "Employee updated successfully.", user: { ...u, _id: String(u.id) } },
        { status: 200 }
      );
    }

    // ── STATUS TOGGLE ────────────────────────────────────────────────────────
    if (typeof body.isActive === "boolean") {
      const updated = await query(
        `UPDATE users SET is_active = $1 WHERE id = $2 AND organization_id = $3 RETURNING id`,
        [body.isActive, userId, auth.organizationId]
      );
      if ((updated as any[]).length === 0) {
        return NextResponse.json({ message: "User not found." }, { status: 404 });
      }

      await audit({
        organizationId: auth.organizationId,
        userId: auth.session?._id,
        userEmail: auth.session?.email,
        action: AuditAction.USER_STATUS_CHANGED,
        entityType: "user",
        entityId: String(userId),
        metadata: { isActive: body.isActive },
        req,
      });

      return NextResponse.json({ message: "Employee status updated successfully." }, { status: 200 });
    }

    return NextResponse.json({ message: "No valid update data provided." }, { status: 400 });

  } catch (error: any) {
    console.error("PUT /api/employees error:", error);
    return NextResponse.json({ message: "Error updating employee." }, { status: 500 });
  }
}

// ── DELETE: Remove an employee ────────────────────────────────────────────────
export async function DELETE(req: Request) {
  try {
    const auth = await requireRoleAndOrganization(["admin", "company_admin"]);
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ message: "User ID is required." }, { status: 400 });
    }

    // Tenant-scoped delete — can only delete users in their own org
    const deleted = await query(
      `DELETE FROM users WHERE id = $1 AND organization_id = $2 RETURNING id`,
      [userId, auth.organizationId]
    );

    if ((deleted as any[]).length === 0) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    await audit({
      organizationId: auth.organizationId,
      userId: auth.session?._id,
      userEmail: auth.session?.email,
      action: AuditAction.USER_DELETED,
      entityType: "user",
      entityId: String(userId),
      req,
    });

    return NextResponse.json({ message: "User deleted successfully." }, { status: 200 });

  } catch (error: any) {
    console.error("DELETE /api/employees error:", error);
    return NextResponse.json({ message: "Error deleting employee." }, { status: 500 });
  }
}