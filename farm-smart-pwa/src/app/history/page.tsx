"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Droplets, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import BrownDropdown from "@/components/BrownDropdown";
import { WaterUsageChart } from "@/components/Charts";
import { demoIrrigationHistory } from "@/lib/demoData";
import type { Field, IrrigationHistoryRecord } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function HistoryPage() {
  const { t } = useLanguage();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [historyResult, setHistoryResult] = useState<{
    fieldId: string;
    records: IrrigationHistoryRecord[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const allRecords = historyResult?.fieldId === selectedFieldId ? historyResult.records : [];
  const records = selectedDate
    ? allRecords.filter((record) => {
        const date = new Date(record.irrigated_at);
        const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        return localDate === selectedDate;
      })
    : allRecords;
  const historyLoading = Boolean(selectedFieldId) && historyResult?.fieldId !== selectedFieldId;

  useEffect(() => {
    api.getFields().then((data) => {
      setFields(data);
      setSelectedFieldId(data[0]?.id ?? "");
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedFieldId) return;
    const fieldId = selectedFieldId;
    let active = true;
    const selectedField = fields.find((field) => field.id === fieldId);
    api
      .getIrrigationHistory(fieldId)
      .then((nextRecords) => {
        if (!active) return;
        const records = nextRecords.length > 0
          ? nextRecords
          : selectedField?.is_demo_data
            ? demoIrrigationHistory(fieldId)
            : [];
        setHistoryResult({ fieldId, records });
      })
      .catch(() => {
        if (!active) return;
        setHistoryResult({
          fieldId,
          records: selectedField?.is_demo_data ? demoIrrigationHistory(fieldId) : [],
        });
      });
    return () => { active = false; };
  }, [selectedFieldId]);

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("Irrigation History")}</h1>
          {fields.find((field) => field.id === selectedFieldId) && (
            <p className="mt-1 text-sm font-medium text-gray-1000">
              {fields.find((field) => field.id === selectedFieldId)?.name} · {fields.find((field) => field.id === selectedFieldId)?.crop_type}
            </p>
          )}
        </div>
        {fields.length > 0 && (
          <BrownDropdown
            label="Select field history"
            value={selectedFieldId}
            onChange={setSelectedFieldId}
            className="max-w-44 border-gray-200 bg-white py-2 text-gray-800"
            options={fields.map((field) => ({ value: field.id, label: field.name }))}
          />
        )}
      </div>

      <section className="mb-5 rounded-xl border border-line bg-surface p-3" aria-label="Filter irrigation history by date">
        <label htmlFor="history-date" className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <CalendarDays size={16} /> Filter by date
        </label>
        <div className="flex items-center gap-2">
          <input
            id="history-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
          />
          {selectedDate && (
            <button
              type="button"
              onClick={() => setSelectedDate("")}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
            <Loader2 size={18} className="animate-spin" /> {t("Loading history…")}
        </div>
      ) : historyLoading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
            <Loader2 size={18} className="animate-spin" /> {t("Loading selected field history…")}
        </div>
      ) : (
        <>
          {records.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-1000">
              {selectedDate ? "No irrigation records for this date." : t("No irrigation records for this field yet.")}
            </p>
          ) : (
            <div className="mb-4">
              <WaterUsageChart history={records} />
            </div>
          )}

          <div className="space-y-2">
            {records.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-3"
                >
                  <div className="flex items-center gap-2">
                    <Droplets size={16} className="text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.irrigation_type}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(r.irrigated_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {r.duration_minutes !== undefined ? `${r.duration_minutes} min · ` : ""}
                        {r.status === "stopped" ? t("Stopped early") : r.status === "completed" ? t("Completed") : t("Recorded")}
                        {r.is_local ? ` · ${t("Saved on this device")}` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {(r.water_applied_liters ?? r.amount_or_duration).toFixed(0)} L
                  </span>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
