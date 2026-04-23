//token/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const twilio = (await import("twilio")).default; // ← moved inside handler
  const { AccessToken } = twilio.jwt;
  const { VoiceGrant } = AccessToken;

  const token = new AccessToken(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_API_KEY!,
    process.env.TWILIO_API_SECRET!,
    { identity: "crm-agent" }
  );

  token.addGrant(new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID!,
    incomingAllow: false,
  }));

  return NextResponse.json({ token: token.toJwt() });
}