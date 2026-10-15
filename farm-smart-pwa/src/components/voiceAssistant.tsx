"use client";

import { useState, useRef } from "react";
import { Mic, MicOff, Volume2, Loader2 } from "lucide-react";
import { transcribeAudio, translateText, textToSpeech } from "@/lib/sarvam";

interface VoiceAssistantProps {
  selectedLanguage?: string; // e.g., "hi-IN", "mr-IN", "ta-IN"
  onCommandParsed?: (actionText: string) => void;
}

export default function VoiceAssistant({ selectedLanguage = "hi-IN" }: VoiceAssistantProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Start Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        await handleAudioProcess(audioBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied or error:", err);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process Recorded Audio with Sarvam AI
  const handleAudioProcess = async (audioBlob: Blob) => {
    setLoading(true);
    try {
      // 1. Transcribe audio in regional language
      const userSpokenText = await transcribeAudio(audioBlob, selectedLanguage);
      setTranscript(userSpokenText);

      // 2. Translate regional text to English for standard processing
      const englishIntent = await translateText(userSpokenText, selectedLanguage, "en-IN");

      // 3. Simple Mock Logic (Replace this with real API / ML model calls)
      let replyEnglish = "Everything looks normal in your fields.";
      if (englishIntent.toLowerCase().includes("water") || englishIntent.toLowerCase().includes("moisture")) {
        replyEnglish = "Soil moisture in North Field is 34%. Drip irrigation is recommended for 30 minutes.";
      } else if (englishIntent.toLowerCase().includes("temperature")) {
        replyEnglish = "Current field temperature is 28 degrees Celsius.";
      }

      // 4. Translate response back to the farmer's language
      const regionalReply = await translateText(replyEnglish, "en-IN", selectedLanguage);
      setResponse(regionalReply);

      // 5. Convert response to voice using Bulbul v3
      const audioBase64 = await textToSpeech(regionalReply, selectedLanguage);
      playBase64Audio(audioBase64);

    } catch (err) {
      console.error("Voice Assistant Processing Error:", err);
      setResponse("Could not process voice query. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const playBase64Audio = (base64Data: string) => {
    const audio = new Audio(`data:audio/wav;base64,${base64Data}`);
    audio.play();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white p-4 rounded-3xl shadow-2xl border border-gray-100 max-w-xs text-center flex flex-col items-center">
        {/* Mic Button */}
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={loading}
          className={`p-4 rounded-full shadow-lg transition duration-200 flex items-center justify-center ${
            isRecording 
              ? "bg-red-500 text-white animate-pulse" 
              : "bg-leaf-600 hover:bg-leaf-700 text-white"
          }`}
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>

        <p className="text-xs font-bold text-gray-700 mt-2">
          {isRecording ? "Listening..." : loading ? "Processing..." : "Tap to speak in your language"}
        </p>

        {/* User Query Display */}
        {transcript && (
          <p className="text-[11px] text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg italic w-full">
            &quot;{transcript}&quot;
          </p>
        )}

        {/* Voice Reply Display */}
        {response && (
          <div className="mt-2 text-[11px] text-leaf-700 font-semibold bg-surface-raised p-2 rounded-lg flex items-center gap-1.5 w-full">
            <Volume2 className="w-4 h-4 flex-shrink-0" />
            <span>{response}</span>
          </div>
        )}
      </div>
    </div>
  );
}