import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { AlertTriangle, TrendingUp } from "lucide-react";

export function Dashboard() {
  const [stats, setStats] = useState({
    critical: 0,
    high: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from("alerts")
          .select("severity", { count: "exact" });

        if (error) throw error;

        const critical = data?.filter((a) => a.severity === "critical").length || 0;
        const high = data?.filter((a) => a.severity === "high").length || 0;

        setStats({
          critical,
          high,
          total: data?.length || 0,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-2">
          Real-time ransomware detection and alert monitoring
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {loading ? "-" : stats.critical}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High Alerts</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {loading ? "-" : stats.high}
              </p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Alerts</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {loading ? "-" : stats.total}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Slack Integration Status
        </h3>
        <p className="text-gray-600">
          Configure your Slack webhook URL in Settings to receive real-time
          notifications for critical and high-severity alerts.
        </p>
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            💡 Alerts with severity "critical" or "high" will automatically send
            Slack notifications when configured.
          </p>
        </div>
      </div>
    </div>
  );
}
