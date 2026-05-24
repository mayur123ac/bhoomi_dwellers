import { createLeadUpdateStream } from "@/lib/lostLeadEvents";

export const dynamic = "force-dynamic";

export async function GET() {
  return createLeadUpdateStream();
}
