"use client";

import { useEffect, useState } from "react";
import { User, Loader2 } from "lucide-react";
import * as api from "@/lib/api";

type Field = {
  id: number;
};

export default function DashboardPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.resolve(api.getFields() as unknown as Field[] | void)
      .then((fetchedFields) => {
        setFields(fetchedFields ?? []);
      })
      .catch(() => {
        setFields([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Welcome back,</p>
          <h1 className="text-xl font-bold text-gray-900">Your Fields</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8DDC9] text-leaf-700">
          <User size={20} />
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
          <Loader2 size={18} className="animate-spin" /> Loading your fields…
        </div>
      ) : (
        <>
          <h2 className="mb-2 text-sm font-semibold text-gray-500">All Fields ({fields.length})</h2>
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">Field {field.id}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
