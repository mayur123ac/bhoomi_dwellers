const { SignJWT } = require("jose");
const fs = require("fs");
const path = require("path");

const envPath = path.join(process.cwd(), ".env.local");
const envVars = {};
fs.readFileSync(envPath, "utf8").split("\n").forEach((line) => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return;
  const eqIndex = trimmed.indexOf("=");
  if (eqIndex === -1) return;
  const key = trimmed.slice(0, eqIndex).trim();
  let val = trimmed.slice(eqIndex + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  envVars[key] = val;
});

const secret = envVars["JWT_SECRET"];
const secretBytes = new TextEncoder().encode(secret);

async function test() {
  const token = await new SignJWT({
    _id: "1",
    name: "Admin",
    email: "admin@test.com",
    role: "company_admin",
    isActive: true,
    organizationId: "26fde71a-b1df-42f7-b59a-7e59ab7987eb",
    organizationSlug: "test",
    organizationName: "Test Org",
    permissions: {}
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .setIssuer("crm-saas")
    .sign(secretBytes);

  const res = await fetch("http://localhost:3000/api/users/sales-manager", {
    headers: {
      "Cookie": `crm_session=${token}`
    }
  });

  console.log("STATUS:", res.status);
  const text = await res.text();
  console.log("BODY:", text);
}

test();
