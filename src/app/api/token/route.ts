import { NextResponse } from "next/server";
import twilio from "twilio";

const { AccessToken } = twilio.jwt;
const { VoiceGrant }  = AccessToken;

export async function GET() {
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