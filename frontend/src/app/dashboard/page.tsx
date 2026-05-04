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
import { Transaction, AuditLog, UserStats } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DashboardOverview() {
  // 1. Fetch User Profile & Stats
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data;
    },
  });

  const { data: stats } = useQuery<UserStats>({
    queryKey: ['stats', profile?.id],
    enabled: !!profile?.id,
    queryFn: async () => {
      const res = await api.get(`/audit/stats/${profile.id}`);
      return res.data;
    },
  });

  // 2. Fetch Balance
  const { data: balanceData } = useQuery({
    queryKey: ['balance'],
    queryFn: async () => {
      const res = await api.get('/wallet/balance');
      return res.data;
    },
  });

  // 3. Fetch Recent Transactions
  const { data: historyData } = useQuery<{ transactions: Transaction[] }>({
    queryKey: ['history', { limit: 5 }],
    queryFn: async () => {
      const res = await api.get('/wallet/history', { params: { limit: 5 } });
      return res.data;
    },
  });

  // 4. Fetch Recent Activity
  const { data: activityData } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs', { limit: 5 }],
    enabled: !!profile?.id,
    queryFn: async () => {
      const res = await api.get(`/audit/logs/${profile.id}`, { params: { limit: 5 } });
      return res.data;
    },
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {profile?.name || 'User'}!</h1>
          <p className="text-slate-500">Here's what's happening with your account today.</p>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Balance"
            value={`$${balanceData?.toLocaleString() || '0.00'}`}
            icon={Wallet}
            color="indigo"
          />
          <StatCard
            title="Total Volume"
            value={`$${stats?.totalVolumeUSD?.toLocaleString() || '0'}`}
            icon={TrendingUp}
            color="emerald"
          />
          <StatCard
            title="Transactions"
            value={stats?.totalTransactions?.toString() || '0'}
            icon={Activity}
            color="amber"
          />
          <StatCard
            title="Security Level"
            value="Optimal"
            icon={Shield}
            color="blue"
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
                        <div className={cn(
                          "p-2 rounded-lg",
                          tx.status === 'SUCCESS' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                        )}>
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Transfer</p>
                          <p className="text-xs text-slate-500">{format(new Date(tx.createdAt), 'MMM dd, HH:mm')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-bold",
                          tx.fromUserId === 'me' ? "text-slate-900" : "text-emerald-600"
                        )}>
                          {tx.fromUserId === 'me' ? '-' : '+'}${tx.amount}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-slate-400">{tx.status}</p>
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

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors: any = {
    indigo: "text-indigo-600 bg-indigo-50",
    emerald: "text-emerald-600 bg-emerald-50",
    amber: "text-amber-600 bg-amber-50",
    blue: "text-blue-600 bg-blue-50",
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-lg", colors[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
