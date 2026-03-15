import { NextResponse } from "next/server";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

// Initialize connection logic
const connectToDatabase = async () => {
  if (mongoose.connection.readyState >= 1) return;
  return mongoose.connect(MONGODB_URI);
};

// 1. Define the Schema with the NEW siteVisitDate field
const followupSchema = new mongoose.Schema({
  leadId: { type: String, required: true },
  salesManagerName: { type: String, required: true },
  message: { type: String, required: true },
  siteVisitDate: { type: String, default: null }, // 🔥 Added Site Visit Date
  createdAt: { type: Date, default: Date.now }
});

const FollowupMessage = mongoose.models.FollowupMessage || mongoose.model("FollowupMessage", followupSchema);

// 2. GET Endpoint
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const messages = await FollowupMessage.find().sort({ createdAt: 1 });
    return NextResponse.json({ success: true, data: messages }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to fetch messages" }, { status: 500 });
  }
}

// 3. POST Endpoint 
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { leadId, salesManagerName, message, siteVisitDate } = body;

    if (!leadId || !message) {
      return NextResponse.json({ success: false, message: "Missing fields" }, { status: 400 });
    }

    const newMessage = await FollowupMessage.create({
      leadId: String(leadId), // Force string conversion
      salesManagerName,
      message,
      siteVisitDate: siteVisitDate || null // 🔥 Save the date to Mongo
    });

    return NextResponse.json({ success: true, data: newMessage }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Failed to save message" }, { status: 500 });
  }
}