import Link from "next/link";
import { Droplets, Thermometer, Sprout, ChevronRight } from "lucide-react";
import type { Field, SensorReading } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface Props {
  field: Field;
  latestReading?: SensorReading;
  temperature?: number;
  readings?: SensorReading[];
  colorIndex?: number;
}

const FIELD_CARD_SHADES = [
  "border-[#9FD49B] bg-[#DDF6D7]",
  "border-[#8CCFE7] bg-[#D8F2FF]",
  "border-[#F0CD71] bg-[#FFF1BD]",
  "border-[#EBA99A] bg-[#FFE0D8]",
];

function moistureLabel(value: number | undefined, t: (key: string) => string): { label: string; color: string } {
  if (typeof value !== "number" || !Number.isFinite(value)) return { label: t("No data"), color: "bg-gray-200 text-gray-500" };
  if (value < 30) return { label: t("Dry"), color: "bg-amber-100 text-amber-700" };
  if (value < 60) return { label: t("Moderate"), color: "bg-[#E8E7D8] text-[#59623E]" };
  return { label: t("Wet"), color: "bg-blue-100 text-blue-700" };
}

export default function FieldSummaryCard({ field, latestReading, temperature, readings = [], colorIndex = 0 }: Props) {
  const { t, darkMode } = useLanguage();
  const recordedReadings = readings
    .filter((reading) => reading.is_demo_data !== true)
    .slice()
    .sort((first, second) => new Date(first.recorded_at).getTime() - new Date(second.recorded_at).getTime())
    .slice(-10);
  const currentReading = latestReading ?? recordedReadings.at(-1);
  const moisture = moistureLabel(currentReading?.moisture_value ?? field.moisture, t);

  return (
    <Link
      href={`/fields/${field.id}`}
      className={`flex items-center justify-between rounded-xl border p-4 shadow-sm transition-transform active:scale-[0.98] ${FIELD_CARD_SHADES[colorIndex % FIELD_CARD_SHADES.length]}`}
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className={`text-base font-semibold ${darkMode ? "text-[#263b2c]" : "text-gray-900"}`}>{field.name}</h3>
          {field.is_demo_data && <span className={`rounded-full bg-white/75 px-2 py-0.5 text-xs font-medium ${darkMode ? "text-[#405344]" : "text-gray-600"}`}>Device only</span>}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${moisture.color}`}>
            {moisture.label}
          </span>
        </div>
        <p className={`mt-0.5 text-sm ${darkMode ? "text-[#405344]" : "text-gray-500"}`}>
          {field.crop_type} · {field.growth_stage}
          {field.crop_is_active !== undefined && (
            <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${field.crop_is_active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
              {t(field.crop_is_active ? "Active crop" : "Inactive crop")}
            </span>
          )}
        </p>

        <div className={`mt-3 flex gap-4 text-sm ${darkMode ? "text-[#354a39]" : "text-gray-600"}`}>
          <span className="flex items-center gap-1">
            <Droplets size={15} className="text-blue-500" />
            {currentReading && typeof currentReading.moisture_value === "number" ? `${currentReading.moisture_value.toFixed(0)}%` : typeof field.moisture === "number" ? `${field.moisture.toFixed(0)}%` : "—"}
          </span>
          <span className="flex items-center gap-1">
            <Thermometer size={15} className="text-orange-500" />
            {temperature !== undefined || field.temp !== undefined ? `${(temperature ?? field.temp)?.toFixed(0)}°C` : "—"}
          </span>
          <span className="flex items-center gap-1">
            <Sprout size={15} className="text-olive" />
            {(field.area_hectare ?? field.area_acres / 2.471).toFixed(1)} ha
          </span>
        </div>
        <div className="mt-3 flex items-end gap-1" role="img" aria-label={recordedReadings.length ? `Soil moisture trend across ${recordedReadings.length} recorded readings` : "No soil moisture trend readings yet"}>
          {recordedReadings.length > 0 ? recordedReadings.map((reading) => (
            <span
              key={reading.id}
              className="min-h-1 flex-1 rounded-t-sm bg-sky"
              style={{ height: `${Math.max(4, Math.min(34, reading.moisture_value * 0.34))}px` }}
              title={`${reading.source === "manual" ? "Manual" : "Sensor"} · ${reading.moisture_value.toFixed(0)}% · ${new Date(reading.recorded_at).toLocaleDateString()}`}
            />
          )) : <span className={`text-xs ${darkMode ? "text-[#526856]" : "text-gray-500"}`}>{t("Moisture trend: no readings yet")}</span>}
        </div>
      </div>
      <ChevronRight size={20} className="text-gray-300" />
    </Link>
  );
}
