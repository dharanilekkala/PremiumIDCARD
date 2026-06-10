/**
 * lib/razorpay.ts — Razorpay SDK types & script loader
 * Set NEXT_PUBLIC_RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in .env.local to go live.
 * Without those vars the app runs in demo mode (simulated payment).
 */

export interface RazorpayOptions {
  key:         string;
  amount:      number;   // paise (INR smallest unit)
  currency:    string;
  name:        string;
  description: string;
  order_id:    string;
  prefill?: {
    name?:    string;
    email?:   string;
    contact?: string;
  };
  notes?:  Record<string, string>;
  theme?:  { color: string };
  handler: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss?:     () => void;
    confirm_close?: boolean;
  };
}

export interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id:   string;
  razorpay_signature:  string;
}

declare global {
  interface Window {
    Razorpay: new (opts: RazorpayOptions) => { open(): void };
  }
}

export function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (typeof window === "undefined") { resolve(false); return; }
    if (window.Razorpay)               { resolve(true);  return; }
    const s   = document.createElement("script");
    s.src     = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function isRazorpayConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
}
