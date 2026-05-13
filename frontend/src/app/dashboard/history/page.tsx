'use client';

import { useQuery } from '@tanstack/react-query';
import {
  History,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Transaction } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 10;

  // Fetch History or Search Results
  const { data, isLoading } = useQuery<{ transactions: Transaction[], total: number }>({
    queryKey: ['history', { page, limit, searchQuery }],
    queryFn: async () => {
      // If there is a search query, use the search endpoint
      if (searchQuery) {
        const res = await api.get('/search/transactions', {
          params: {
            q: searchQuery,
            from: page * limit,
            size: limit
          }
        });
        // Map Search Result to History structure
        return {
          transactions: res.data.data.map((tx: any) => ({
            ...tx,
            createdAt: tx.createdAt || tx.timestamp // Normalize Elastic timestamp to createdAt
          })),
          total: res.data.total
        };
      }

      // Default: regular history
      const res = await api.get('/wallet/history', {
        params: {
          limit,
          offset: page * limit
        }
      });
      return res.data;
    },
  });

  const safeFormatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch (e) {
      return 'N/A';
    }
  };

  const totalPages = Math.ceil((data?.total || 0) / limit);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
            <p className="text-slate-500">Detailed record of all your financial movements.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all">
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search by ID or amount..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0); // Reset to first page on search
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-black"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-600 hover:bg-slate-100">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Full Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  [1, 2, 3, 4, 5].map(i => (
                    <tr key={i} className="animate-pulse h-16">
                      <td colSpan={5} className="px-6 py-4 bg-slate-50/20"></td>
                    </tr>
                  ))
                ) : data?.transactions?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500">No transactions recorded.</td>
                  </tr>
                ) : (
                  data?.transactions?.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "p-2 rounded-full",
                            tx.direction === 'OUTBOUND' ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-600"
                          )}>
                            {tx.direction === 'OUTBOUND' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                          </div>
                          <span className="text-sm font-semibold text-slate-700">
                            {tx.direction === 'OUTBOUND' ? 'Payment Sent' : 'Payment Received'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center mr-3 font-bold text-slate-400 text-xs shadow-sm">
                            {tx.counterparty?.avatarUrl ? (
                              <img src={tx.counterparty.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                              tx.counterparty?.firstName?.charAt(0) || 'U'
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">
                              {tx.counterparty?.firstName} {tx.counterparty?.lastName}
                            </p>
                            <p className="text-xs font-mono text-slate-400">ID: {tx.id.split('-')[0]}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          tx.status === 'SUCCESS' ? "bg-emerald-100 text-emerald-700" :
                            tx.status === 'PENDING' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                        )}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "text-sm font-bold",
                          tx.direction === 'OUTBOUND' ? "text-slate-900" : "text-emerald-600"
                        )}>
                          {tx.direction === 'OUTBOUND' ? '-' : '+'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {safeFormatDate(tx.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/30">
            <p className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-700">{page * limit + 1}</span> to <span className="font-bold text-slate-700">{Math.min((page + 1) * limit, data?.total || 0)}</span> of <span className="font-bold text-slate-700">{data?.total || 0}</span> entries
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-xs font-bold px-3">Page {page + 1} of {totalPages || 1}</div>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1}
                className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
