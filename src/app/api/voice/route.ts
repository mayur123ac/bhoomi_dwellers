import { NextRequest, NextResponse } from "next/server";
const twilio = (await import("twilio")).default;

export async function POST(req: NextRequest) {
  const body  = await req.formData();
  const to    = body.get("To") as string;
  const twiml = new twilio.twiml.VoiceResponse();

  if (to) {
    const dial = twiml.dial({ callerId: process.env.TWILIO_PHONE_NUMBER! });
    dial.number(to);
  } else {
    twiml.say("No number provided.");
  }
  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" }
  });
}