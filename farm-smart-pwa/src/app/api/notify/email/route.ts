// src/app/api/notify/email/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { to, subject, message } = await req.json();
  const apiKey = process.env.SENDGRID_API_KEY;
  const senderEmail = process.env.SENDGRID_FROM_EMAIL ?? "you@yourverifiedsender.com";

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "SendGrid is not configured. Add SENDGRID_API_KEY to your environment." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: senderEmail },
        subject,
        content: [{ type: "text/plain", value: message }],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid request failed: ${response.status} ${await response.text()}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}