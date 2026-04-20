"use client";

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/constants/appwrite';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { THEME } from '@/constants/ui';
import { usePurchaseOrders, useOrderMetrics } from '@/features/quotations/api/usePurchaseOrders';
import { useUsers } from '@/features/admin/api/useUsers';
import {
  Search,
  Calendar,
  Briefcase,
  TrendingUp,
  ChevronRight,
  FileText,
  Clock,
  Settings2,
  IndianRupee,
  FileSpreadsheet
} from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { format, isSameDay } from 'date-fns';
import { assetService } from '@/services/assets';
import { purchaseOrderService } from '@/services/purchase-orders';
import { toast } from 'react-hot-toast';
import PdfPreviewModal from '@/components/modals/PdfPreviewModal';
import OrderDetailsModal from '@/components/modals/OrderDetailsModal';
import { exportPurchaseOrdersToExcel } from '@/utils/exportToExcel';

export default function ConfirmedOrdersPage() {
  const [page, setPage] = useState(1);
  const limit = 25;
  const [filters, setFilters] = useState({ 
    search: '', 
    engineer: 'All', 
    status: 'All',
    dateRange: { start: null, end: null, label: 'All Time' } 
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const queryClient = useQueryClient();
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Realtime subscription
  useEffect(() => {
    const channel = `databases.${APPWRITE_CONFIG.DATABASE_ID}.collections.${APPWRITE_CONFIG.COLLECTIONS.PURCHASE_ORDERS}.documents`;
    
    const unsubscribe = client.subscribe(channel, (response) => {
      // Refresh on any document event in this collection
      if (response.events.some(event => 
        event.includes('.create') || 
        event.includes('.update') || 
        event.includes('.delete')
      )) {
        queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
        queryClient.invalidateQueries({ queryKey: ['order-metrics'] });
      }
    });

    return () => unsubscribe();
  }, [queryClient]);
  
  // Modal states
  const [previewFile, setPreviewFile] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const { data: usersData } = useUsers();
  const engineers = usersData?.documents || [];

  const { data, isLoading } = usePurchaseOrders(limit, (page - 1) * limit, filters);
  const { data: metrics, isLoading: metricsLoading } = useOrderMetrics(filters);

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    setPage(1);
  };

  const handleEngineerChange = (e) => {
    setFilters(prev => ({ ...prev, engineer: e.target.value }));
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setFilters(prev => ({ ...prev, status: e.target.value }));
    setPage(1);
  };

  const handleDateRangeChange = (range) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
    setShowDatePicker(false);
    setPage(page); // Stay on current page if possible or set to 1
    if (range.start) setPage(1);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingStatusId(orderId);
      await purchaseOrderService.updateStatus(orderId, newStatus);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-metrics'] });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      toast.loading("Preparing orders export...", { id: 'export-orders' });
      
      // Fetch data with current filters but higher limit for export
      const exportData = await purchaseOrderService.listOrders(5000, 0, filters);
      
      if (!exportData?.documents || exportData.documents.length === 0) {
        toast.error("No orders found to export", { id: 'export-orders' });
        return;
      }

      const fileName = `Confirmed_Orders_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      exportPurchaseOrdersToExcel(exportData.documents, fileName);
      
      toast.success("Orders exported successfully", { id: 'export-orders' });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export orders", { id: 'export-orders' });
    } finally {
      setIsExporting(false);
    }
  };

  const orders = data?.documents || [];
  const total = data?.total || 0;

  const getDueBadge = (deliveryDate) => {
    if (!deliveryDate) return null;
    const daysLeft = Math.ceil((new Date(deliveryDate) - new Date()) / 86400000);
    if (daysLeft < 0) return { label: 'Overdue', cls: 'text-red-500 font-black' };
    if (daysLeft <= 7) return { label: `${daysLeft}d left`, cls: 'text-amber-500 font-black' };
    return null;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'In Production': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
      case 'Shipped': return 'bg-purple-50 text-purple-600 border-purple-100';
      default: return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  };

  return (
    <DashboardLayout 
      title="Confirmed Purchase Orders"
      primaryAction={
        <button
          onClick={handleExportExcel}
          disabled={isExporting || orders.length === 0}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-white shadow-lg shadow-emerald-200/50 transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/20"
          style={{ fontSize: THEME.FONT_SIZE.SMALL, fontWeight: 'bold' }}
        >
          <FileSpreadsheet className={`h-3.5 w-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
          {isExporting ? "Exporting..." : "Export Orders"}
        </button>
      }
    >
      <div className="flex flex-col gap-6">

        {/* Metrics Bar */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-50 text-zinc-600 border border-zinc-200/50">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Total Orders</p>
                <p className="mt-1 text-lg font-black text-zinc-950 tracking-tight leading-none">
                  {metricsLoading ? "..." : `${metrics?.count || 0}`}
                </p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-blue-100 bg-blue-50/30 p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100/50 text-blue-600 border border-blue-200/50">
                <IndianRupee className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-blue-600/70 uppercase tracking-widest leading-none">This Month</p>
                <p className="mt-1 text-lg font-black text-blue-950 tracking-tight leading-none">
                  {metricsLoading ? "..." : `₹${(metrics?.currentMonthValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                </p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-amber-100 bg-amber-50/30 p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100/50 text-amber-600 border border-amber-200/50">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-amber-600/70 uppercase tracking-widest leading-none">Active Business</p>
                <p className="mt-1 text-lg font-black text-amber-950 tracking-tight leading-none">
                  {metricsLoading ? "..." : `₹${(metrics?.activeValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                </p>
              </div>
            </div>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/30 p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100/50 text-emerald-600 border border-emerald-200/50">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-widest leading-none">
                  {filters.dateRange.start ? filters.dateRange.label : 'All Time'}
                </p>
                <p className="mt-1 text-lg font-black text-emerald-950 tracking-tight leading-none">
                  {metricsLoading ? "..." : `₹${(metrics?.selectedPeriodValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="rounded-xl border border-zinc-200 bg-zinc-50/30 p-3.5 shadow-sm flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 min-w-[200px] flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Order / Customer Search</label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search PO#, Client..."
                value={filters.search}
                onChange={handleSearchChange}
                className="w-full h-9.5 pl-9.5 pr-8 rounded-lg border border-zinc-200 bg-white text-[12px] font-medium focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex-1 md:max-w-[160px] flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Order Status</label>
            <select 
              value={filters.status}
              onChange={handleStatusChange}
              className="w-full h-9.5 px-3 rounded-lg border border-zinc-200 bg-white text-[12px] font-bold focus:border-brand-primary outline-none appearance-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Received">Received</option>
              <option value="In Production">In Production</option>
              <option value="Shipped">Shipped</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="flex-1 md:max-w-[180px] flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Project Lead</label>
            <select 
              value={filters.engineer}
              onChange={handleEngineerChange}
              className="w-full h-9.5 px-3 rounded-lg border border-zinc-200 bg-white text-[12px] font-bold focus:border-brand-primary outline-none appearance-none cursor-pointer"
            >
              <option value="All">All Engineers</option>
              {engineers.map(u => (
                <option key={u.$id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 md:max-w-[200px] flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] px-1">Time Period</label>
            <button 
              onClick={() => setShowDatePicker(true)}
              className="w-full h-9.5 pl-3 pr-8 rounded-lg border border-zinc-200 bg-white text-[12px] font-bold text-left focus:border-brand-primary outline-none relative"
            >
              {filters.dateRange.start
                ? filters.dateRange.end && !isSameDay(filters.dateRange.start, filters.dateRange.end)
                  ? `${format(filters.dateRange.start, 'MMM d')} – ${format(filters.dateRange.end, 'MMM d, y')}`
                  : format(filters.dateRange.start, 'MMM d, y')
                : "All Records"}
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-300" />
            </button>
          </div>

        </section>

        {/* Table Section */}
        <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr style={{ fontSize: '10px' }}>
                   <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-[0.2em]">PO Reference</th>
                   <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-[0.2em]">Customer / Project</th>
                   <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-[0.2em]">Lead Engineer</th>
                   <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-[0.2em] text-center">PO Date</th>
                   <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-[0.2em] text-center">Delivery</th>
                   <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-[0.2em] text-center">Status</th>
                   <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Order Value</th>
                   <th className="px-6 py-4 font-black text-zinc-400 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {isLoading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="8" className="px-6 py-5 align-middle"><div className="h-5 w-full bg-zinc-50 rounded" /></td>
                    </tr>
                  ))
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-24 text-center">
                       <div className="flex flex-col items-center gap-3 text-zinc-400">
                          <Briefcase className="h-10 w-10 text-zinc-200" />
                          <p className="text-sm font-medium italic">No confirmed orders found matching your criteria.</p>
                       </div>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.$id} className="group hover:bg-zinc-50 transition-all duration-200">
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="text-brand-primary font-black tracking-tight" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>{order.po_number}</span>
                            <span className="font-mono text-zinc-400 uppercase tracking-tighter" style={{ fontSize: '9px' }}>QTN: {order.quotation_no}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col max-w-[220px]">
                            <span className="font-bold text-zinc-800 truncate" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>{order.customer_name}</span>
                            <span className="text-zinc-500 font-medium truncate italic" style={{ fontSize: '11px' }}>{order.project_name}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-zinc-500 font-semibold" style={{ fontSize: THEME.FONT_SIZE.SMALL }}>{order.engineer_name || '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold font-mono text-zinc-400" style={{ fontSize: '10px' }}>
                         {order.po_date ? new Date(order.po_date).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td className="px-6 py-4 text-center" style={{ fontSize: '10px' }}>
                        {order.delivery_date ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-bold font-mono text-zinc-400">{new Date(order.delivery_date).toLocaleDateString('en-GB')}</span>
                            {(() => { const b = getDueBadge(order.delivery_date); return b ? <span className={`text-[9px] uppercase tracking-widest ${b.cls}`}>{b.label}</span> : null; })()}
                          </div>
                        ) : <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="relative inline-block">
                          <select 
                            value={order.status}
                            disabled={updatingStatusId === order.$id}
                            onChange={(e) => handleStatusUpdate(order.$id, e.target.value)}
                            className={`inline-flex rounded-lg px-2 py-1 pr-6 font-black uppercase tracking-widest leading-none border appearance-none cursor-pointer outline-none transition-all ${getStatusStyle(order.status)} ${updatingStatusId === order.$id ? 'opacity-50 animate-pulse' : 'hover:scale-105 active:scale-95'}`}
                            style={{ fontSize: '9px' }}
                          >
                            <option value="Received">Received</option>
                            <option value="In Production">In Production</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                             <Settings2 className="h-2.5 w-2.5" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex flex-col items-end">
                            <span className="font-mono font-black text-emerald-900" style={{ fontSize: THEME.FONT_SIZE.BASE }}>
                               ₹{parseFloat(order.actual_valuation || order.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            {order.actual_valuation && Math.abs(order.actual_valuation - order.total_amount) > 0.01 && (
                               <span className="text-[9px] font-bold text-zinc-400 line-through tracking-tighter decoration-emerald-500/30">
                                  ₹{parseFloat(order.total_amount || 0).toLocaleString('en-IN')}
                               </span>
                            )}
                         </div>
                      </td>
                       <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                           {order.po_file_id && (
                             <button
                               onClick={() => setPreviewFile({
                                 url: assetService.getFileView(order.po_file_id),
                                 title: "Client Purchase Order",
                                 filename: `PO_${order.po_number}.pdf`
                               })}
                               className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
                               title="View PO Document"
                             >
                                <FileText className="h-4 w-4" />
                             </button>
                           )}
                           <button 
                             onClick={() => setSelectedOrder(order)}
                             className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 hover:text-brand-primary hover:bg-brand-primary/10 transition-all shadow-sm"
                             title="View Details"
                           >
                              <ChevronRight className="h-4 w-4" />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination total={total} page={page} limit={limit} onPageChange={setPage} label="Orders" />
        </section>
      </div>

      {showDatePicker && (
        <DateRangePicker 
          value={filters.dateRange}
          onChange={handleDateRangeChange}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {/* Modals */}
      {previewFile && (
        <PdfPreviewModal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          url={previewFile.url}
          title={previewFile.title}
          filename={previewFile.filename}
        />
      )}

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
        />
      )}
    </DashboardLayout>
  );
}
