import { useState } from "react";
import { Navigation } from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { Alerts } from "./components/Alerts";
import { Settings } from "./components/Settings";
import { MSPPortal } from "./components/MSPPortal";
import { MSPSettings } from "./components/MSPSettings";
import { ToastContainer } from "./components/Toast";

function App() {
  const [currentPage, setCurrentPage] = useState<
    "dashboard" | "alerts" | "settings" | "msp-portal" | "msp-settings"
  >("dashboard");
  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="min-h-[calc(100vh-64px)]">
        {currentPage === "dashboard" && <Dashboard />}
        {currentPage === "alerts" && <Alerts />}
        {currentPage === "settings" && <Settings />}
        {currentPage === "msp-portal" && (
          <MSPPortal onViewCustomer={(customerId) => {
            setViewingCustomerId(customerId);
          }} />
        )}
        {currentPage === "msp-settings" && <MSPSettings />}
      </main>

      <ToastContainer />
    </div>
  );
}

export default App;
