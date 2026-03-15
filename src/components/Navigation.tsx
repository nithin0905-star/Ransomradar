import { AlertCircle, Settings, BarChart3, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface NavigationProps {
  currentPage: "dashboard" | "alerts" | "settings" | "msp-portal" | "msp-settings";
  onPageChange: (page: "dashboard" | "alerts" | "settings" | "msp-portal" | "msp-settings") => void;
}

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const [isMSP, setIsMSP] = useState(false);

  useEffect(() => {
    const checkMSPRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const role = session?.user?.user_metadata?.role;
      setIsMSP(role === "msp_admin");
    };

    checkMSPRole();
  }, []);

  const baseItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "alerts", label: "Alerts", icon: AlertCircle },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  const mspItems = isMSP
    ? [
        { id: "msp-portal", label: "MSP Portal", icon: Building2 },
        { id: "msp-settings", label: "MSP Settings", icon: Settings },
      ]
    : [];

  const navItems = isMSP ? mspItems : baseItems;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h1 className="text-xl font-bold text-gray-900">RansomRadar</h1>
          </div>

          <div className="flex gap-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onPageChange(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === id
                    ? "bg-red-50 text-red-600 border-b-2 border-red-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
