"use client";

import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { client } from "@/lib/appwrite";
import { APPWRITE_CONFIG } from "@/constants/appwrite";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { THEME } from "@/constants/ui";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  FileText,
  CheckCircle,
  Package,
  Users,
  BarChart2,
  Eye,
  Check,
  X,
} from "lucide-react";
import {
  useDashboardStats,
  useRecentQuotations,
  useReviewQueue,
  useApproveQuotation,
  useRejectQuotation,
} from "@/features/dashboard/api/useDashboard";
import QuotationPreviewModal from "@/components/modals/QuotationPreviewModal";
import RejectionModal from "@/components/modals/RejectionModal";

// ── Helpers ──────────────────────────────────────────────
function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-GB");
}

function formatCurrency(num) {
  return "₹" + parseFloat(num || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCurrencyShort(num) {
  const n = parseFloat(num || 0);
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(1) + "K";
  return "₹" + n.toFixed(0);
}

const statusColor = (s) => {
  if (s === "Approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "Completed") return "bg-amber-50 text-amber-700 border-amber-200";
  if (s === "Rejected") return "bg-red-50 text-red-700 border-red-200";
  if (s === "CONVERTED TO PO") return "bg-brand-primary/10 text-brand-primary border-brand-primary/20";
  return "bg-zinc-100 text-zinc-600 border-zinc-200";
};

// ── Skeleton ──────────────────────────────────────────────
const Pulse = ({ className }) => (
  <div className={`animate-pulse rounded bg-zinc-200/70 ${className}`} />
);

// ── Revenue Banner ────────────────────────────────────────
function RevenueBanner({ stats, loading }) {
  const conversionRate =
    stats && stats.totalQuotations > 0
      ? Math.round((stats.poCount / stats.totalQuotations) * 100)
      : 0;

  const isPositive =
    typeof stats?.trends?.revenue === "string"
      ? !stats.trends.revenue.startsWith("-")
      : true;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-brand-primary/30 p-5"
      style={{
        background: "linear-gradient(135deg, #000000 0%, #0f172a 40%, var(--brand-teal-dark) 100%)",
        boxShadow: "0 8px 32px rgba(94, 192, 194, 0.15)",
      }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full"
        style={{ background: "rgba(94,192,194,0.06)" }}
      />
      <div className="flex items-center gap-6 flex-wrap">
        {/* Revenue */}
        <div className="flex-1 min-w-[160px]">
          <p className="font-bold uppercase tracking-widest text-slate-400" style={{ fontSize: "10px" }}>
            Total Revenue
          </p>
          {loading ? (
            <Pulse className="mt-2 h-8 w-36" />
          ) : (
            <p className="mt-1 font-black text-brand-primary leading-none" style={{ fontSize: "28px" }}>
              {formatCurrency(stats?.totalRevenue)}
            </p>
          )}
          {loading ? (
            <Pulse className="mt-2 h-3 w-24" />
          ) : (
            <p className={`mt-1.5 flex items-center gap-1 font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`} style={{ fontSize: "11px" }}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {stats?.trends?.revenue}% from last month
            </p>
          )}
        </div>

        <div className="w-px h-12 bg-white/10 hidden sm:block" />

        {/* Active Quotations */}
        <div className="text-center min-w-[80px]">
          <p className="font-bold uppercase tracking-widest text-slate-500" style={{ fontSize: "9px" }}>Active</p>
          {loading ? <Pulse className="mt-1 h-7 w-10 mx-auto" /> : (
            <p className="mt-1 font-black text-white" style={{ fontSize: "22px" }}>{stats?.totalQuotations ?? "—"}</p>
          )}
          <p className="text-slate-500 font-medium" style={{ fontSize: "9px" }}>quotations</p>
        </div>

        <div className="w-px h-12 bg-white/10 hidden sm:block" />

        {/* Awaiting Approval */}
        <div className="text-center min-w-[80px]">
          <p className="font-bold uppercase tracking-widest text-amber-500/80" style={{ fontSize: "9px" }}>⚡ Awaiting</p>
          {loading ? <Pulse className="mt-1 h-7 w-10 mx-auto" /> : (
            <p className="mt-1 font-black text-brand-accent" style={{ fontSize: "22px" }}>{stats?.completedCount ?? "—"}</p>
          )}
          <p className="text-slate-400 font-bold" style={{ fontSize: "9px" }}>APPROVAL</p>
        </div>

        <div className="w-px h-12 bg-white/10 hidden sm:block" />

        {/* POs Logged */}
        <div className="text-center min-w-[80px]">
          <p className="font-bold uppercase tracking-widest text-slate-500" style={{ fontSize: "9px" }}>POs Logged</p>
          {loading ? <Pulse className="mt-1 h-7 w-10 mx-auto" /> : (
            <p className="mt-1 font-black text-[#a78bfa]" style={{ fontSize: "22px" }}>{stats?.poCount ?? "—"}</p>
          )}
          <p className="text-slate-500 font-medium" style={{ fontSize: "9px" }}>total</p>
        </div>

        <div className="w-px h-12 bg-white/10 hidden sm:block" />

        {/* Conversion Rate */}
        <div className="text-center min-w-[80px]">
          <p className="font-bold uppercase tracking-widest text-slate-500" style={{ fontSize: "9px" }}>Conversion</p>
          {loading ? <Pulse className="mt-1 h-7 w-10 mx-auto" /> : (
            <p className="mt-1 font-black text-emerald-400" style={{ fontSize: "22px" }}>{conversionRate}%</p>
          )}
          <p className="text-slate-500 font-medium" style={{ fontSize: "9px" }}>quotes → PO</p>
        </div>
      </div>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────
function KPICard({ label, value, sub, icon: Icon, loading, highlight }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${
        highlight
          ? "border-brand-accent bg-brand-accent/5 hover:bg-brand-accent/10 hover:shadow-[0_4px_20px_rgba(255,255,0,0.15)]"
          : "border-zinc-200/80 bg-white hover:border-brand-primary/40 hover:shadow-[0_4px_20px_rgba(94,192,194,0.10)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p
            className={`font-bold uppercase tracking-[0.1em] ${highlight ? "text-brand-black/60" : "text-zinc-400"}`}
            style={{ fontSize: "9px" }}
          >
            {label}
          </p>
          {loading ? (
            <Pulse className="mt-2 h-7 w-20" />
          ) : (
            <p
              className={`mt-1.5 font-extrabold tracking-tight leading-none ${highlight ? "text-brand-black" : "text-zinc-900"}`}
              style={{ fontSize: THEME.FONT_SIZE.XXLARGE }}
            >
              {value}
            </p>
          )}
          {loading ? (
            <Pulse className="mt-2 h-3 w-16" />
          ) : (
            <p
              className={`mt-2 font-semibold ${highlight ? "text-brand-black/50" : "text-zinc-400"}`}
              style={{ fontSize: "10px" }}
            >
              {sub}
            </p>
          )}
        </div>
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            highlight ? "bg-brand-accent shadow-[0_0_15px_rgba(255,255,0,0.4)]" : "bg-brand-primary/10"
          }`}
        >
          <Icon className={`h-4 w-4 ${highlight ? "text-brand-black" : "text-brand-primary"}`} />
        </div>
      </div>
    </div>
  );
}

// ── Pipeline Bar ──────────────────────────────────────────
function PipelineBar({ label, count, total, color, textColor }) {
  const pct = total > 0 ? Math.max((count / total) * 100, count > 0 ? 4 : 0) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold" style={{ fontSize: "11px", color: textColor }}>{label}</span>
        <span className="font-bold text-zinc-900" style={{ fontSize: "11px" }}>{count}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-zinc-100">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [previewId, setPreviewId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  // Realtime auto-refresh
  useEffect(() => {
    const collections = [
      APPWRITE_CONFIG.COLLECTIONS.QUOTATIONS,
      APPWRITE_CONFIG.COLLECTIONS.CUSTOMERS,
      APPWRITE_CONFIG.COLLECTIONS.MATERIALS,
      APPWRITE_CONFIG.COLLECTIONS.PURCHASE_ORDERS,
    ];
    const subs = collections.map((collectionId) => {
      const channel = `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${collectionId}.documents`;
      return client.subscribe(channel, (response) => {
        if (response.events.some((e) => e.includes(".create") || e.includes(".update") || e.includes(".delete"))) {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["recent-quotations"] });
          queryClient.invalidateQueries({ queryKey: ["review-queue"] });
        }
      });
    });
    return () => subs.forEach((u) => u());
  }, [queryClient]);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recent, isLoading: recentLoading } = useRecentQuotations(5);
  const { data: reviewQueue, isLoading: reviewLoading } = useReviewQueue(5);
  const approveMutation = useApproveQuotation();
  const rejectMutation = useRejectQuotation();

  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace("/quotations-draft");
  }, [authLoading, isAdmin, router]);

  if (authLoading || !isAdmin) return null;

  const pipelineTotal =
    (stats?.draftCount ?? 0) +
    (stats?.completedCount ?? 0) +
    (stats?.approvedCount ?? 0) +
    (stats?.rejectedCount ?? 0) +
    (stats?.poCount ?? 0);

  const oldestReviewLabel = stats?.oldestReviewCreatedAt
    ? timeAgo(stats.oldestReviewCreatedAt)
    : null;

  return (
    <DashboardLayout
      title="Command Center"
      primaryAction={
        <button
          onClick={() => router.push("/quotations-draft/new")}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-brand-primary px-5 text-white shadow-lg shadow-brand-primary/20 transition-all hover:scale-[1.02] active:scale-95 border border-brand-primary/20"
          style={{ fontSize: THEME.FONT_SIZE.BASE, fontWeight: "bold" }}
        >
          <Plus className="h-4 w-4" />
          New Quotation
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Page heading */}
        <div className="shrink-0">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
            Industrial Precision <span className="text-brand-primary">Dashboard</span>
          </h1>
          <p className="mt-1 font-medium text-zinc-400" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>
            Real-time command view · revenue, approvals &amp; pipeline at a glance.
          </p>
        </div>

        {/* Revenue Banner */}
        <div className="shrink-0">
          <RevenueBanner stats={stats} loading={statsLoading} />
        </div>

        {/* KPI Row */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 shrink-0">
          <KPICard
            label="Pipeline Value"
            value={stats ? formatCurrencyShort(stats.pipelineValue) : "—"}
            sub="quotes in progress"
            icon={TrendingUp}
            loading={statsLoading}
          />
          <KPICard
            label="⚡ Needs Your Review"
            value={stats ? stats.completedCount : "—"}
            sub={oldestReviewLabel ? `oldest: ${oldestReviewLabel}` : "none pending"}
            icon={FileText}
            loading={statsLoading}
            highlight={stats?.completedCount > 0}
          />
          <KPICard
            label="Approved This Month"
            value={stats ? stats.approvedThisMonthCount : "—"}
            sub={stats ? `${formatCurrencyShort(stats.approvedThisMonthValue)} value` : "—"}
            icon={CheckCircle}
            loading={statsLoading}
          />
          <KPICard
            label="Materials Indexed"
            value={stats ? stats.totalMaterials : "—"}
            sub="in library"
            icon={Package}
            loading={statsLoading}
          />
        </section>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">

          {/* Main card — Pending Approval + Recent Quotations */}
          <section className="xl:col-span-2 rounded-2xl border border-zinc-200/80 bg-white shadow-sm flex flex-col overflow-hidden self-start">

            {/* Pending Approval header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 shrink-0">
              <div className="flex items-center gap-2.5">
                <h2 className="font-bold text-zinc-900" style={{ fontSize: "14px" }}>Pending Approval</h2>
                {!statsLoading && (stats?.completedCount ?? 0) > 0 && (
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-bold text-amber-700" style={{ fontSize: "10px" }}>
                    {stats.completedCount} awaiting you
                  </span>
                )}
              </div>
              <button
                onClick={() => router.push("/quotations-approved")}
                className="font-bold text-brand-primary hover:underline"
                style={{ fontSize: THEME.FONT_SIZE.TINY }}
              >
                View All →
              </button>
            </div>

            {/* Review rows */}
            <div className="shrink-0">
              {reviewLoading ? (
                [1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 border-b border-zinc-50 animate-pulse">
                    <Pulse className="h-4 w-full" />
                  </div>
                ))
              ) : !reviewQueue || reviewQueue.length === 0 ? (
                <div className="flex items-center gap-3 px-5 py-4 text-emerald-600 border-b border-zinc-50">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span className="font-semibold" style={{ fontSize: "12px" }}>All clear — no quotations awaiting approval</span>
                </div>
              ) : (
                reviewQueue.map((row) => (
                  <div
                    key={row.$id}
                    className="flex items-center gap-3 px-5 py-3 border-b border-zinc-50 hover:bg-amber-50/30 transition-colors"
                  >
                    <span className="font-bold text-brand-primary w-[88px] shrink-0" style={{ fontSize: "12px" }}>
                      {row.quotation_no}
                    </span>
                    <span className="flex-1 font-semibold text-zinc-700 truncate" style={{ fontSize: "12px" }}>
                      {row.supplier_name || "—"}
                    </span>
                    <span className="text-zinc-400 w-[70px] text-right shrink-0 font-mono" style={{ fontSize: "10px" }}>
                      {timeAgo(row.$createdAt)}
                    </span>
                    <span className="font-bold text-zinc-900 w-[90px] text-right shrink-0 font-mono" style={{ fontSize: "12px" }}>
                      {formatCurrency(row.total_amount)}
                    </span>
                    <button
                      onClick={() => setPreviewId(row.$id)}
                      className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 font-semibold text-zinc-600 hover:bg-zinc-100 transition-colors shrink-0"
                      style={{ fontSize: "10px" }}
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </button>
                    <button
                      onClick={() => approveMutation.mutate(row.$id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="flex items-center gap-1 rounded-lg bg-emerald-500 px-2.5 py-1.5 font-bold text-white hover:bg-emerald-600 transition-colors disabled:opacity-60 shrink-0"
                      style={{ fontSize: "10px" }}
                    >
                      <Check className="h-3 w-3" />
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectTarget({ id: row.$id, quotation_no: row.quotation_no })}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5 font-bold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-60 shrink-0"
                      style={{ fontSize: "10px" }}
                    >
                      <X className="h-3 w-3" />
                      Reject
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Recent Quotations sub-header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-2.5 shrink-0 bg-zinc-50/60">
              <div>
                <span className="font-bold text-zinc-700" style={{ fontSize: "12px" }}>Recent Quotations</span>
                <span className="ml-2 text-zinc-400" style={{ fontSize: "10px" }}>latest from the registry</span>
              </div>
              <button
                onClick={() => router.push("/quotations-draft")}
                className="font-bold text-brand-primary hover:underline"
                style={{ fontSize: THEME.FONT_SIZE.TINY }}
              >
                View All →
              </button>
            </div>

            {/* Recent quotations table */}
            <div>
              <table className="w-full text-left">
                <thead className="bg-zinc-50/80 sticky top-0">
                  <tr>
                    {["Quote ID", "Customer", "Incharge", "Date", "Status", "Amount"].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-2.5 font-bold uppercase tracking-widest text-zinc-400 ${i >= 3 ? "text-center" : ""} ${i === 5 ? "text-right" : ""}`}
                        style={{ fontSize: "9px" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {recentLoading ? (
                    [1, 2, 3, 4, 5].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-5 py-3"><Pulse className="h-4 w-full" /></td>
                      </tr>
                    ))
                  ) : !recent || recent.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center">
                        <div className="flex flex-col items-center gap-2 text-zinc-400">
                          <FileText className="h-8 w-8 text-zinc-300" />
                          <p className="font-medium text-sm">No quotations yet</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recent.map((row) => (
                      <tr
                        key={row.$id}
                        onClick={() => router.push(`/quotations-draft/edit?id=${row.$id}`)}
                        className="cursor-pointer transition-colors hover:bg-brand-primary/[0.04] even:bg-[#F8FBFC]"
                      >
                        <td className="px-5 py-2.5">
                          <span className="font-bold text-brand-primary" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>{row.quotation_no}</span>
                        </td>
                        <td className="px-5 py-2.5 font-semibold text-zinc-600 truncate max-w-[160px]" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>
                          {row.supplier_name || "N/A"}
                        </td>
                        <td className="px-5 py-2.5 font-medium text-zinc-500 truncate max-w-[120px]" style={{ fontSize: "11px" }}>
                          {row.quoting_engineer || "—"}
                        </td>
                        <td className="px-5 py-2.5 text-center font-mono text-zinc-500" style={{ fontSize: "10px" }}>
                          {timeAgo(row.$createdAt)}
                        </td>
                        <td className="px-5 py-2.5 text-center">
                          <span className={`inline-flex rounded-full border px-2 py-0.5 font-bold uppercase tracking-widest ${statusColor(row.status)}`} style={{ fontSize: "9px" }}>
                            {row.status === "Completed" ? "Review" : (row.status || "Draft")}
                          </span>
                        </td>
                        <td className="px-5 py-2.5 text-right font-mono font-bold text-zinc-900" style={{ fontSize: THEME.FONT_SIZE.BASE }}>
                          {formatCurrency(row.total_amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Right column */}
          <div className="flex flex-col gap-4">

            {/* Pipeline Status */}
            <div className="shrink-0 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-zinc-900" style={{ fontSize: "13px" }}>Pipeline Status</h3>
              <p className="mt-0.5 text-zinc-400 mb-4" style={{ fontSize: "10px" }}>Quotations by stage</p>
              {statsLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3, 4, 5].map((i) => <Pulse key={i} className="h-6 w-full" />)}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <PipelineBar label="Draft" count={stats?.draftCount ?? 0} total={pipelineTotal} color="#9ca3af" textColor="#6b7280" />
                  <PipelineBar label="Review (awaiting you)" count={stats?.completedCount ?? 0} total={pipelineTotal} color="#f59e0b" textColor="#92400e" />
                  <PipelineBar label="Approved" count={stats?.approvedCount ?? 0} total={pipelineTotal} color="#10b981" textColor="#065f46" />
                  <PipelineBar label="PO Logged" count={stats?.poCount ?? 0} total={pipelineTotal} color="#a78bfa" textColor="#5b21b6" />
                  <PipelineBar label="Rejected" count={stats?.rejectedCount ?? 0} total={pipelineTotal} color="#ef4444" textColor="#991b1b" />
                </div>
              )}
            </div>

            {/* Business Overview */}
            {/* <div className="shrink-0 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-zinc-900" style={{ fontSize: "13px" }}>Business Overview</h3>
              <p className="mt-0.5 text-zinc-400 mb-4" style={{ fontSize: "10px" }}>Key operational numbers</p>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Customers", value: stats?.totalCustomers, color: "text-brand-primary" },
                  { label: "PO Logged", value: stats?.poCount, color: "text-[#a78bfa]" },
                  { label: "Rejected", value: stats?.rejectedCount, color: "text-red-500" },
                  { label: "In Review", value: stats?.completedCount, color: "text-amber-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-xl bg-zinc-50 p-3 text-center">
                    <p className="font-bold uppercase tracking-wider text-zinc-400 mb-1" style={{ fontSize: "9px" }}>{label}</p>
                    {statsLoading ? (
                      <Pulse className="h-6 w-10 mx-auto" />
                    ) : (
                      <p className={`font-extrabold ${color}`} style={{ fontSize: THEME.FONT_SIZE.XLARGE }}>{value ?? "—"}</p>
                    )}
                  </div>
                ))}
              </div>
            </div> */}

          </div>
        </div>
      </div>

      <QuotationPreviewModal
        isOpen={!!previewId}
        onClose={() => setPreviewId(null)}
        quotationId={previewId}
      />

      <RejectionModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        quotationNo={rejectTarget?.quotation_no}
        isLoading={rejectMutation.isPending}
        onConfirm={async () => {
          await rejectMutation.mutateAsync(rejectTarget.id);
          setRejectTarget(null);
        }}
      />
    </DashboardLayout>
  );
}
