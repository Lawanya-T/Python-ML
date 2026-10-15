// src/app/api/push/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";

// TODO: persist to your DB — for now this just confirms receipt
export async function POST(req: NextRequest) {
  const body = (await req.json()) as { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } };
  const subscription = body.subscription;
  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys.auth) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}