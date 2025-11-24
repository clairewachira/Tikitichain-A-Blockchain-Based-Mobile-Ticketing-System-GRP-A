"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  BarChart3,
  Ticket,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  Link as LinkIcon,
  Eye,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface DashboardStats {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  totalResales: number;
  royaltiesEarned: number;
  blockchainEvents: number;
}

interface Event {
  id: string;
  title: string;
  price: number;
  tickets_sold: number;
  total_supply: number;
  blockchain_enabled: boolean;
  blockchain_active: boolean;
  created_at: string;
}

interface Ticket {
  id: string;
  token_id: number;
  event_id: string;
  owner_user_id: string;
  owner_wallet_address: string;
  purchase_price: number;
  is_redeemed: boolean;
  transaction_hash: string;
  created_at: string;
}

interface TicketListing {
  id: string;
  token_id: string;
  event_id: string;
  seller_user_id: string;
  seller_wallet_address: string;
  listing_price: number;
  original_price: number;
  status: string;
  buyer_user_id: string | null;
  sold_price: number | null;
  sold_at: string | null;
  transaction_hash: string | null;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "events" | "tickets" | "resales" | "royalties" | "blockchain"
  >("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [listings, setListings] = useState<TicketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (eventsError) throw eventsError;

      // Fetch blockchain tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("blockchain_tickets")
        .select("*");

      if (ticketsError) {
        console.warn("Could not fetch blockchain tickets:", ticketsError);
      }

      // Fetch ticket listings (resales)
      const { data: listingsData, error: listingsError } = await supabase
        .from("ticket_listings")
        .select("*")
        .eq("status", "sold");

      if (listingsError) {
        console.warn("Could not fetch ticket listings:", listingsError);
      }

      // Calculate stats
      const totalTicketsSold =
        eventsData?.reduce(
          (sum, event) => sum + (event.tickets_sold || 0),
          0,
        ) || 0;
      const totalRevenue =
        eventsData?.reduce(
          (sum, event) => sum + (event.tickets_sold || 0) * event.price,
          0,
        ) || 0;

      // Calculate resale stats from ticket_listings
      const soldListings = listingsData || [];
      const totalResales = soldListings.length;
      const royaltiesEarned = soldListings.reduce((sum, listing) => {
        const resaleAmount = Number(
          listing.sold_price || listing.listing_price || 0,
        );
        return sum + resaleAmount * 0.05; // 5% royalty
      }, 0);

      const blockchainEvents =
        eventsData?.filter((e) => e.blockchain_enabled).length || 0;

      setStats({
        totalEvents: eventsData?.length || 0,
        totalTicketsSold,
        totalRevenue,
        totalResales,
        royaltiesEarned,
        blockchainEvents,
      });

      setEvents(eventsData || []);
      setTickets(ticketsData || []);
      setListings(soldListings);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockchain = async (eventId: string, currentState: boolean) => {
    try {
      console.log(
        "Toggling blockchain for event:",
        eventId,
        "from",
        currentState,
        "to",
        !currentState,
      );

      const { data, error } = await supabase
        .from("events")
        .update({ blockchain_active: !currentState })
        .eq("id", eventId)
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      console.log("Update result:", data);
      alert(
        `Blockchain ${!currentState ? "activated" : "deactivated"} successfully!`,
      );
      await fetchDashboardData();
    } catch (err) {
      console.error("Error toggling blockchain:", err);
      alert(
        `Failed to toggle blockchain status: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const createEvent = async (formData: FormData) => {
    setCreating(true);
    try {
      // Parse gallery URLs
      const galleryInput = formData.get("gallery") as string;
      const galleryUrls = galleryInput
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url.length > 0);

      const eventData = {
        title: formData.get("title") as string,
        description: formData.get("description") as string,
        price: parseFloat(formData.get("price") as string),
        category: formData.get("category") as string,
        time: new Date(formData.get("time") as string).toISOString(),
        duration: parseInt(formData.get("duration") as string),
        location: {
          city: formData.get("city") as string,
          country: formData.get("country") as string,
          address: formData.get("address") as string,
          latitude: 0,
          longitude: 0,
        },
        gallery: galleryUrls,
        tags:
          (formData.get("tags") as string)
            ?.split(",")
            .map((t) => t.trim())
            .filter((t) => t) || [],
        blockchain_enabled: formData.get("blockchain_enabled") === "true",
        blockchain_active: false,
        total_supply: parseInt(formData.get("total_supply") as string) || null,
        tickets_sold: 0,
      };

      const { data, error } = await supabase
        .from("events")
        .insert([eventData])
        .select();

      if (error) throw error;

      alert("Event created successfully!");
      setShowCreateModal(false);
      await fetchDashboardData();
    } catch (err) {
      console.error("Error creating event:", err);
      alert(
        `Failed to create event: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setCreating(false);
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      await fetchDashboardData();
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Failed to delete event");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tikiti Chain Admin
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Event & Ticket Management Dashboard
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: "overview", label: "Overview", icon: BarChart3 },
              { id: "events", label: "Events", icon: Calendar },
              { id: "tickets", label: "Tickets", icon: Ticket },
              { id: "resales", label: "Resales", icon: TrendingUp },
              { id: "royalties", label: "Royalties", icon: DollarSign },
              { id: "blockchain", label: "Blockchain", icon: LinkIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-1 py-4 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && stats && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Dashboard Overview
            </h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Total Events"
                value={stats.totalEvents}
                icon={Calendar}
                color="blue"
              />
              <StatCard
                title="Tickets Sold"
                value={stats.totalTicketsSold}
                icon={Ticket}
                color="green"
              />
              <StatCard
                title="Total Revenue"
                value={`${stats.totalRevenue.toLocaleString()} POL`}
                icon={DollarSign}
                color="purple"
              />
              <StatCard
                title="Resales"
                value={stats.totalResales}
                icon={TrendingUp}
                color="orange"
              />
              <StatCard
                title="Royalties Earned"
                value={`${stats.royaltiesEarned.toFixed(2)} POL`}
                icon={DollarSign}
                color="indigo"
              />
              <StatCard
                title="Blockchain Events"
                value={stats.blockchainEvents}
                icon={LinkIcon}
                color="pink"
              />
            </div>

            {/* Recent Events */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Events
              </h3>
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {event.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {event.tickets_sold || 0}/{event.total_supply || "N/A"}{" "}
                        tickets sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {event.price} POL
                      </p>
                      {event.blockchain_enabled && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                          Blockchain
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === "events" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Events Management
              </h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Create Event
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gallery
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sold/Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {event.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(event.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {event.gallery && event.gallery.length > 0 ? (
                          <div className="flex gap-1">
                            {event.gallery.slice(0, 3).map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`${event.title} ${idx + 1}`}
                                className="w-12 h-12 object-cover rounded border border-gray-200"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect fill="%23f3f4f6" width="48" height="48"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            ))}
                            {event.gallery.length > 3 && (
                              <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-600">
                                +{event.gallery.length - 3}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">
                            No images
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {event.price} POL
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {event.tickets_sold || 0}/{event.total_supply || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {event.blockchain_enabled && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                              <LinkIcon className="w-3 h-3 mr-1" />
                              Blockchain
                            </span>
                          )}
                          {event.blockchain_active && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {event.blockchain_enabled && (
                            <button
                              onClick={() =>
                                toggleBlockchain(
                                  event.id,
                                  event.blockchain_active || false,
                                )
                              }
                              className={`p-2 rounded-lg transition-colors ${
                                event.blockchain_active
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                              title={
                                event.blockchain_active
                                  ? "Deactivate Blockchain"
                                  : "Activate Blockchain"
                              }
                            >
                              <LinkIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === "tickets" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Tickets Management
            </h2>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blockchain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resale Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.slice(0, 50).map((ticket) => {
                    const event = events.find((e) => e.id === ticket.event_id);
                    const listing = listings.find(
                      (l) => l.token_id === ticket.token_id.toString(),
                    );
                    return (
                      <tr key={ticket.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          #{ticket.token_id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {event?.title || "Unknown Event"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              ticket.is_redeemed
                                ? "bg-gray-100 text-gray-700"
                                : listing
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-green-100 text-green-700"
                            }`}
                          >
                            {ticket.is_redeemed
                              ? "Redeemed"
                              : listing
                                ? "Listed"
                                : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {ticket.transaction_hash ? (
                            <span className="inline-flex items-center text-blue-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              On-chain
                            </span>
                          ) : (
                            <span className="text-gray-400">Off-chain</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {listing
                            ? `${Number(listing.listing_price).toFixed(2)} POL`
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resales Tab */}
        {activeTab === "resales" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Ticket Resales
            </h2>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ticket #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Original Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Resale Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Royalty (5%)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {listings.map((listing) => {
                    const event = events.find((e) => e.id === listing.event_id);
                    const soldPrice = Number(
                      listing.sold_price || listing.listing_price,
                    );
                    const originalPrice = Number(listing.original_price);
                    const royalty = soldPrice * 0.05;
                    return (
                      <tr key={listing.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          #{listing.token_id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {event?.title || "Unknown Event"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {originalPrice.toFixed(2)} POL
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {soldPrice.toFixed(2)} POL
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">
                          {royalty.toFixed(2)} POL
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {listings.length === 0 && (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No resales yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Royalties Tab */}
        {activeTab === "royalties" && stats && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Royalties & Revenue
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Total Revenue"
                value={`${stats.totalRevenue.toLocaleString()} POL`}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Royalties Earned"
                value={`${stats.royaltiesEarned.toFixed(2)} POL`}
                icon={TrendingUp}
                color="purple"
              />
              <StatCard
                title="Total Resales"
                value={stats.totalResales}
                icon={Users}
                color="blue"
              />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Revenue Breakdown
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Primary Sales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalRevenue.toLocaleString()} POL
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Tickets Sold</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {stats.totalTicketsSold}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-purple-600">
                      Royalties from Resales
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {stats.royaltiesEarned.toFixed(2)} POL
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-purple-600">Resale Count</p>
                    <p className="text-lg font-semibold text-purple-900">
                      {stats.totalResales}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-green-600">
                      Total Platform Revenue
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {(
                        stats.totalRevenue + stats.royaltiesEarned
                      ).toLocaleString()} POL
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blockchain Tab */}
        {activeTab === "blockchain" && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Blockchain Events
            </h2>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contract Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tickets
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {events
                    .filter((e) => e.blockchain_enabled)
                    .map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {event.title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs text-black px-2 py-1 rounded">
                            {event.blockchain_event_id || "Not deployed"}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          {event.blockchain_active ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {event.tickets_sold || 0}/
                          {event.total_supply || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() =>
                              toggleBlockchain(
                                event.id,
                                event.blockchain_active || false,
                              )
                            }
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                              event.blockchain_active
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            {event.blockchain_active
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {events.filter((e) => e.blockchain_enabled).length === 0 && (
                <div className="text-center py-12">
                  <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No blockchain events yet</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Create New Event
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={creating}
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  createEvent(formData);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="Amazing Concert 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="Describe your event..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (POL) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      required
                      step="0.01"
                      min="0.0000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      placeholder="0.05"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      name="category"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    >
                      <option value="">Select category</option>
                      <option value="Music">Music</option>
                      <option value="Sports">Sports</option>
                      <option value="Art">Art</option>
                      <option value="Technology">Technology</option>
                      <option value="Food">Food</option>
                      <option value="Education">Education</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      name="time"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      name="duration"
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      placeholder="120"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      placeholder="Nairobi"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      name="country"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      placeholder="Kenya"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="123 Main Street"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="music, live, outdoor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image Gallery (comma-separated URLs) *
                  </label>
                  <textarea
                    name="gallery"
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg, https://example.com/image3.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter image URLs separated by commas. At least one image is
                    required.
                  </p>
                </div>

                <div className="border-t pt-4">
                  <label className="flex items-center gap-2 mb-3">
                    <input
                      type="checkbox"
                      name="blockchain_enabled"
                      value="true"
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Enable Blockchain (NFT Tickets)
                    </span>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Total Supply (for blockchain events)
                    </label>
                    <input
                      type="number"
                      name="total_supply"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={creating}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {creating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Event"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: "blue" | "green" | "purple" | "orange" | "indigo" | "pink";
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    indigo: "bg-indigo-100 text-indigo-600",
    pink: "bg-pink-100 text-pink-600",
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
