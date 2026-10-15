// src/lib/notify.ts
import type { IrrigationAlert } from "@/lib/alerts";

export async function dispatchAlertNotifications(
  alert: IrrigationAlert,
  prefs: { phone?: string; email?: string; pushSubscription?: PushSubscription | null }
) {
  const shouldNotify = alert.severity === "critical"
    || alert.type === "irrigation_reminder"
    || (alert.type === "weather_warning" && alert.severity === "warning");
  if (!shouldNotify) return;

  const tasks: Promise<Response>[] = [];

  if (prefs.phone) {
    tasks.push(
      fetch("/api/notify/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: prefs.phone, message: alert.message }),
      })
    );
  }

  if (prefs.email) {
    tasks.push(
      fetch("/api/notify/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: prefs.email,
          subject: `${alert.severity === "critical" ? "Critical" : "Field"} alert: ${alert.fieldName}`,
          message: alert.message,
        }),
      })
    );
  }

  if (prefs.pushSubscription) {
    tasks.push(
      fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: prefs.pushSubscription,
          title: alert.title,
          body: `${alert.fieldName}: ${alert.message}`,
          url: "/#alerts",
        }),
      })
    );
  }

  await Promise.allSettled(tasks);
}