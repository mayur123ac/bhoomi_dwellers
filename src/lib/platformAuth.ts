// src/lib/platformAuth.ts
import { NextResponse } from "next/server";
import { getServerSession } from "./serverAuth";
import type { CrmSession } from "./tenant";

/**
 * Ensures the request is authenticated by a platform super_admin.
 * This is STRICTLY for platform-level APIs, and ensures the user is NOT bound
 * to a specific tenant but is instead a global administrator.
 */
export async function requireSuperAdmin(): Promise<
  | { isAuthorized: true; session: CrmSession }
  | { isAuthorized: false; error: string; status: 401 | 403 }
> {
  const session = await getServerSession();

  if (!session) {
    return { isAuthorized: false, error: "Unauthorized — missing or invalid session.", status: 401 };
  }

  if (session.role !== "super_admin") {
    return { 
      isAuthorized: false, 
      error: "Forbidden — platform super_admin access required.", 
      status: 403 
    };
  }

  return { isAuthorized: true, session };
}
