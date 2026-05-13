'use client';

import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Wallet,
  ArrowRight,
  Shield,
  Activity,
  CreditCard,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Transaction, AuditLog, UserStats, WalletStats } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/hooks/useAuth';

export default function DashboardOverview() {
  // 1. Fetch User Profile
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data;
    },
  });

  // 2. Fetch Wallet Stats (Elasticsearch Metrics)
  const { data: walletStats, isLoading: statsLoading } = useQuery<WalletStats>({
    queryKey: ['wallet-stats'],
    queryFn: async () => {
      const res = await api.get('/wallet/stats');
      return res.data;
    },
  });

  // 3. Fetch Balance
  const { data: balanceData } = useQuery<{ balance: number }>({
    queryKey: ['balance'],
    queryFn: async () => {
      const res = await api.get('/wallet/balance');
      return res.data;
    },
  });

  // 4. Fetch Recent Enriched Transactions
  const { data: historyData } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ['history', { limit: 5 }],
    queryFn: async () => {
      const res = await api.get('/wallet/history', { params: { limit: 5 } });
      return res.data;
    },
  });

  // 5. Fetch Recent Activity (Audit)
  const { data: activityData } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs', { limit: 5 }],
    enabled: !!profile?.userId,
    queryFn: async () => {
      const res = await api.get(`/audit/logs/${profile?.userId}`, { params: { limit: 5 } });
      return res.data;
    },
  });

  const growth = (walletStats?.monthlyReceived ?? 0) > 0 
    ? (((walletStats?.monthlyReceived ?? 0) - (walletStats?.monthlySpent ?? 0)) / (walletStats?.monthlyReceived ?? 1) * 100).toFixed(1)
    : '0';

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {profile?.firstName || 'User'}!</h1>
            <p className="text-slate-500">Your financial summary for this month.</p>
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-400">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
            <div className="h-8 w-8 rounded-full border-2 border-white bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
              +12
            </div>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Current Balance"
            value={`$${balanceData?.balance?.toLocaleString() || '0.00'}`}
            icon={Wallet}
            color="indigo"
          />
          <StatCard
            title="Monthly Spent"
            value={`$${walletStats?.monthlySpent?.toLocaleString() || '0.00'}`}
            icon={TrendingDown}
            color="amber"
            trend="-12%"
          />
          <StatCard
            title="Monthly Income"
            value={`$${walletStats?.monthlyReceived?.toLocaleString() || '0.00'}`}
            icon={TrendingUp}
            color="emerald"
            trend="+8.4%"
          />
          <StatCard
            title="Monthly Growth"
            value={`${growth}%`}
            icon={Activity}
            color="blue"
            trend="Live"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent Transactions</h2>
              <Link href="/dashboard/history" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {historyData?.transactions?.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">No transactions yet.</div>
                ) : (
                  historyData?.transactions?.map((tx) => (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-400 text-xs shadow-sm">
                          {tx.counterparty?.avatarUrl ? (
                            <img src={tx.counterparty.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                          ) : (
                            tx.counterparty?.firstName?.charAt(0) || 'U'
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {tx.direction === 'OUTBOUND' ? 'Sent to' : 'Received from'}{' '}
                            {tx.counterparty?.firstName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                            {tx.createdAt ? format(new Date(tx.createdAt), 'MMM dd, HH:mm') : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-bold",
                          tx.direction === 'INBOUND' ? "text-emerald-600" : "text-slate-900"
                        )}>
                          {tx.direction === 'INBOUND' ? '+' : '-'}${tx.amount.toLocaleString()}
                        </p>
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                          tx.status === 'SUCCESS' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        )}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Activity Feed */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Security & Activity</h2>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="space-y-6">
                {activityData?.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-sm italic">No recent activity.</div>
                ) : (
                  activityData?.map((log) => (
                    <div key={log._id} className="flex space-x-3">
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-indigo-500 ring-4 ring-indigo-50" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-slate-500">{format(new Date(log.createdAt), 'HH:mm')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link href="/dashboard/activity" className="mt-6 block text-center py-2 px-4 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                View Full Log
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: any;
  color: 'indigo' | 'emerald' | 'amber' | 'blue';
  trend?: string | null;
}

function StatCard({ title, value, icon: Icon, color, trend }: StatCardProps) {
  const colors = {
    indigo: "text-indigo-600 bg-indigo-50",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    blue: "text-blue-600 bg-blue-50",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-lg", colors[color])}>
          <Icon className="h-6 w-6" />
        </div>
        {trend && (
          <span className={cn(
            "text-[10px] font-bold px-2 py-1 rounded-full",
            trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : 
            trend === 'Live' ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
          )}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
