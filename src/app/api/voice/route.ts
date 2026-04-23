import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Twilio calls this via POST when browser SDK connects
export async function POST(req: NextRequest) {
  try {
    const twilio = (await import("twilio")).default;
    const body   = await req.formData();
    const to     = body.get("To") as string;

    const twiml  = new twilio.twiml.VoiceResponse();

    if (to && to.startsWith("+")) {
      const dial = twiml.dial({
        callerId: process.env.TWILIO_PHONE_NUMBER!,
        timeout: 30,
      });
      dial.number(to);
    } else {
      twiml.say("Sorry, no number provided.");
    }

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}