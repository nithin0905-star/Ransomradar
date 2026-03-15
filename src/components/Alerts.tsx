import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { AlertTriangle, AlertCircle, AlertOctagon } from "lucide-react";

interface Alert {
  id: string;
  endpoint_name: string;
  alert_type: string;
  message: string;
  severity: string;
  detected_at: string;
  created_at: string;
}

const severityColors = {
  critical: {
    bg: "bg-red-50",
    text: "text-red-900",
    badge: "bg-red-100 text-red-800",
    icon: AlertOctagon,
  },
  high: {
    bg: "bg-orange-50",
    text: "text-orange-900",
    badge: "bg-orange-100 text-orange-800",
    icon: AlertTriangle,
  },
  medium: {
    bg: "bg-yellow-50",
    text: "text-yellow-900",
    badge: "bg-yellow-100 text-yellow-800",
    icon: AlertCircle,
  },
  low: {
    bg: "bg-blue-50",
    text: "text-blue-900",
    badge: "bg-blue-100 text-blue-800",
    icon: AlertCircle,
  },
};

export function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data, error } = await supabase
          .from("alerts")
          .select("*")
          .order("detected_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        setAlerts(data || []);
      } catch (error) {
        console.error("Failed to fetch alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();

    const subscription = supabase
      .channel("alerts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          setAlerts((prev) => [payload.new as Alert, ...prev]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Security Alerts</h2>
        <p className="text-gray-600 mt-2">
          Latest ransomware detection alerts and suspicious activities
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading alerts...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No alerts yet. Your system is secure.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const severity = alert.severity as keyof typeof severityColors;
            const colors = severityColors[severity] || severityColors.low;
            const Icon = colors.icon;

            return (
              <div
                key={alert.id}
                className={`rounded-lg border border-gray-200 p-4 ${colors.bg}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${colors.text}`}>
                          {alert.endpoint_name}
                        </h3>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${colors.badge}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${colors.text}`}>
                        {alert.alert_type}
                      </p>
                      <p className="text-sm text-gray-700 mt-2">{alert.message}</p>
                      <p className="text-xs text-gray-600 mt-3">
                        Detected:{" "}
                        {new Date(alert.detected_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
