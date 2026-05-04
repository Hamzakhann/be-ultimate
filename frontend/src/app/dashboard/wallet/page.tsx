'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  History,
  Loader2,
  RefreshCcw
} from 'lucide-react';
import api from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Transaction } from '@/types';

const transferSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
  amount: z.number().positive('Amount must be greater than 0'),
});

type TransferForm = z.infer<typeof transferSchema>;

export default function WalletPage() {
  const queryClient = useQueryClient();

  // Fetch Balance
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useQuery<{ balance: number }>({
    queryKey: ['balance'],
    queryFn: async () => {
      const response = await api.get('/wallet/balance');
      return response.data;
    },
  });

  // Fetch History
  const { data: historyData, isLoading: historyLoading } = useQuery<{ transactions: Transaction[], total: number }>({
    queryKey: ['history'],
    queryFn: async () => {
      const response = await api.get('/wallet/history');
      return response.data;
    },
  });

  // Transfer Mutation
  const transferMutation = useMutation({
    mutationFn: async (data: TransferForm) => {
      return api.post('/wallet/transfer', data);
    },
    onSuccess: () => {
      toast.success('Transfer initiated successfully!');
      // Optimistic update: Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['history'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Transfer failed.');
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TransferForm>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      recipientId: '',
      amount: 0,
    },
  });

  const onTransfer: SubmitHandler<TransferForm> = (data) => {
    transferMutation.mutate(data);
    reset();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">My Wallet</h1>
          <button
            onClick={() => refetchBalance()}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <RefreshCcw className="h-5 w-5" />
          </button>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Wallet className="h-6 w-6" />
              </div>
              <span className="text-indigo-100 font-medium">Total Balance</span>
            </div>
            <div className="text-4xl font-extrabold tracking-tight">
              {balanceLoading ? (
                <div className="h-10 w-32 bg-white/20 animate-pulse rounded"></div>
              ) : (
                `$${balanceData?.toLocaleString() || '0.00'}`
              )}
            </div>
            <div className="mt-4 text-sm text-indigo-200 flex items-center">
              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded mr-2">+2.5%</span>
              vs last month
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm col-span-1 md:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
              <Send className="h-5 w-5 mr-2 text-indigo-600" />
              Quick Transfer
            </h3>
            <form onSubmit={handleSubmit((data: any) => onTransfer(data as TransferForm))} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  {...register('recipientId')}
                  placeholder="Recipient User ID"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                {errors.recipientId && <p className="mt-1 text-xs text-red-600">{errors.recipientId.message}</p>}
              </div>
              <div className="w-full md:w-32">
                <input
                  {...register('amount', { valueAsNumber: true })}
                  type="number"
                  placeholder="Amount"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
                {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
              </div>
              <button
                type="submit"
                disabled={transferMutation.isPending}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold hover:bg-slate-800 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {transferMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : 'Send'}
              </button>
            </form>
          </div>
        </div>

        {/* History Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-semibold text-slate-900 flex items-center">
              <History className="h-5 w-5 mr-2 text-indigo-600" />
              Transaction History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyLoading ? (
                  [1, 2, 3].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-4 h-16 bg-slate-50/30"></td>
                    </tr>
                  ))
                ) : !historyData?.transactions || historyData.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">No transactions found</td>
                  </tr>
                ) : (
                  historyData.transactions.map((tx: Transaction) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          tx.status === 'SUCCESS' ? "bg-emerald-100 text-emerald-800" :
                            tx.status === 'PENDING' ? "bg-amber-100 text-amber-800" :
                              "bg-red-100 text-red-800"
                        )}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{tx.id}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {tx.fromUserId === 'me' ? '-' : '+'}${tx.amount}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {format(new Date(tx.createdAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
