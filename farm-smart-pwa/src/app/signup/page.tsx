"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, Phone, MapPin, Lock, Eye, EyeOff, Globe } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import BrownDropdown from "@/components/BrownDropdown";
import type { FarmerProfile } from "@/types";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "pa", label: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
];

type AuthFieldProps = {
  label: string;
  icon?: React.ReactNode;
  required?: boolean;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  trailing?: React.ReactNode;
};

function AuthField({
  label,
  icon,
  required = false,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  value,
  onChange,
  trailing,
}: AuthFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-leaf-900">
        {label}
        {required && <span className="ml-1 text-coral">*</span>}
      </label>
      <div className="flex items-center gap-3 rounded-2xl border border-leaf-900/10 bg-white px-4 focus-within:border-leaf-600 focus-within:ring-2 focus-within:ring-leaf-600/20">
        {icon && <div className="text-leaf-600">{icon}</div>}
        <input
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="min-w-0 flex-1 bg-transparent py-3.5 text-base text-leaf-900 placeholder:text-leaf-900/35 focus:outline-none"
        />
        {trailing && <div className="flex items-center">{trailing}</div>}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const { register } = useAuth();
  const { setLang, t } = useLanguage();
  const [form, setForm] = useState({ name: "", phone: "", village: "", language: "en", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.password.length < 6) {
      setError(t("Password must be at least 6 characters."));
      return;
    }
    setSubmitting(true);
    try {
      const preferredLanguage = form.language as FarmerProfile["preferred_language"];
      await register({ name: form.name, phone: form.phone, password: form.password }, {
        name: form.name,
        phone: form.phone,
        email: "",
        village: form.village.trim(),
        land_size_acres: 0,
        farming_experience_years: 0,
        preferred_crops: [],
        preferred_language: preferredLanguage,
        notifications_enabled: true,
      });
      setLang(preferredLanguage);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("We couldn't create your account. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-paper">
      <div className="mx-auto max-w-md pb-10">
        <div
          className="relative h-[24vh] min-h-[160px] rounded-b-[36px] bg-cover bg-center"
          style={{ backgroundImage: "url('/images/farmer-login.png')" }}
        >
          <Link
            href="/login"
            aria-label="Back"
            className="absolute left-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-leaf-900 shadow-sm"
          >
            <ArrowLeft size={20} />
          </Link>
        </div>

        <div className="px-6 pt-6">
          <h1 className="font-display text-[28px] leading-tight text-leaf-900">{t("Create your account")}</h1>
          <p className="mt-1 text-sm text-leaf-900/70">{t("It takes a minute. Then add your first field.")}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <AuthField label={t("Full name")} icon={<User size={18} />} required autoComplete="name"
              placeholder={t("Your name")} value={form.name} onChange={update("name")} />
            <AuthField label={t("phoneNumber")} icon={<Phone size={18} />} required type="tel" inputMode="tel"
              autoComplete="tel" placeholder={t("10-digit mobile number")} value={form.phone} onChange={update("phone")} />
            <AuthField label={t("Village or town (optional)")} icon={<MapPin size={18} />}
              placeholder={t("Where your fields are")} value={form.village} onChange={update("village")} />

            <div>
              <label htmlFor="language" className="mb-1.5 block text-sm font-semibold text-leaf-900">{t("Language")}</label>
              <div className="flex items-center gap-3 rounded-2xl border border-leaf-900/10 bg-white px-4 focus-within:border-leaf-600 focus-within:ring-2 focus-within:ring-leaf-600/20">
                <Globe size={18} className="text-leaf-600" />
                <BrownDropdown
                  id="language"
                  label={t("Language")}
                  value={form.language}
                  onChange={(value) => setForm({ ...form, language: value as typeof form.language })}
                  options={LANGUAGES.map((language) => ({ value: language.code, label: language.label }))}
                  className="min-w-0 flex-1 border-0 bg-transparent py-3.5 text-base text-leaf-900 focus:ring-0"
                />
              </div>
            </div>

            <AuthField label={t("Password")} icon={<Lock size={18} />} required autoComplete="new-password"
              type={showPassword ? "text" : "password"} placeholder={t("At least 6 characters")}
              value={form.password} onChange={update("password")}
              trailing={
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t("Hide password") : t("Show password")} className="text-leaf-900/50">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              } />

            {error && <p role="alert" className="rounded-xl bg-coral/10 px-3 py-2 text-sm text-leaf-900">{error}</p>}

            <button type="submit" disabled={submitting}
              className="w-full rounded-full bg-leaf-600 py-4 text-lg font-bold text-white shadow-[0_10px_24px_-8px_rgba(77,53,37,0.45)] transition-transform active:scale-[0.98] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-900">
              {submitting ? t("Creating account…") : t("Create account")}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-leaf-900/70">
            {t("Already have an account?")}{" "}
            <Link href="/login" className="font-bold text-leaf-600 underline underline-offset-4">{t("Log in")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
