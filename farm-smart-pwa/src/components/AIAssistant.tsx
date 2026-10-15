// src/components/AIAssistant.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Mic, MicOff, Loader2, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS: Record<string, string[]> = {
  en: ["Check my soil moisture", "When should I irrigate today?", "Will it rain today?"],
  hi: ["मेरी मिट्टी की नमी देखें", "आज सिंचाई कब करनी चाहिए?", "आज बारिश होगी?"] ,
  kn: ["ನನ್ನ ಮಣ್ಣಿನ ತೇವಾಂಶವನ್ನು ನೋಡಿ", "ಇಂದು ನೀರನ್ನು ಯಾವಾಗ ಕೊಡುವುದು?", "ಇಂದು ಮಳೆ ಬರುತ್ತದೆಯೇ?"],
  mr: ["माझ्या मातीची ओल पहा", "आज पाणी कधी द्यावे?", "आज पाऊस पडेल का?"],
  ta: ["என் மண் ஈரப்பதத்தைப் பார்க்கவும்", "இன்று எப்போது பாசனம் செய்ய வேண்டும்?", "இன்று மழை வருமா?"],
  pa: ["ਮੇਰੇ ਮਿੱਟ ਦੀ ਨਮੀ ਦੇਖੋ", "ਅੱਜ ਸਿੰਚਾਈ ਕਦੋਂ ਕਰਨੀ ਚਾਹੀਦੀ ਹੈ?", "ਅੱਜ ਬਰਿਸ਼ ਹੋਵੇਗੀ?"],
  bn: ["আমার মাটির আর্দ্রতা দেখুন", "আজ কখন সেচ দিতে হবে?", "আজ বৃষ্টি হবে কি?"],
  te: ["నా మట్టి తేమను చూస్తాను", "ఈరోజు ఎప్పుడు నీరువాసం చేయాలి?", "ఈరోజు వర్షం వస్తుందా?"],
  gu: ["મારી માટીની ભેજ જુઓ", "આજ સિંચન ક્યારે કરવું જોઈએ?", "આજે વરસાદ આવશે શું?"],
};

const ASSISTANT_WELCOME: Record<string, string> = {
  en: "Hi! Ask me about your fields, irrigation schedule, or weather.",
  hi: "नमस्कार! अपने खेत, सिंचाई की समय-सारणी या मौसम के बारे में पूछें।",
  kn: "ಹಲೋ! ನಿಮ್ಮ ಹೊಲ, ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿ ಅಥವಾ ಹವಾಮಾನದ ಬಗ್ಗೆ ಕೇಳಿ.",
  mr: "नमस्कार! तुमच्या शेत, सिंचन वेळापत्रक किंवा हवामानाबद्दल विचारा.",
  ta: "வணக்கம்! உங்கள் வயல், பாசன அட்டவணை அல்லது வானிலை பற்றி கேளுங்கள்.",
  pa: "ਹੈਲੋ! ਆਪਣੀ ਖੇਤ, ਸਿੰਚਾਈ ਸਮਾਂ ਸਾਰਣੀ ਜਾਂ ਮੌਸਮ ਬਾਰੇ ਪੁੱਛੋ.",
  bn: "হ্যালো! আপনার খেত, সেচের সময়সূচী বা আবহাওয়া সম্পর্কে জিজ্ঞাসা করুন।",
  te: "హలో! మీ పొలం, నీటిపారుదల షెడ్యూల్ లేదా వాతావరణం గురించి అడగండి.",
  gu: "હલો! તમારો ખેત, સિંચાઈનો સમયપત્રક અથવા હવામાન વિશે પૂછો.",
};

interface SpeechRecognitionResultLike {
  transcript: string;
}

interface SpeechRecognitionEventLike {
  results: ArrayLike<ArrayLike<SpeechRecognitionResultLike>>;
}

interface SpeechRecognitionLike {
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const SPEECH_LANG_MAP: Record<string, string> = { en: "en-IN", hi: "hi-IN", kn: "kn-IN", mr: "mr-IN", ta: "ta-IN", pa: "pa-IN", bn: "bn-IN", te: "te-IN", gu: "gu-IN" };

export default function AIAssistant() {
  const { lang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [panelSize, setPanelSize] = useState({ width: 320, height: 380 });
  const [resizeState, setResizeState] = useState<{
    corner: "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        lang === "hi"
          ? "नमस्कार! अपने खेत, सिंचाई की समय-सारणी या मौसम के बारे में पूछें।"
          : lang === "kn"
            ? "ಹಲೋ! ನಿಮ್ಮ ಹೊಲ, ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿ ಅಥವಾ ಹವಾಮಾನದ ಬಗ್ಗೆ ಕೇಳಿ."
            : lang === "mr"
              ? "नमस्कार! तुमच्या शेत, सिंचन वेळापत्रक किंवा हवामानाबद्दल विचारा."
              : lang === "ta"
                ? "வணக்கம்! உங்கள் வயல், பாசன அட்டவணை அல்லது வானிலை பற்றி கேளுங்கள்."
                : lang === "pa"
                  ? "ਹੈਲੋ! ਆਪਣੀ ਖੇਤ, ਸਿੰਚਾਈ ਸਮਾਂ ਸਾਰਣੀ ਜਾਂ ਮੌਸਮ ਬਾਰੇ ਪੁੱਛੋ।"
                  : lang === "bn"
                    ? "হ্যালো! আপনার খেত, সেচের সময়সূচি বা আবহাওয়া সম্পর্কে জিজ্ঞাসা করুন।"
                    : lang === "te"
                      ? "హలో! మీ పొలం, నీటిపారుదల షెడ్యూల్ లేదా వాతావరణం గురించి అడగండి."
                      : lang === "gu"
                        ? "હલો! તમારો ખેત, સિંચાઈનો સમયપત્રક અથવા હવામાન વિશે પૂછી શકે."
                        : "Hi! Ask me about your fields, irrigation schedule, or weather.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    const openAssistant = (event: Event) => {
      const prompt = (event as CustomEvent<string>).detail;
      if (typeof prompt === "string") setInput(prompt);
      setOpen(true);
    };
    window.addEventListener("open-ai-assistant", openAssistant);
    return () => window.removeEventListener("open-ai-assistant", openAssistant);
  }, []);

  useEffect(() => {
    if (!resizeState) return;

    const handleMove = (event: MouseEvent) => {
      const dx = event.clientX - resizeState.startX;
      const dy = event.clientY - resizeState.startY;

      let nextWidth = resizeState.startWidth;
      let nextHeight = resizeState.startHeight;

      if (resizeState.corner.includes("e")) {
        nextWidth = Math.min(Math.max(resizeState.startWidth + dx, 260), 420);
      }
      if (resizeState.corner.includes("w")) {
        nextWidth = Math.min(Math.max(resizeState.startWidth - dx, 260), 420);
      }
      if (resizeState.corner.includes("s")) {
        nextHeight = Math.min(Math.max(resizeState.startHeight + dy, 300), 620);
      }
      if (resizeState.corner.includes("n")) {
        nextHeight = Math.min(Math.max(resizeState.startHeight - dy, 300), 620);
      }

      setPanelSize({ width: nextWidth, height: nextHeight });
    };

    const handleUp = () => setResizeState(null);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [resizeState]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map((m, index) => ({
            role: m.role,
            content: index === 0 && m.role === "assistant" ? ASSISTANT_WELCOME[lang] ?? m.content : m.content,
          })),
          context: { language: lang },
        }),
      });
      if (!res.ok) throw new Error(`Assistant request failed: ${res.status}`);
      const data = await res.json();
      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("Assistant returned an empty response");
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(data.reply);
        utterance.lang = SPEECH_LANG_MAP[lang] ?? "en-IN";
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: t("Something went wrong. Try again.") }]);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceInput = () => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LANG_MAP[lang] ?? "en-IN";
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const result = event.results[0]?.[0];
      if (!result) return;
      const text = result.transcript;
      sendMessage(text);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label={t("Close assistant")}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/10"
        />
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("Open farm assistant")}
        className="fixed right-5 top-1/2 z-40 flex h-16 w-16 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-[0_12px_30px_rgba(249,115,22,0.45)] transition hover:scale-105"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-44 right-5 z-40 flex flex-col overflow-hidden rounded-[22px] border border-line bg-surface shadow-[0_20px_50px_rgba(43,29,21,0.18)] md:bottom-auto md:right-6 md:top-[52%] md:-translate-y-1/2"
          style={{
            width: panelSize.width,
            height: panelSize.height,
            minWidth: 260,
            minHeight: 300,
            maxWidth: 420,
            maxHeight: 620,
            position: "fixed",
            backgroundImage: "linear-gradient(to bottom, #fffcf6, #f3e8d6)",
          }}
        >
          <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-[#2b1d15] via-[#62452e] to-[#98724d] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                <MessageCircle size={16} className="text-amber-100" />
              </div>
              <p className="text-sm font-semibold">{t("Farm Assistant")}</p>
            </div>
            <button
              type="button"
              aria-label={t("Close assistant")}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setOpen(false)}
              className="rounded-full bg-white/10 p-1.5 transition hover:bg-white/20"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
            <div className="flex flex-wrap gap-1.5 pb-1">
              {(QUICK_PROMPTS[lang] ?? QUICK_PROMPTS.en).map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full border border-line bg-surface px-2 py-1 text-[10px] font-medium text-leaf-700"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-leaf-600 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {i === 0 && m.role === "assistant" ? ASSISTANT_WELCOME[lang] ?? m.content : m.content}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Loader2 size={13} className="animate-spin" /> {t("Thinking…")}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 border-t border-line bg-gradient-to-r from-surface-raised to-[#EEE5D7] p-2">
            <button
              onClick={startVoiceInput}
              aria-label={t(listening ? "Stop voice input" : "Start voice input")}
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                listening ? "bg-gradient-to-br from-red-500 to-pink-500 text-white" : "bg-surface text-leaf-600 ring-1 ring-line"
              }`}
            >
              {listening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder={t("Ask a question…")}
              className="flex-1 rounded-full border border-line bg-surface px-3 py-1.5 text-sm outline-none focus:border-leaf-500"
            />
            <button
              onClick={() => sendMessage(input)}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B6A49] to-[#543925] text-white shadow-md"
            >
              <Send size={14} />
            </button>
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-[22px] border border-dashed border-[#CDBA9B]/80" />

          {[
            { key: "nw", className: "left-0 top-0 cursor-nw-resize bg-gradient-to-br from-[#D4BD99] to-[#8B6A49]" },
            { key: "ne", className: "right-0 top-0 cursor-ne-resize bg-gradient-to-br from-[#D4BD99] to-[#8B6A49]" },
            { key: "sw", className: "bottom-0 left-0 cursor-sw-resize bg-gradient-to-br from-[#D4BD99] to-[#8B6A49]" },
            { key: "se", className: "bottom-0 right-0 cursor-se-resize bg-gradient-to-br from-[#D4BD99] to-[#8B6A49]" },
          ].map((handle) => (
            <div
              key={handle.key}
              onMouseDown={(event) => {
                event.preventDefault();
                setResizeState({
                  corner: handle.key as "nw" | "ne" | "sw" | "se",
                  startX: event.clientX,
                  startY: event.clientY,
                  startWidth: panelSize.width,
                  startHeight: panelSize.height,
                });
              }}
              className={`absolute h-4 w-4 opacity-90 shadow-sm ${handle.className}`}
            />
          ))}

        </div>
      )}
    </>
  );
}
