// src/lib/dynamicTranslate.ts — use this for ML recommendation text (#32), unlike static translations.ts
import type { Lang } from "@/lib/i18n/translations";

export async function translateDynamic(text: string, targetLang: Lang) {
  if (targetLang === "en") return text;
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, targetLang }),
  });
  const data = await res.json();
  return data.translated as string;
}