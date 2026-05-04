'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  Bell, 
  LogIn, 
  ArrowRightLeft, 
  UserPlus, 
  RefreshCcw,
  Clock,
  ShieldCheck
} from 'lucide-react';
import api from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AuditLog } from '@/types';

export default function ActivityPage() {
  // Fetch Logs
  const { data: logs, isLoading, refetch } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      // In a real app, we'd get the userId from Auth context or /users/me
      const profile = await api.get('/users/me');
      const response = await api.get(`/audit/logs/${profile.data.id}`);
      return response.data;
    },
  });

  const getIcon = (action: string) => {
    switch (action) {
      case 'USER_LOGGED_IN': return LogIn;
      case 'MONEY_SENT': return ArrowRightLeft;
      case 'MONEY_RECEIVED': return ArrowRightLeft;
      case 'USER_CREATED': return UserPlus;
      default: return Bell;
    }
  };

  const getColor = (action: string) => {
    switch (action) {
      case 'USER_LOGGED_IN': return "bg-blue-100 text-blue-600";
      case 'MONEY_SENT': return "bg-amber-100 text-amber-600";
      case 'MONEY_RECEIVED': return "bg-emerald-100 text-emerald-600";
      case 'USER_CREATED': return "bg-indigo-100 text-indigo-600";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
            <p className="text-slate-500 text-sm mt-1">Real-time security and transaction history</p>
          </div>
          <button 
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          
          <div className="p-8">
            {isLoading ? (
              <div className="space-y-6">
                {[1,2,3,4].map(i => (
                  <div key={i} className="flex space-x-4 animate-pulse">
                    <div className="h-10 w-10 bg-slate-100 rounded-full"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : logs?.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheck className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500">No activity recorded yet.</p>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {logs?.map((log: AuditLog, idx: number) => {
                    const Icon = getIcon(log.action);
                    return (
                      <li key={log._id}>
                        <div className="relative pb-8">
                          {idx !== logs.length - 1 && (
                            <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-slate-100" aria-hidden="true" />
                          )}
                          <div className="relative flex items-start space-x-4">
                            <div className={cn("h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white", getColor(log.action))}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1 py-1.5">
                              <div className="text-sm text-slate-900">
                                <span className="font-bold mr-2">{log.action.replace(/_/g, ' ')}</span>
                                {log.metadata?.amount && (
                                  <span className="text-slate-500">of ${log.metadata.amount}</span>
                                )}
                              </div>
                              <div className="mt-1 flex items-center space-x-4 text-xs text-slate-500">
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss')}
                                </span>
                                {log.ipAddress && (
                                  <span className="flex items-center">
                                    IP: {log.ipAddress}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
