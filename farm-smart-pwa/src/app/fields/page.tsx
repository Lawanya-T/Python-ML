"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, Pencil, Plus, Save, Sprout, X } from "lucide-react";
import { api } from "@/lib/api";
import { DEMO_FIELDS } from "@/lib/demoData";
import FieldSummaryCard from "@/components/fieldSummarychart";
import BrownDropdown from "@/components/BrownDropdown";
import type { Crop, Field, SensorReading } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const CROP_STAGES: Field["growth_stage"][] = ["Sowing", "Germination", "Vegetative", "Flowering", "Fruiting", "Maturity", "Harvest"];

export default function FieldsPage() {
  const { t } = useLanguage();
  const [fields, setFields] = useState<Field[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [trends, setTrends] = useState<Record<string, SensorReading[]>>({});
  const [loading, setLoading] = useState(true);
  const [statusBusy, setStatusBusy] = useState<number | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldNameDraft, setFieldNameDraft] = useState("");
  const [fieldNameBusy, setFieldNameBusy] = useState(false);
  const [fieldNameError, setFieldNameError] = useState("");
  const [editingCropId, setEditingCropId] = useState<number | null>(null);
  const [cropDraft, setCropDraft] = useState({ name: "", growth_stage: "", nitrogen: "", phosphorus: "", potassium: "" });
  const [cropError, setCropError] = useState("");

  useEffect(() => {
    let active = true;
    api.getFields().then(async (loadedFields) => {
      const [loadedCrops, histories] = await Promise.all([
        api.getCrops().catch(() => []),
        Promise.all(loadedFields.map(async (field) => {
          try {
            return [field.id, await api.getSensorHistory(field.id, 14)] as const;
          } catch {
            return [field.id, []] as const;
          }
        })),
      ]);
      if (!active) return;
      setFields(loadedFields);
      setCrops(loadedCrops);
      setTrends(Object.fromEntries(histories));
    }).catch(() => {
      if (active) setFields(DEMO_FIELDS);
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, []);

  const toggleCropStatus = async (crop: Crop) => {
    setCropError("");
    setStatusBusy(crop.id);
    try {
      await api.setCropActive(crop.id, !crop.is_active);
      setCrops((current) => current.map((item) => item.id === crop.id ? { ...item, is_active: !item.is_active } : item));
      setFields((current) => current.map((field) => field.crop_id === crop.id
        ? { ...field, crop_is_active: !crop.is_active }
        : field));
    } catch (error) {
      setCropError(error instanceof Error ? error.message : "Could not update crop status.");
    } finally {
      setStatusBusy(null);
    }
  };

  const saveFieldName = async (event: React.FormEvent<HTMLFormElement>, fieldId: string) => {
    event.preventDefault();
    const name = fieldNameDraft.trim();
    if (!name) {
      setFieldNameError("Enter a field name.");
      return;
    }
    const duplicate = fields.some((field) => field.id !== fieldId && field.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase());
    if (duplicate) {
      setFieldNameError("That field name is already in use. Choose another name.");
      return;
    }

    setFieldNameBusy(true);
    setFieldNameError("");
    try {
      await api.renameField(fieldId, name, fields.find((field) => field.id === fieldId)?.is_demo_data === true);
      setFields((current) => current.map((field) => field.id === fieldId ? { ...field, name } : field));
      setEditingFieldId(null);
    } catch (error) {
      setFieldNameError(error instanceof Error ? error.message : "Could not rename field.");
    } finally {
      setFieldNameBusy(false);
    }
  };

  const editCrop = (crop: Crop) => {
    setCropError("");
    setEditingCropId(crop.id);
    setCropDraft({
      name: crop.name === "string" ? "" : crop.name,
      growth_stage: crop.growth_stage === "string" ? "" : crop.growth_stage,
      nitrogen: crop.npk.nitrogen?.toString() ?? "",
      phosphorus: crop.npk.phosphorus?.toString() ?? "",
      potassium: crop.npk.potassium?.toString() ?? "",
    });
  };

  const saveCrop = async (crop: Crop) => {
    setCropError("");
    setStatusBusy(crop.id);
    const nullableNumber = (value: string) => value.trim() === "" ? null : Number(value);
    try {
      const update = {
        name: cropDraft.name.trim(),
        growth_stage: cropDraft.growth_stage.trim(),
        npk: {
          nitrogen: nullableNumber(cropDraft.nitrogen),
          phosphorus: nullableNumber(cropDraft.phosphorus),
          potassium: nullableNumber(cropDraft.potassium),
        },
      };
      if (!update.name || !update.growth_stage || Object.values(update.npk).some((value) => value !== null && (!Number.isFinite(value) || value < 0))) {
        setCropError("Enter a crop name and growth stage; NPK values must be zero or greater.");
        return;
      }
      await api.updateCrop(crop.id, update);
      setCrops((current) => current.map((item) => item.id === crop.id
        ? { ...item, name: update.name, growth_stage: update.growth_stage, npk: update.npk }
        : item));
      setFields((current) => current.map((field) => field.crop_id === crop.id
        ? { ...field, crop_type: update.name, growth_stage: update.growth_stage as Field["growth_stage"], npk: update.npk }
        : field));
      setEditingCropId(null);
    } catch (error) {
      setCropError(error instanceof Error ? error.message : "Could not save crop details.");
    } finally {
      setStatusBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-10">
      <header className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">{t("My Fields")}</h1>
        <Link
          href="/fields/new"
          className="flex items-center gap-1 rounded-full bg-leaf-600 px-3 py-2 text-sm font-medium text-white active:bg-leaf-700"
        >
          <Plus size={16} /> {t("Add Field")}
        </Link>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
          <Loader2 size={18} className="animate-spin" /> {t("Loading fields…")}
        </div>
      ) : fields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-gray-400">
          {t("No fields registered yet. Tap Add Field to get started.")}
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <FieldSummaryCard field={field} readings={trends[field.id] ?? []} colorIndex={index} />
                </div>
                <button
                  type="button"
                  aria-label={`Rename ${field.name}`}
                  title={`Rename ${field.name}`}
                  onClick={() => {
                    setFieldNameDraft(field.name);
                    setFieldNameError("");
                    setEditingFieldId((current) => current === field.id ? null : field.id);
                  }}
                  className="mt-1 rounded-lg border border-line bg-surface p-2 text-leaf-700"
                >
                  <Pencil size={16} />
                </button>
              </div>
              {editingFieldId === field.id && (
                <form onSubmit={(event) => void saveFieldName(event, field.id)} className="flex flex-wrap gap-2 rounded-lg border border-line bg-surface p-3">
                  <label htmlFor={`field-name-${field.id}`} className="sr-only">Field name</label>
                  <input
                    id={`field-name-${field.id}`}
                    required
                    maxLength={150}
                    value={fieldNameDraft}
                    onChange={(event) => setFieldNameDraft(event.target.value)}
                    className="min-w-0 flex-1 rounded-md border border-line bg-white px-3 py-2 text-base"
                  />
                  <button type="submit" disabled={fieldNameBusy} className="rounded-md bg-leaf-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                    {fieldNameBusy ? "Saving…" : "Save name"}
                  </button>
                  <button type="button" aria-label="Cancel field rename" onClick={() => setEditingFieldId(null)} className="rounded-md border border-line p-2 text-gray-600">
                    <X size={17} />
                  </button>
                  {fieldNameError && <p role="alert" className="w-full text-sm text-red-700">{fieldNameError}</p>}
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && crops.length > 0 && (
        <section className="mt-8" aria-labelledby="crop-register-heading">
          <div className="mb-3 flex items-center gap-2">
            <Sprout size={18} className="text-olive" />
            <h2 id="crop-register-heading" className="text-lg font-bold text-gray-900">{t("Crop register")}</h2>
          </div>
          {cropError && <p role="alert" className="mt-3 text-sm text-red-700">{cropError}</p>}
          <div className="divide-y divide-line border-y border-line">
            {crops.map((crop) => (
              <article key={crop.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {editingCropId === crop.id ? (
                      <input
                        aria-label="Crop name"
                        value={cropDraft.name}
                        onChange={(event) => setCropDraft((draft) => ({ ...draft, name: event.target.value }))}
                        className="min-w-0 rounded-md border border-line bg-surface px-2 py-1 font-semibold"
                      />
                    ) : <h3 className="font-semibold text-gray-900">{crop.name === "string" ? t("Unspecified crop") : crop.name}</h3>}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${crop.is_active ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                      {t(crop.is_active ? "Active" : "Inactive")}
                    </span>
                    {editingCropId === crop.id ? (
                      <BrownDropdown
                        label="Crop growth stage"
                        value={cropDraft.growth_stage}
                        onChange={(value) => setCropDraft((draft) => ({ ...draft, growth_stage: value }))}
                        options={[{ value: "", label: "Choose stage" }, ...CROP_STAGES.map((stage) => ({ value: stage, label: stage }))]}
                        className="w-auto min-w-0 rounded-md px-2 py-1 text-sm"
                      />
                    ) : <span className="text-sm text-gray-500">{crop.growth_stage === "string" ? t("Stage not recorded") : crop.growth_stage}</span>}
                  </div>
                  <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                    {([
                      ["N", "nitrogen", crop.npk.nitrogen],
                      ["P", "phosphorus", crop.npk.phosphorus],
                      ["K", "potassium", crop.npk.potassium],
                    ] as const).map(([nutrient, value]) => (
                      <div key={nutrient} className="rounded-md bg-surface-raised px-2 py-1.5">
                        <dt className="text-xs text-gray-500">{nutrient} kg/ha</dt>
                        <dd className="font-semibold text-gray-800">
                          {editingCropId === crop.id ? (
                            <input
                              aria-label={`${nutrient} kg per hectare`}
                              type="number"
                              min="0"
                              step="0.1"
                              value={cropDraft[value as "nitrogen" | "phosphorus" | "potassium"]}
                              onChange={(event) => setCropDraft((draft) => ({ ...draft, [value]: event.target.value }))}
                              className="w-full min-w-0 bg-transparent outline-none"
                            />
                          ) : crop.npk[value as "nitrogen" | "phosphorus" | "potassium"] ?? t("Not recorded")}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div className="flex flex-wrap gap-2">
                  {editingCropId === crop.id ? (
                    <>
                      <button type="button" disabled={statusBusy === crop.id} onClick={() => void saveCrop(crop)} className="inline-flex items-center gap-1.5 rounded-lg bg-leaf-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">
                        <Save size={15} /> {statusBusy === crop.id ? t("Saving…") : t("Save details")}
                      </button>
                      <button type="button" onClick={() => setEditingCropId(null)} aria-label="Cancel crop edit" className="rounded-lg border border-line bg-surface p-2 text-gray-600">
                        <X size={17} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => editCrop(crop)} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-leaf-700">
                        <Pencil size={14} /> {t("Edit crop")}
                      </button>
                      <button type="button" disabled={statusBusy === crop.id} onClick={() => void toggleCropStatus(crop)} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-leaf-700 disabled:opacity-60">
                        {crop.is_active && <Check size={15} />}
                        {statusBusy === crop.id ? t("Updating…") : crop.is_active ? t("Mark inactive") : t("Mark active")}
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
