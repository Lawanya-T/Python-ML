"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Plus, Sparkles } from "lucide-react";
import * as api from "@/lib/api";
import BrownDropdown from "@/components/BrownDropdown";
import TodaysSchedule from "@/components/todaysScheduler";
import type { Field } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function SchedulePage() {
  const { t } = useLanguage();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [scheduleRefreshKey, setScheduleRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getFields()
      .then((data) => {
        setFields(data);
        if (data.length > 0) setSelectedFieldId(data[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? fields[0] ?? null;
  const features = selectedField
    ? {
        crop_type: selectedField.crop_type,
        moisture: selectedField.moisture,
        temp: (selectedField as Field & { temp?: number }).temp ?? 28,
        humidity: (selectedField as Field & { humidity?: number }).humidity ?? 55,
        area_hectare: selectedField.area_hectare ?? selectedField.area_acres / 2.471,
      }
    : {};

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
          <Loader2 size={18} className="animate-spin" /> {t("Loading schedule…")}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-10">
      <div className="mb-5 flex items-center gap-2">
        <CalendarClock className="text-leaf-600" size={20} />
        <h1 className="text-xl font-bold text-gray-900">{t("Irrigation Schedule")}</h1>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-gray-500">
          {t("No fields available to schedule.")}
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="mb-1 block text-sm font-large text-white-800">{t("Select Field")}</label>
            <BrownDropdown
              options={fields.map((field) => ({ value: field.id, label: field.name }))}
              value={selectedField?.id ?? selectedFieldId}
              label={t("Select Field")}
              onChange={setSelectedFieldId}
            />
          </div>

          {selectedField && (
            <>
              <div className="mb-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setScheduleRefreshKey((current) => current + 1)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-leaf-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-leaf-700"
                >
                  <Plus size={17} /> {t("Create schedule")}
                </button>
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("open-ai-assistant", {
                    detail: `Help me plan irrigation for ${selectedField.name}, growing ${selectedField.crop_type}.`,
                  }))}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-leaf-600 bg-surface px-4 py-2.5 text-sm font-semibold text-leaf-700 shadow-sm transition hover:bg-surface-raised"
                >
                  <Sparkles size={17} /> {t("Ask AI")}
                </button>
              </div>
              <TodaysSchedule
                key={selectedField.id}
                field={{ id: selectedField.id }}
                features={features}
                refreshKey={scheduleRefreshKey}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
