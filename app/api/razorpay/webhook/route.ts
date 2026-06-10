import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

// Razorpay sends events to this endpoint.
// Set RAZORPAY_WEBHOOK_SECRET in .env.local to enable signature verification.
export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const secret    = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (secret) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    if (expected !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  }

  const event = JSON.parse(body) as { event: string; payload: Record<string, unknown> };

  switch (event.event) {
    case "payment.captured":
      // In production: update your database subscription status here
      console.log("[Webhook] payment.captured:", JSON.stringify(event.payload).slice(0, 200));
      break;
    case "subscription.charged":
      console.log("[Webhook] subscription.charged:", JSON.stringify(event.payload).slice(0, 200));
      break;
    case "payment.failed":
      console.log("[Webhook] payment.failed:", JSON.stringify(event.payload).slice(0, 200));
      break;
    default:
      break;
  }

  return NextResponse.json({ status: "ok" });
}
