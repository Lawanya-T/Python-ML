// src/app/api/translate/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text, targetLang } = await req.json();
  const apiKey = process.env.SARVAM_API_KEY;

  const langMap: Record<string, string> = {
    en: "en-IN",
    hi: "hi-IN",
    kn: "kn-IN",
    mr: "mr-IN",
    ta: "ta-IN",
    pa: "pa-IN",
    bn: "bn-IN",
    te: "te-IN",
    gu: "gu-IN",
  };

  try {
    if (!apiKey) {
      throw new Error("SARVAM_API_KEY is not configured");
    }

    const res = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        input: text,
        source_language_code: "en-IN",
        target_language_code: langMap[targetLang] ?? "en-IN",
        model: "sarvam-translate:v1",
      }),
    });

    if (!res.ok) throw new Error(`Sarvam API error: ${res.status}`);
    const data = await res.json();
    return NextResponse.json({ translated: data.translated_text });
  } catch (err) {
    console.error("Sarvam translate failed:", err);
    // Falls back to the original text if the API is unreachable/key missing
    return NextResponse.json({ translated: text, fallback: true, reason: "offline" });
  }
}