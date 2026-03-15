import { NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import Role from "@/models/Role";

// GET all roles (and create defaults if empty)
export async function GET() {
  try {
    await connectMongoDB();
    let roles = await Role.find().sort({ createdAt: 1 });

    // Automatically inject your default roles if the database is empty
    if (roles.length === 0) {
      const defaultRoles = [
        { name: "Admin" },
        { name: "Sales Manager" },
        { name: "Caller" },
        { name: "Receptionist" },
        { name: "Sourcing Manager" },
      ];
      roles = await Role.insertMany(defaultRoles);
    }

    return NextResponse.json(roles, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching roles" }, { status: 500 });
  }
}

// POST a new custom role
export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    await connectMongoDB();

    // Prevent duplicates (case-insensitive)
    const existingRole = await Role.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
    if (existingRole) {
      return NextResponse.json({ message: "Role already exists." }, { status: 400 });
    }

    const newRole = await Role.create({ name });
    return NextResponse.json(newRole, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error creating role" }, { status: 500 });
  }
}