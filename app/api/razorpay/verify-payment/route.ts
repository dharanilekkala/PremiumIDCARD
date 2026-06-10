import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      demo,
    } = (await req.json()) as {
      razorpay_order_id:   string;
      razorpay_payment_id: string;
      razorpay_signature:  string;
      demo?:               boolean;
    };

    // Demo mode — accept without real verification
    if (demo) {
      return NextResponse.json({ verified: true, demo: true });
    }

    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
    if (!KEY_SECRET) {
      return NextResponse.json({ error: "Gateway not configured" }, { status: 500 });
    }

    const payload  = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac("sha256", KEY_SECRET)
      .update(payload)
      .digest("hex");

    if (expected !== razorpay_signature) {
      return NextResponse.json({ verified: false, error: "Signature mismatch" }, { status: 400 });
    }

    return NextResponse.json({ verified: true });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
