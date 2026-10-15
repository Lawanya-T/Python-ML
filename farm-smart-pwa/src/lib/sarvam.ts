const SARVAM_API_KEY = process.env.SARVAM_API_KEY ?? process.env.NEXT_PUBLIC_SARVAM_API_KEY ?? "";
const API_BASE = "https://api.sarvam.ai";

function assertSarvamConfigured() {
  if (!SARVAM_API_KEY) {
    throw new Error("Sarvam API key is not configured.");
  }
}

/**
 * Transcribes audio blob (from farmer's microphone) into text
 */
export async function transcribeAudio(audioBlob: Blob, languageCode: string = "hi-IN"): Promise<string> {
  assertSarvamConfigured();

  const formData = new FormData();
  formData.append("file", audioBlob, "voice_input.wav");
  formData.append("model", "saaras:v3");
  formData.append("language_code", languageCode);

  const res = await fetch(`${API_BASE}/speech-to-text`, {
    method: "POST",
    headers: {
      "api-subscription-key": SARVAM_API_KEY,
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to process voice input");
  const data = await res.json();
  return data.transcript;
}

/**
 * Translates regional language text to English (or vice versa)
 */
export async function translateText(
  text: string,
  sourceLang: string = "hi-IN",
  targetLang: string = "en-IN"
): Promise<string> {
  assertSarvamConfigured();

  const res = await fetch(`${API_BASE}/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": SARVAM_API_KEY,
    },
    body: JSON.stringify({
      input: text,
      source_language_code: sourceLang,
      target_language_code: targetLang,
      speaker_gender: "male",
      mode: "formal",
    }),
  });

  if (!res.ok) throw new Error("Translation failed");
  const data = await res.json();
  return data.translated_text;
}

/**
 * Converts text response into spoken audio in the selected regional language
 */
export async function textToSpeech(text: string, languageCode: string = "hi-IN"): Promise<string> {
  assertSarvamConfigured();

  const res = await fetch(`${API_BASE}/text-to-speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": SARVAM_API_KEY,
    },
    body: JSON.stringify({
      inputs: [text],
      target_language_code: languageCode,
      speaker: "meera",
      pitch: 0,
      pace: 1.0,
      loudness: 1.5,
      speech_sample_rate: 16000,
      enable_preprocessing: true,
      model: "bulbul:v3",
    }),
  });

  if (!res.ok) throw new Error("Speech generation failed");
  const data = await res.json();
  // Returns base64 encoded audio string
  return data.audios[0];
}