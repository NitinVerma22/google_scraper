'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { DollarSign, Activity, Server, ShieldCheck, Clock, Key } from 'lucide-react';

export default function UsagePage() {
  const { data: usage, isLoading } = useQuery({
    queryKey: ['usageSummary'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/usage/summary');
      return res.data;
    },
    refetchInterval: 5000,
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">API Usage & Billing Monitoring</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor Google Maps Platform Places API (New) requests and estimated cost tracking
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total API Requests</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              {isLoading ? '...' : usage?.totalRequests ?? 0}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">All time platform API invocations</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Estimated Spend</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900">
              ${isLoading ? '...' : (usage?.totalEstimatedCostUSD ?? 0).toFixed(4)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Calculated from Google Maps SKU prices</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Engine Status</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl font-bold text-emerald-800">
              Official Google Maps API (Live)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Places API (New) & Geocoding Connected</p>
        </div>
      </div>

      {/* Endpoint Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Google Places API Endpoint Breakdown</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4">Request Count</th>
                <th className="py-3 px-4 text-right">Estimated Cost (USD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {usage?.endpointBreakdown && usage.endpointBreakdown.length > 0 ? (
                usage.endpointBreakdown.map((ep: any) => (
                  <tr key={ep.endpoint} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{ep.endpoint}</td>
                    <td className="py-3 px-4">{ep.requests} calls</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-900">
                      ${ep.costUSD.toFixed(4)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-400">
                    No API usage records yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent API Call Logs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Recent API Audit Invocations</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Endpoint</th>
                <th className="py-3 px-4">Job Linked</th>
                <th className="py-3 px-4">HTTP Status</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {usage?.recentLogs && usage.recentLogs.length > 0 ? (
                usage.recentLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono">{log.endpoint}</td>
                    <td className="py-3 px-4">{log.job?.name || 'Manual lookup'}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-700">{log.statusCode} OK</span>
                    </td>
                    <td className="py-3 px-4">{log.durationMs}ms</td>
                    <td className="py-3 px-4">${log.estimatedCost.toFixed(4)}</td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No logs recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
