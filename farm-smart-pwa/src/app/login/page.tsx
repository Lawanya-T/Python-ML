"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, LockKeyhole, Phone } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import AuthFrame from "@/components/AuthFrame";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ identifier: phone, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't log you in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame
      eyebrow={t("WELCOME FARMER")}
      title={t("Log in to your farm")}
      description={t("Track fields, weather, and irrigation in one calm place.")}
      variant="forest"
      footer={
        <>
          {t("New here?")}{" "}
          <Link href="/register" className="font-bold text-white underline decoration-[#D5BF8C]/70 underline-offset-4">
            {t("Create an account")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-100">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
            {t("phoneNumber")}
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3.5 shadow-inner shadow-black/10 transition focus-within:border-[#D5BF8C]/70 focus-within:bg-white/10">
            <Phone size={17} className="text-[#E4CDA5]" />
            <input
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("Enter your phone number")}
              required
              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/45"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
            {t("Password")}
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3.5 shadow-inner shadow-black/10 transition focus-within:border-[#D5BF8C]/70 focus-within:bg-white/10">
            <LockKeyhole size={17} className="text-[#E4CDA5]" />
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("Enter your password")}
              required
              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/45"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#9A7854] via-[#765337] to-[#563B29] px-4 py-3.5 font-bold text-white shadow-[0_12px_24px_rgba(43,29,21,0.28)] transition hover:brightness-110 disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? t("Logging in...") : t("Log in")}
        </button>
      </form>
    </AuthFrame>
  );
}
