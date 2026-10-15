"use client";

import { useState } from "react";
import { Check, Globe, MapPin, Pencil, Phone, Save, User, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import BrownDropdown from "@/components/BrownDropdown";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { FarmerProfile } from "@/types";
import type { Lang } from "@/lib/i18n/translations";

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
] as const;

export default function ProfilePage() {
  const { user, profile, profileNeedsCompletion, updateProfile } = useAuth();
  const { t } = useLanguage();

  if (!profile) {
    return <div className="mx-auto max-w-2xl px-4 py-8 text-sm text-gray-500">{t("Loading profile…")}</div>;
  }

  return (
    <ProfileEditor
      key={user?.id}
      profile={profile}
      profileNeedsCompletion={profileNeedsCompletion}
      updateProfile={updateProfile}
    />
  );
}

function ProfileEditor({
  profile,
  profileNeedsCompletion,
  updateProfile,
}: {
  profile: FarmerProfile;
  profileNeedsCompletion: boolean;
  updateProfile: (profile: FarmerProfile) => void;
}) {
  const { setLang, darkMode, setDarkMode, t } = useLanguage();
  const [draft, setDraft] = useState<FarmerProfile | null>(profile);
  const [editing, setEditing] = useState(profileNeedsCompletion);

  if (!draft) {
    return <div className="mx-auto max-w-2xl px-4 py-8 text-sm text-gray-500">{t("Loading profile…")}</div>;
  }

  const update = <K extends keyof FarmerProfile>(key: K, value: FarmerProfile[K]) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  };

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile(draft);
    setLang(draft.preferred_language as Lang);
    setEditing(false);
  };

  const inputClass = "mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-leaf-900 outline-none transition focus:border-leaf-500 focus:ring-2 focus:ring-lime/40";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("Profile")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("Your account and farming details")}</p>
        </div>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-leaf-600 px-3.5 text-sm font-semibold text-white transition hover:bg-leaf-700">
            <Pencil size={16} /> {t("Edit profile")}
          </button>
        )}
      </div>

      {profileNeedsCompletion && (
        <div className="mb-5 rounded-lg border border-[#D6C5A8] bg-[#EEE4D2] px-4 py-3 text-sm text-leaf-900">
          Complete your farming details to finish setting up your new account.
                  {t("Complete your farming details to finish setting up your new account.")}
        </div>
      )}

      <section className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-line bg-surface p-4" aria-labelledby="appearance-heading">
        <div className="min-w-0">
          <h2 id="appearance-heading" className="font-semibold text-gray-900">{t("Appearance")}</h2>
          <p className="mt-1 text-sm text-gray-600">{t("Use dark colors across the app")}</p>
          <p className="sr-only" role="status">{t(darkMode ? "Dark mode enabled" : "Light mode")}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={darkMode}
          aria-label={t("Dark mode")}
          onClick={() => setDarkMode(!darkMode)}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${darkMode ? "bg-leaf-600" : "bg-gray-300"}`}
        >
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-6" : "translate-x-1"}`} />
        </button>
      </section>

      <div className="mb-5 flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#E8DDC9] text-leaf-700">
          <User size={28} />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-gray-900">{profile.name || "Your name"}</h2>
          <p className="truncate text-sm text-gray-500">{profile.village || t("Location not added")}</p>
        </div>
      </div>

      {editing ? (
        <form onSubmit={save} className="space-y-5 rounded-xl border border-gray-100 bg-white p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              {t("fullName")}
              <input autoComplete="name" required value={draft.name} onChange={(event) => update("name", event.target.value)} className={inputClass} />
            </label>
            <label className="text-sm font-medium text-gray-700">
              {t("phoneNumber")}
              <span className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700">
                <Phone size={16} className="text-gray-400" /> {profile.phone || "Not provided"}
              </span>
              <span className="mt-1 block text-xs font-normal text-gray-500">{t("Your sign-in number")}</span>
            </label>
            <label className="text-sm font-medium text-gray-700">
              {t("Email")}
              <input type="email" autoComplete="email" value={draft.email} onChange={(event) => update("email", event.target.value)} className={inputClass} />
            </label>
            <label className="text-sm font-medium text-gray-700">
              {t("villageLocation")}
              <input value={draft.village} onChange={(event) => update("village", event.target.value)} required={profileNeedsCompletion} className={inputClass} />
            </label>
            <label className="text-sm font-medium text-gray-700">
              {t("landSize")}
              <input type="number" min="0.1" step="0.1" value={draft.land_size_acres || ""} onChange={(event) => update("land_size_acres", Number(event.target.value))} required={profileNeedsCompletion} className={inputClass} />
            </label>
            <label className="text-sm font-medium text-gray-700">
              {t("farmingExperience")}
              <input type="number" min="0" step="1" value={draft.farming_experience_years} onChange={(event) => update("farming_experience_years", Number(event.target.value))} required={profileNeedsCompletion} className={inputClass} />
            </label>
            <label className="text-sm font-medium text-gray-700 sm:col-span-2">
              {t("preferredCrops")}
              <input value={draft.preferred_crops.join(", ")} onChange={(event) => update("preferred_crops", event.target.value.split(",").map((crop) => crop.trim()).filter(Boolean))} placeholder="eg: Wheat, tomato, cotton" className={inputClass} />
            </label>
            <label className="text-sm font-medium text-gray-700">
              {t("preferredLanguage")}
              <div className="mt-1 flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3">
                <Globe size={16} className="shrink-0 text-gray-400" />
                <BrownDropdown
                  label={t("preferredLanguage")}
                  value={draft.preferred_language}
                  onChange={(value) => update("preferred_language", value as FarmerProfile["preferred_language"])}
                  options={LANGUAGES.map((language) => ({ value: language.code, label: language.label }))}
                  className="border-0 bg-transparent px-0 py-2.5 text-sm text-gray-900 focus:ring-0"
                />
              </div>
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={draft.notifications_enabled} onChange={(event) => update("notifications_enabled", event.target.checked)} className="h-4 w-4 accent-[#765337]" />
              {t("Receive notifications")}
            </label>
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
            {!profileNeedsCompletion && (
              <button type="button" onClick={() => { setDraft(profile); setEditing(false); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 px-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <X size={16} /> Cancel
              </button>
            )}
            <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-leaf-600 px-3.5 text-sm font-semibold text-white transition hover:bg-leaf-700">
              {profileNeedsCompletion ? <Check size={16} /> : <Save size={16} />}
              {profileNeedsCompletion ? t("Finish profile") : t("saveProfile")}
            </button>
          </div>
        </form>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileDetail icon={<Phone size={18} />} label="Phone" value={profile.phone || t("Not provided")} />
          <ProfileDetail icon={<User size={18} />} label="Email" value={profile.email || t("Not added")} />
          <ProfileDetail icon={<MapPin size={18} />} label="Location" value={profile.village || t("Not added")} />
          <ProfileDetail icon={<MapPin size={18} />} label="Land area" value={profile.land_size_acres ? `${profile.land_size_acres} ${t("acres")}` : t("Not added")} />
          <ProfileDetail icon={<MapPin size={18} />} label="Farming experience" value={`${profile.farming_experience_years} ${t("years")}`} />
          <ProfileDetail icon={<Globe size={18} />} label="Preferred language" value={LANGUAGES.find((language) => language.code === profile.preferred_language)?.label ?? "English"} />
          <ProfileDetail icon={<MapPin size={18} />} label="Preferred crops" value={profile.preferred_crops.length ? profile.preferred_crops.join(", ") : t("Not added")} />
          <ProfileDetail icon={<Check size={18} />} label="Notifications" value={profile.notifications_enabled ? t("On") : t("Off")} />
        </div>
      )}
    </div>
  );
}

function ProfileDetail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-xl border border-gray-100 bg-white p-4">
      <span className="mt-0.5 shrink-0 text-gray-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{t(label)}</p>
        <p className="break-words text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}
