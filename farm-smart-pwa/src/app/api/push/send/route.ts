// src/app/api/push/send/route.ts
import { NextRequest, NextResponse } from "next/server";
// web-push does not ship TypeScript declarations.
// @ts-expect-error: the package is JavaScript-only.
import webpush from "web-push";

export async function POST(req: NextRequest) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: "Web Push VAPID keys are not configured." }, { status: 503 });
  }

  const { subscription, title, body, url } = await req.json();
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return NextResponse.json({ error: "A valid push subscription is required." }, { status: 400 });
  }
  if (typeof title !== "string" || typeof body !== "string") {
    return NextResponse.json({ error: "A notification title and body are required." }, { status: 400 });
  }

  try {
    webpush.setVapidDetails("mailto:notifications@farm-smart.app", publicKey, privateKey);
    await webpush.sendNotification(subscription, JSON.stringify({ title, body, url: typeof url === "string" ? url : "/#alerts" }));
    return NextResponse.json({ success: true });
  } catch (err) {
    const statusCode = typeof err === "object" && err !== null && "statusCode" in err
      ? Number(err.statusCode)
      : 500;
    return NextResponse.json({ success: false, error: "Push notification delivery failed." }, { status: statusCode });
  }
}