// src/app/register/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import AuthFrame from "@/components/AuthFrame";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("Passwords don't match."));
      return;
    }
    if (password.length < 6) {
      setError(t("Password must be at least 6 characters."));
      return;
    }

    setLoading(true);
    try {
      await register({ name, phone, email: email || undefined, password });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame
      eyebrow={t("START GROWING")}
      title={t("Create your farm account")}
      description={t("Join a calmer, smarter way to care for every field you grow.")}
      variant="forest"
      footer={
        <>
          {t("Already have an account?")}{" "}
          <Link href="/login" className="font-bold text-white underline decoration-[#D5BF8C]/70 underline-offset-4">
            {t("Log in")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-100">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
            {t("Full name")}
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3.5 transition focus-within:border-[#D5BF8C]/70 focus-within:bg-white/10">
            <UserRound size={17} className="text-[#E4CDA5]" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ramesh Patil"
              required
              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/45"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
            {t("phoneNumber")}
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3.5 transition focus-within:border-[#D5BF8C]/70 focus-within:bg-white/10">
            <Phone size={17} className="text-[#E4CDA5]" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/45"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
            {t("Email (optional)")}
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3.5 transition focus-within:border-[#D5BF8C]/70 focus-within:bg-white/10">
            <Mail size={17} className="text-[#E4CDA5]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ramesh@example.com"
              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/45"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
            {t("Password")}
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3.5 transition focus-within:border-[#D5BF8C]/70 focus-within:bg-white/10">
            <LockKeyhole size={17} className="text-[#E4CDA5]" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("At least 6 characters")}
              required
              className="w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/45"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
            {t("Confirm password")}
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3.5 transition focus-within:border-[#D5BF8C]/70 focus-within:bg-white/10">
            <LockKeyhole size={17} className="text-[#E4CDA5]" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("Re-enter password")}
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
          {loading ? t("Creating account...") : t("Create account")}
        </button>
      </form>
    </AuthFrame>
  );
}