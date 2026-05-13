'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Shield,
  Save,
  Loader2,
  Camera,
  MapPin
} from 'lucide-react';
import api from '@/lib/api';
import DashboardLayout from '@/components/layout/DashboardLayout';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email address').optional(), // Usually email is read-only in fintech for security
  phoneNumber: z.string().optional(),
  currencyPreference: z.string().length(3).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const queryClient = useQueryClient();

  // Fetch Profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.data;
    },
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      email: profile?.email || '',
      phoneNumber: profile?.phoneNumber || '',
      currencyPreference: profile?.currencyPreference || 'USD',
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      return api.patch('/users/profile', data);
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Update failed.');
    },
  });

  const onSubmit = (data: ProfileForm) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-slate-200 rounded-2xl w-full"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
            <div className="h-64 bg-slate-200 rounded-2xl"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-slate-500">Manage your personal information and preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Avatar & Summary */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="relative inline-block">
                <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center text-3xl font-bold text-slate-400 border-4 border-white shadow-md overflow-hidden">
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    profile?.firstName?.charAt(0) || 'U'
                  )}
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50">
                  <Camera className="h-4 w-4 text-slate-600" />
                </button>
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">{profile?.firstName} {profile?.lastName}</h2>
              <p className="text-sm text-slate-500 flex items-center justify-center mt-1">
                <Mail className="h-3 w-3 mr-1" /> {profile?.email}
              </p>
              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                  <p className="text-sm font-semibold text-emerald-600">Verified</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400">KYC</p>
                  <p className="text-sm font-semibold text-blue-600">Level 2</p>
                </div>
              </div>
            </div>

            <div className="bg-indigo-600 p-6 rounded-2xl shadow-xl text-white">
              <div className="flex items-start space-x-3">
                <Shield className="h-6 w-6 text-indigo-200" />
                <div>
                  <h3 className="font-bold">Security Tip</h3>
                  <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
                    Always check the URL before signing in. We will never ask for your password via email.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Personal Information</h3>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        {...register('firstName')}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border text-black border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                        placeholder="First Name"
                      />
                    </div>
                    {errors.firstName && <p className="text-xs text-red-600 font-medium">{errors.firstName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        {...register('lastName')}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-black"
                        placeholder="Last Name"
                      />
                    </div>
                    {errors.lastName && <p className="text-xs text-red-600 font-medium">{errors.lastName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        {...register('phoneNumber')}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm text-black"
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                    {errors.phoneNumber && <p className="text-xs text-red-600 font-medium">{errors.phoneNumber.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Currency Preference</label>
                    <div className="relative">
                      <select
                        {...register('currencyPreference')}
                        className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm appearance-none"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                    {errors.currencyPreference && <p className="text-xs text-red-600 font-medium">{errors.currencyPreference.message}</p>}
                  </div>

                  <div className="space-y-2 opacity-60 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Email Address (Locked)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                      <input
                        {...register('email')}
                        disabled
                        className="w-full pl-10 pr-4 py-3 bg-slate-200 border border-slate-300 rounded-xl outline-none text-sm cursor-not-allowed text-black"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="flex items-center space-x-2 px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <>
                        <Save className="h-5 w-5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
