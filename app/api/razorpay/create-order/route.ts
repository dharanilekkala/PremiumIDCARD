import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { amount, currency = "INR", receipt } = (await req.json()) as {
      amount: number; currency?: string; receipt?: string;
    };

    const KEY_ID     = process.env.RAZORPAY_KEY_ID;
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

    // Demo mode — no real Razorpay keys configured
    if (!KEY_ID || !KEY_SECRET) {
      return NextResponse.json({
        id:       `order_demo_${Date.now()}`,
        amount,
        currency,
        receipt:  receipt ?? `rcpt_demo_${Date.now()}`,
        demo:     true,
      });
    }

    const credentials = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Basic ${credentials}`,
      },
      body: JSON.stringify({ amount, currency, receipt }),
    });

    if (!response.ok) {
      const err = await response.json();
      return NextResponse.json({ error: err }, { status: response.status });
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
