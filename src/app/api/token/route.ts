//token/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const twilio = (await import("twilio")).default;
    const { AccessToken } = twilio.jwt;
    const { VoiceGrant } = AccessToken;

    console.log("[token] SID:", process.env.TWILIO_ACCOUNT_SID?.slice(0, 5));
    console.log("[token] KEY:", process.env.TWILIO_API_KEY?.slice(0, 5));
    console.log("[token] APP:", process.env.TWILIO_TWIML_APP_SID?.slice(0, 5));

    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_API_KEY!,
      process.env.TWILIO_API_SECRET!,
      { identity: "crm-agent", ttl: 3600 }
    );

    token.addGrant(new VoiceGrant({
      outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID!,
      incomingAllow: false,
    }));

    const jwt = token.toJwt();
    console.log("[token] Generated JWT (first 30):", jwt.slice(0, 30));

    return NextResponse.json({ token: jwt });

  } catch (err: any) {
    console.error("[token] ERROR:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}