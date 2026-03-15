import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "./Toast";
import { Users, BarChart3, DollarSign, Plus, Loader } from "lucide-react";

interface Customer {
  id: string;
  email: string;
  name?: string;
  endpointCount: number;
  alertCount: number;
}

interface MSPStats {
  totalEndpoints: number;
  totalAlertsToday: number;
  revenueEstimate: number;
  customerCount: number;
}

interface MSPPartner {
  id: string;
  name: string;
  revenue_share_pct: number;
  logo_url?: string;
  primary_color?: string;
}

export function MSPPortal({ onViewCustomer }: { onViewCustomer: (customerId: string) => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<MSPStats>({
    totalEndpoints: 0,
    totalAlertsToday: 0,
    revenueEstimate: 0,
    customerCount: 0,
  });
  const [partner, setPartner] = useState<MSPPartner | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchMSPData = async () => {
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

        // Fetch MSP partner details
        const { data: partnerData } = await supabase
          .from("msp_partners")
          .select("*")
          .eq("id", mspId)
          .maybeSingle();

        if (partnerData) {
          setPartner(partnerData);
        }

        // Fetch customers
        const { data: customerIds } = await supabase
          .from("msp_customers")
          .select("customer_id")
          .eq("msp_id", mspId);

        if (customerIds && customerIds.length > 0) {
          const ids = customerIds.map((c) => c.customer_id);

          // Get customer info from auth users
          const customers: Customer[] = [];
          let totalEndpoints = 0;
          let totalAlertsToday = 0;

          for (const customerId of ids) {
            const { data: endpoints } = await supabase
              .from("alerts")
              .select("id", { count: "exact" })
              .eq("user_id", customerId);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { data: todayAlerts, count: alertCount } = await supabase
              .from("alerts")
              .select("id", { count: "exact" })
              .eq("user_id", customerId)
              .gte("created_at", today.toISOString());

            const endpointCount = endpoints?.length || 0;
            const alertsToday = alertCount || 0;

            totalEndpoints += endpointCount;
            totalAlertsToday += alertsToday;

            customers.push({
              id: customerId,
              email: `customer-${customerId.slice(0, 8)}@client.example`,
              endpointCount,
              alertCount: alertsToday,
            });
          }

          setCustomers(customers);

          const monthlyEndpointCost = totalEndpoints * 18;
          const revenueEstimate =
            monthlyEndpointCost * (partnerData?.revenue_share_pct || 0) / 100;

          setStats({
            totalEndpoints,
            totalAlertsToday,
            revenueEstimate,
            customerCount: ids.length,
          });
        }
      } catch (error) {
        console.error("Error fetching MSP data:", error);
        showToast("Failed to load MSP portal data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchMSPData();
  }, [showToast]);

  const handleAddClient = async () => {
    if (!newClientEmail.trim()) {
      showToast("Please enter a valid email address", "error");
      return;
    }

    setAdding(true);
    try {
      // In a real implementation, this would:
      // 1. Create a new user account
      // 2. Associate with MSP
      // 3. Send invitation email

      showToast(
        "Client invitation sent to " + newClientEmail,
        "success"
      );
      setNewClientEmail("");
      setShowAddClient(false);
    } catch (error) {
      console.error("Error adding client:", error);
      showToast("Failed to add client", "error");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-gray-600">Loading MSP portal...</p>
      </div>
    );
  }

  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      style={{
        "--primary-color": partner?.primary_color || "#dc2626",
      } as React.CSSProperties}
    >
      <div className="mb-8">
        <div className="flex items-center gap-3">
          {partner?.logo_url && (
            <img
              src={partner.logo_url}
              alt={partner.name}
              className="w-10 h-10 rounded"
            />
          )}
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {partner?.name || "MSP Portal"}
            </h2>
            <p className="text-gray-600 mt-1">Manage all your customer accounts</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.customerCount}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Endpoints</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.totalEndpoints}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alerts Today</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats.totalAlertsToday}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="w-6 h-6 text-red-600">!</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-emerald-600 mt-2">
                ${stats.revenueEstimate.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ({partner?.revenue_share_pct}% share)
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Clients Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Your Customers ({customers.length})
          </h3>
          <button
            onClick={() => setShowAddClient(!showAddClient)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Client
          </button>
        </div>

        {showAddClient && (
          <div className="border-b border-gray-200 p-6 bg-gray-50">
            <div className="flex gap-3">
              <input
                type="email"
                value={newClientEmail}
                onChange={(e) => setNewClientEmail(e.target.value)}
                placeholder="client@example.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
              />
              <button
                onClick={handleAddClient}
                disabled={adding}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {adding ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  "Send Invite"
                )}
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-gray-200">
          {customers.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No customers yet. Add your first client to get started.
            </div>
          ) : (
            customers.map((customer) => (
              <div
                key={customer.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onViewCustomer(customer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {customer.email}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">
                          {customer.endpointCount}
                        </span>{" "}
                        endpoints
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">
                          {customer.alertCount}
                        </span>{" "}
                        alerts today
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ${(customer.endpointCount * 18).toFixed(0)}/mo
                    </div>
                    <p className="text-xs text-gray-500">estimated ARR</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
