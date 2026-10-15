"use client";

import { useEffect, useState } from "react";
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Check, 
  BellOff, 
  Clock,
  BellRing,
  Bell,
} from "lucide-react";
import { IrrigationAlert, initialAlerts } from "@/lib/alerts";
import { subscribeToPush } from "@/lib/push";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface AlertsListProps {
  alerts?: IrrigationAlert[];
  onPushEnabled?: () => void;
}

export default function AlertsList({ alerts: initialData = initialAlerts, onPushEnabled }: AlertsListProps) {
  const { t } = useLanguage();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState("");

  useEffect(() => {
    try {
      const storedIds = JSON.parse(localStorage.getItem("read_field_alerts") || "[]") as string[];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReadIds(new Set(storedIds));
    } catch {
      setReadIds(new Set());
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => registration.pushManager.getSubscription())
        .then((subscription) => setPushEnabled(Boolean(subscription)))
        .catch(() => setPushEnabled(false));
    }
  }, []);

  const alertList = initialData.map((alert) => ({
    ...alert,
    isRead: alert.isRead || readIds.has(alert.id),
  }));

  const markAsRead = (id: string) => {
    const nextReadIds = new Set(readIds).add(id);
    setReadIds(nextReadIds);
    localStorage.setItem("read_field_alerts", JSON.stringify([...nextReadIds]));
  };

  const markAllAsRead = () => {
    const nextReadIds = new Set([...readIds, ...alertList.map((alert) => alert.id)]);
    setReadIds(nextReadIds);
    localStorage.setItem("read_field_alerts", JSON.stringify([...nextReadIds]));
  };

  const enablePush = async () => {
    setPushBusy(true);
    setPushMessage("");
    try {
      const subscription = await subscribeToPush();
      setPushEnabled(Boolean(subscription));
      setPushMessage(subscription ? "Push alerts enabled on this device." : "Push notifications are not supported in this browser.");
      if (subscription) onPushEnabled?.();
    } catch (error) {
      setPushMessage(error instanceof Error ? error.message : "Could not enable push alerts.");
    } finally {
      setPushBusy(false);
    }
  };

  const getSeverityBadge = (severity: IrrigationAlert["severity"]) => {
    switch (severity) {
      case "critical":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />,
          bgColor: "bg-red-50 border-red-100",
          badgeColor: "bg-red-100 text-red-800",
          label: t("Critical"),
        };
      case "warning":
        return {
          icon: <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
          bgColor: "bg-amber-50 border-amber-100",
          badgeColor: "bg-amber-100 text-amber-800",
          label: t("Warning"),
        };
      case "info":
      default:
        return {
          icon: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
          bgColor: "bg-blue-50 border-blue-100",
          badgeColor: "bg-blue-100 text-blue-800",
          label: t("Info"),
        };
    }
  };

  const unreadCount = alertList.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between pt-1 pb-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-gray-800">{t("System Alerts")}</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {unreadCount} {t("New")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-semibold text-leaf-600 transition hover:text-leaf-700"
            >
              {t("Mark all as read")}
            </button>
          )}
          <button
            type="button"
            onClick={enablePush}
            disabled={pushBusy || pushEnabled}
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs font-semibold text-leaf-700 disabled:opacity-60"
          >
            {pushEnabled ? <BellRing size={14} /> : <Bell size={14} />}
            {pushBusy ? t("Enabling…") : pushEnabled ? t("Push on") : t("Enable push")}
          </button>
        </div>
      </div>

      {pushMessage && <p role="status" className="text-xs text-gray-500">{pushMessage}</p>}

      {/* Empty State */}
      {alertList.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 text-center">
          <BellOff className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-500">{t("No active alerts")}</p>
        </div>
      ) : (
        /* Alerts List */
        <div className="space-y-2.5">
          {alertList.map((alert) => {
            const style = getSeverityBadge(alert.severity);

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition shadow-sm flex items-start gap-3 relative ${
                  alert.isRead ? "bg-white border-gray-100 opacity-75" : `${style.bgColor}`
                }`}
              >
                {style.icon}

                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${style.badgeColor}`}
                    >
                      {style.label}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-700">
                      {alert.fieldName}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-gray-900">{t(alert.title)}</h4>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    {alert.message}
                  </p>

                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                {!alert.isRead && (
                  <button
                    onClick={() => markAsRead(alert.id)}
                    title={t("Mark as read")}
                    className="rounded-lg border border-line bg-surface/80 p-1 text-gray-400 transition hover:bg-surface hover:text-leaf-600"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}