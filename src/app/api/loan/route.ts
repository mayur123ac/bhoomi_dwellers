import { NextResponse } from "next/server";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

// ============================================================================
// DATABASE CONNECTION (Optimized for Vercel Serverless)
// ============================================================================
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) return;
  if (mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }
  await mongoose.connect(MONGODB_URI);
  isConnected = true;
};

// ============================================================================
// 1. SCHEMAS & MODELS
// ============================================================================
const loanUpdateSchema = new mongoose.Schema({
  leadId: { type: String, required: true },
  salesManagerName: { type: String, required: true },
  createdBy: { type: String, default: "sales" },
  
  // Basic
  status: { type: String, default: "Pending" },
  loanType: String, amountReq: String, amountApp: String, processingAmt: String, roi: String, tenure: String,
  
  // Bank & Agent
  bank: String, officer: String, agent: String, agentContact: String,
  
  // Financial
  empType: String, income: String, emi: String, cibil: String,
  
  // Property
  propType: String, propValue: String, project: String, builder: String,
  
  // Contact
  phone: String, altPhone: String, email: String, address: String,
  
  // Timeline & Notes
  appDate: String, apprvDate: String, expDisbDate: String, disbDate: String,
  notes: String,
  
  createdAt: { type: Date, default: Date.now }
});

// Recreating the FollowupSchema to inject logs
const followupSchema = new mongoose.Schema({
  leadId: { type: String, required: true },
  salesManagerName: { type: String, required: true },
  createdBy: { type: String, default: "sales" },
  message: { type: String, required: true },
  siteVisitDate: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

// Prevent model overwrite upon Next.js hot reload
const LoanUpdate = mongoose.models.LoanUpdate || mongoose.model("LoanUpdate", loanUpdateSchema);
const FollowupMessage = mongoose.models.FollowupMessage || mongoose.model("FollowupMessage", followupSchema);

// ============================================================================
// 2. GET LOAN DATA
// ============================================================================
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const loans = await LoanUpdate.find().sort({ createdAt: 1 });
    return NextResponse.json({ success: true, data: loans }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch loans:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch loans" }, { status: 500 });
  }
}

// ============================================================================
// 3. POST LOAN DATA (Saves Loan AND creates Follow-up Log)
// ============================================================================
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    
    if (!body.leadId) {
      return NextResponse.json({ success: false, message: "Missing leadId" }, { status: 400 });
    }

    // 1. Save the comprehensive structured data to the Loan collection
    const newLoan = await LoanUpdate.create(body);

    // 2. Generate the visual Follow-up summary for the frontend timeline
    const summaryMessage = `🏦 Loan Update:
• Loan Required: Yes
• Status: ${body.status || 'N/A'}
• Bank Name: ${body.bank || 'N/A'}
• Amount Requested: ${body.amountReq || 'N/A'}
• Amount Approved: ${body.amountApp || 'N/A'}
• CIBIL Score: ${body.cibil || 'N/A'}
• Agent Name: ${body.agent || 'N/A'}
• Agent Contact: ${body.agentContact || 'N/A'}
• Employment Type: ${body.empType || 'N/A'}
• Monthly Income: ${body.income || 'N/A'}
• Existing EMIs: ${body.emi || 'N/A'}
• PAN Card: ${body.docPan || 'Pending'}
• Aadhaar Card: ${body.docAadhaar || 'Pending'}
• Salary Slips: ${body.docSalary || 'Pending'}
• Bank Statements: ${body.docBank || 'Pending'}
• Property Docs: ${body.docProperty || 'Pending'}
• Notes: ${body.notes || 'N/A'}`;

    // 3. Inject it into the Follow-ups timeline collection
    await FollowupMessage.create({
      leadId: String(body.leadId),
      salesManagerName: body.salesManagerName,
      createdBy: body.createdBy || "sales",
      message: summaryMessage,
      siteVisitDate: null
    });

    return NextResponse.json({ success: true, data: newLoan }, { status: 201 });
  } catch (error) {
    console.error("Failed to save loan update:", error);
    return NextResponse.json({ success: false, message: "Failed to save loan update" }, { status: 500 });
  }
}