import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "./Toast";
import { Palette, Download } from "lucide-react";

interface MSPConfig {
  id: string;
  name: string;
  logo_url: string;
  primary_color: string;
}

export function MSPSettings() {
  const [config, setConfig] = useState<MSPConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#dc2626");
  const { showToast } = useToast();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          setLoading(false);
          return;
        }

        const mspId = session.user.user_metadata?.msp_id;
        if (!mspId) {
          setLoading(false);
          return;
        }

        const { data } = await supabase
          .from("msp_partners")
          .select("*")
          .eq("id", mspId)
          .maybeSingle();

        if (data) {
          setConfig(data);
          setLogoUrl(data.logo_url || "");
          setPrimaryColor(data.primary_color || "#dc2626");
        }
      } catch (error) {
        console.error("Error fetching MSP config:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("msp_partners")
        .update({
          logo_url: logoUrl || null,
          primary_color: primaryColor,
          updated_at: new Date().toISOString(),
        })
        .eq("id", config.id);

      if (error) throw error;

      setConfig({
        ...config,
        logo_url: logoUrl,
        primary_color: primaryColor,
      });

      showToast("White-label settings saved successfully", "success");
    } catch (error) {
      console.error("Error saving config:", error);
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600">Loading MSP settings...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600">No MSP configuration found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">MSP Settings</h2>
        <p className="text-gray-600 mt-2">
          Customize your white-label branding
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            MSP Partner Name
          </label>
          <input
            type="text"
            value={config.name}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
          <p className="text-xs text-gray-500 mt-1">Contact support to change</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo URL (Optional)
          </label>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://example.com/logo.png"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            PNG or JPG, recommended 200x50px
          </p>
          {logoUrl && (
            <div className="mt-3 p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Preview:</p>
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-8 rounded"
                onError={() => showToast("Could not load image", "error")}
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Primary Brand Color
            </div>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#000000"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none font-mono"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This color will be applied to buttons, links, and accents in your customer portals
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 text-sm mb-2">Preview</h4>
          <div
            className="p-4 rounded-lg"
            style={{ backgroundColor: primaryColor + "20", borderColor: primaryColor }}
          >
            <button
              style={{ backgroundColor: primaryColor }}
              className="px-4 py-2 text-white rounded font-medium"
              disabled
            >
              Sample Button
            </button>
            <p
              className="text-sm mt-3"
              style={{ color: primaryColor }}
            >
              This is how your primary color will appear
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Download className="w-4 h-4" />
              Saving...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Save White-Label Settings
            </>
          )}
        </button>
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h4 className="font-semibold text-yellow-900 mb-2">Billing Information</h4>
        <div className="space-y-2 text-sm text-yellow-900">
          <p>
            <span className="font-medium">Revenue Share:</span>{" "}
            {config.revenue_share_pct}%
          </p>
          <p>
            <span className="font-medium">Per Endpoint Cost:</span> $18/month
          </p>
          <p>
            <span className="font-medium">Your Commission:</span> $
            {(18 * (config.revenue_share_pct / 100)).toFixed(2)}/endpoint/month
          </p>
        </div>
      </div>
    </div>
  );
}
