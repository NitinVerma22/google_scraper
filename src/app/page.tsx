'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  Building2,
  TrendingUp,
  Phone,
  Globe,
  Globe2,
  Star,
  Activity,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  ArrowRight,
  Layers,
} from 'lucide-react';

export default function DashboardPage() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/dashboard/summary');
      return res.data;
    },
    refetchInterval: 10000,
  });

  const { data: activity, isLoading: loadingActivity } = useQuery({
    queryKey: ['dashboardActivity'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/dashboard/activity');
      return res.data;
    },
    refetchInterval: 10000,
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Business Intelligence Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time analytics and verified lead statistics from Google Maps Platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/wizard"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2.5 rounded-lg shadow-sm shadow-indigo-100 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Collection Job</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Businesses */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Records</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {loadingSummary ? '...' : (summary?.totalBusinesses ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500 mr-1" />
            <span className="text-emerald-600 font-semibold mr-1">+{summary?.periodBusinesses ?? 0}</span>
            <span>last 30 days</span>
          </div>
        </div>

        {/* Running & Completed Jobs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Operations</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {loadingSummary ? '...' : summary?.runningJobs ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-500">running</span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1" />
            <span>{summary?.completedJobs ?? 0} completed</span>
            {summary?.failedJobs > 0 && (
              <span className="ml-2 text-rose-500 font-semibold">• {summary.failedJobs} failed</span>
            )}
          </div>
        </div>

        {/* Contact Enrichment Ratio */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Coverage</span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {loadingSummary ? '...' : summary?.withPhone ?? 0}
            </span>
            <span className="text-xs font-medium text-slate-500">with phone</span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <Globe className="w-3.5 h-3.5 text-indigo-500 mr-1" />
            <span>{summary?.withWebsite ?? 0} websites</span>
            <span className="text-slate-400 mx-1">/</span>
            <span>{summary?.withoutWebsite ?? 0} no site</span>
          </div>
        </div>

        {/* Ratings & Estimated Costs */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">API Usage & Cost</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              ${loadingSummary ? '...' : (summary?.totalApiCostUSD ?? 0).toFixed(3)}
            </span>
          </div>
          <div className="mt-2 flex items-center text-xs text-slate-500">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 mr-1" />
            <span className="font-semibold text-slate-700 mr-1">{summary?.averageRating ?? 0} avg</span>
            <span>({(summary?.totalReviews ?? 0).toLocaleString()} reviews)</span>
          </div>
        </div>
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Jobs Panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Collection Jobs</h2>
              <p className="text-xs text-slate-500 mt-0.5">Automated Google Places search operations</p>
            </div>
            <Link
              href="/jobs"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {activity?.recentJobs && activity.recentJobs.length > 0 ? (
              activity.recentJobs.map((job: any) => (
                <div key={job.id} className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{job.name}</h3>
                      {job.isMockMode && (
                        <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 px-1.5 py-0.5 rounded">
                          Mock Engine
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                      <span>Target: {job.targetCount}</span>
                      <span className="text-indigo-600 font-medium">Matched: {job.matchedCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        job.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : job.status === 'FAILED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          : 'bg-blue-50 text-blue-700 border border-blue-200/60 animate-pulse'
                      }`}
                    >
                      {job.status}
                    </span>
                    <Link
                      href={`/jobs?highlight=${job.id}`}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-2.5 py-1 rounded-lg"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">
                No collection jobs recorded yet. Launch your first job via the button above.
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Top Business Categories</h2>
            <p className="text-xs text-slate-500 mt-0.5">Distribution across verified listings</p>

            <div className="mt-5 space-y-4">
              {activity?.categoryDistribution && activity.categoryDistribution.length > 0 ? (
                activity.categoryDistribution.map((item: any) => {
                  const percentage = Math.min(
                    Math.round((item.count / (summary?.totalBusinesses || 1)) * 100),
                    100,
                  );
                  return (
                    <div key={item.category}>
                      <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                        <span className="capitalize">{item.category.replace(/_/g, ' ')}</span>
                        <span className="font-semibold text-slate-900">{item.count}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 8)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-sm text-slate-400">
                  Category metrics will display after initial collection.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href="/businesses"
              className="w-full py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Explore Full Business Directory</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
