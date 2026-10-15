"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import BrownDropdown from "@/components/BrownDropdown";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const CROPS = ["Wheat", "Rice", "Maize", "Potato", "Sugarcane"];
const GROWTH_STAGES = ["Sowing", "Vegetative", "Harvest"];
const SOIL_TYPES = ["Loamy", "Sandy", "Silt"];

export default function NewFieldPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    location: "",
    crop_type: CROPS[0],
    growth_stage: GROWTH_STAGES[0],
    area_hectare: "",
    soil_type: SOIL_TYPES[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createField({
        farmer_id: 1, // TODO: replace with the logged-in farmer's id once auth is wired
        name: form.name,
        location: form.location,
        crop_type: form.crop_type,
        growth_stage: form.growth_stage,
        area_hectare: parseFloat(form.area_hectare) || 0,
        soil_type: form.soil_type,
      });
      router.push("/fields");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save this field — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t("Add Field")}</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t("Field name")}</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. North Plot"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base focus:border-leaf-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t("Field location")}</label>
          <input
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Dharwad, Karnataka"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base focus:border-leaf-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t("Crop type")}</label>
          <BrownDropdown
            label={t("Crop type")}
            value={form.crop_type}
            onChange={(value) => setForm({ ...form, crop_type: value })}
            options={CROPS.map((crop) => ({ value: crop, label: crop }))}
            className="text-base"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t("Growth stage")}</label>
          <BrownDropdown
            label={t("Growth stage")}
            value={form.growth_stage}
            onChange={(value) => setForm({ ...form, growth_stage: value })}
            options={GROWTH_STAGES.map((stage) => ({ value: stage, label: stage }))}
            className="text-base"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t("Soil type")}</label>
          <BrownDropdown
            label={t("Soil type")}
            value={form.soil_type}
            onChange={(value) => setForm({ ...form, soil_type: value })}
            options={SOIL_TYPES.map((soil) => ({ value: soil, label: soil }))}
            className="text-base"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t("Area (hectares)")}</label>
          <input
            required
            type="number"
            step="0.1"
            min="0"
            value={form.area_hectare}
            onChange={(e) => setForm({ ...form, area_hectare: e.target.value })}
            placeholder="e.g. 1.2"
            className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base focus:border-leaf-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-leaf-600 py-3 font-medium text-white active:bg-leaf-700 disabled:opacity-60"
        >
          {submitting ? t("Saving…") : t("Save Field")}
        </button>
      </form>
    </div>
  );
}
