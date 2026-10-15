// src/app/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import { FileText, FileSpreadsheet, Loader2 } from "lucide-react";
import * as api from "@/lib/api";
import BrownDropdown from "@/components/BrownDropdown";
import type { Field, IrrigationHistoryRecord } from "@/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ReportsPage() {
  const { t } = useLanguage();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [records, setRecords] = useState<IrrigationHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getFields()
      .then(setFields)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedFieldId) return;
    api.getIrrigationHistory(selectedFieldId, 30).then(setRecords);
  }, [selectedFieldId]);

  const exportCSV = () => {
    const field = fields.find((f) => f.id === selectedFieldId);
    const header = "Date,Irrigation Type,Amount/Duration (L)\n";
    const rows = records
      .map((r) => `${new Date(r.irrigated_at).toLocaleDateString()},${r.irrigation_type},${r.amount_or_duration}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${field?.name ?? "field"}-irrigation-history.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const field = fields.find((f) => f.id === selectedFieldId);
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text(`Irrigation Report — ${field?.name ?? "Field"}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Crop: ${field?.crop_type ?? "-"}  |  Stage: ${field?.growth_stage ?? "-"}`, 14, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);

    let y = 44;
    doc.setFontSize(11);
    doc.text("Date", 14, y);
    doc.text("Type", 70, y);
    doc.text("Amount (L)", 150, y);
    y += 6;
    doc.line(14, y - 4, 196, y - 4);

    records.forEach((r) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(new Date(r.irrigated_at).toLocaleDateString(), 14, y);
      doc.text(r.irrigation_type, 70, y);
      doc.text(`${r.amount_or_duration}`, 150, y);
      y += 7;
    });

    doc.save(`${field?.name ?? "field"}-irrigation-report.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-gray-400">
        <Loader2 size={18} className="animate-spin" /> {t("Loading…")}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-10">
      <h1 className="mb-5 text-xl font-bold text-gray-900">{t("Field Reports")}</h1>

      <div className="mb-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">{t("Select Field")}</label>
        <BrownDropdown
          label={t("Select Field")}
          value={selectedFieldId}
          onChange={setSelectedFieldId}
          options={fields.map((field) => ({ value: field.id, label: field.name }))}
        />
      </div>

      <p className="mb-4 text-sm text-gray-500">{t("{count} irrigation records found.").replace("{count}", String(records.length))}</p>

      <div className="space-y-3">
        <button
          onClick={exportPDF}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-leaf-600 py-3.5 font-semibold text-white hover:bg-leaf-700"
        >
          <FileText size={18} /> {t("Download PDF Report")}
        </button>
        <button
          onClick={exportCSV}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3.5 font-semibold text-gray-700 hover:bg-gray-50"
        >
          <FileSpreadsheet size={18} /> {t("Export CSV")}
        </button>
      </div>
    </div>
  );
}
