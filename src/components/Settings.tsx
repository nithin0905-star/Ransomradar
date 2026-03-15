import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "./Toast";
import { Send, Loader } from "lucide-react";

export function Settings() {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [session, setSession] = useState<any>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data, error } = await supabase
          .from("webhooks")
          .select("slack_url")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching webhook:", error);
        } else if (data) {
          setWebhookUrl(data.slack_url);
        }
      }
      setLoading(false);
    };

    getSession();
  }, []);

  const handleSaveWebhook = async () => {
    if (!webhookUrl.trim()) {
      showToast("Please enter a valid webhook URL", "error");
      return;
    }

    if (!session) {
      showToast("You must be logged in to save settings", "error");
      return;
    }

    setSaving(true);
    try {
      const { error: deleteError } = await supabase
        .from("webhooks")
        .delete()
        .eq("user_id", session.user.id);

      if (deleteError && deleteError.code !== "PGRST116") {
        throw deleteError;
      }

      const { error: insertError } = await supabase
        .from("webhooks")
        .insert({
          user_id: session.user.id,
          slack_url: webhookUrl,
        });

      if (insertError) throw insertError;

      showToast("Webhook URL saved successfully", "success");
    } catch (error) {
      console.error("Error saving webhook:", error);
      showToast("Failed to save webhook URL", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (!webhookUrl.trim()) {
      showToast("Please enter a webhook URL first", "error");
      return;
    }

    setTesting(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/notify-slack`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
            "X-Client-Info": "ransomradar-app",
          },
          body: JSON.stringify({
            webhook_url: webhookUrl,
            endpoint_name: "Test Server",
            alert_type: "Test Alert",
            message:
              "This is a test notification to verify your Slack integration is working correctly.",
            severity: "high",
            detected_at: new Date().toISOString(),
            is_test: true,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to send test notification");
      }

      showToast("Test notification sent successfully!", "success");
    } catch (error) {
      console.error("Error sending test notification:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to send test notification";
      showToast(errorMsg, "error");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-2">
          Configure your Slack webhook for alert notifications
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Slack Webhook Configuration
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Enter your Slack webhook URL to receive real-time notifications for
            critical and high-severity alerts.
          </p>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Webhook URL
          </label>
          <input
            type="password"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-colors"
          />
          <p className="text-xs text-gray-500 mt-2">
            Your webhook URL is encrypted and never shared. Only you have access
            to your settings.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSaveWebhook}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>

          <button
            onClick={handleTestNotification}
            disabled={testing || !webhookUrl.trim()}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {testing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Test Notification
              </>
            )}
          </button>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">How to get your Slack webhook URL:</h4>
        <ol className="text-sm text-blue-900 space-y-2 list-decimal list-inside">
          <li>Go to your Slack workspace settings</li>
          <li>Navigate to "Manage Apps" → "Custom Integrations"</li>
          <li>Click "Incoming Webhooks"</li>
          <li>Click "Add New Webhook to Workspace"</li>
          <li>Select the channel where alerts should be posted</li>
          <li>Copy the webhook URL and paste it above</li>
        </ol>
      </div>

      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
        <h4 className="font-semibold text-green-900 mb-2">What happens next:</h4>
        <ul className="text-sm text-green-900 space-y-2 list-disc list-inside">
          <li>All critical and high-severity alerts will be sent to your Slack channel</li>
          <li>Each notification includes endpoint name, alert type, and a link to your dashboard</li>
          <li>You can click "View in Dashboard" to see full alert details</li>
        </ul>
      </div>
    </div>
  );
}
