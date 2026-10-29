'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  Activity,
  Play,
  RotateCcw,
  StopCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Globe,
  DollarSign,
  AlertCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';

function JobsContent() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  const [activeJobId, setActiveJobId] = useState<string | null>(highlightId);
  const [liveEvents, setLiveEvents] = useState<any>(null);

  const { data: jobsData, refetch: refetchJobs } = useQuery({
    queryKey: ['collectionJobs'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/jobs?limit=25');
      return res.data;
    },
    refetchInterval: 5000,
  });

  const { data: activeJobDetails, refetch: refetchActiveJob } = useQuery({
    queryKey: ['jobDetails', activeJobId],
    queryFn: async () => {
      if (!activeJobId) return null;
      const res = await apiClient.get(`/api/v1/jobs/${activeJobId}`);
      return res.data;
    },
    enabled: !!activeJobId,
    refetchInterval: 3000,
  });

  // Subscribe to SSE stream for active job
  useEffect(() => {
    if (!activeJobId) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const eventSource = new EventSource(`${apiBase}/api/v1/jobs/${activeJobId}/events`);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setLiveEvents(parsed);
        refetchJobs();
        refetchActiveJob();
      } catch (e) {}
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [activeJobId]);

  const handleCancel = async (jobId: string) => {
    try {
      await apiClient.post(`/api/v1/jobs/${jobId}/cancel`);
      refetchJobs();
      refetchActiveJob();
    } catch (e: any) {
      alert(`Error cancelling job: ${e.response?.data?.message || e.message}`);
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      await apiClient.post(`/api/v1/jobs/${jobId}/retry`);
      refetchJobs();
      refetchActiveJob();
    } catch (e: any) {
      alert(`Error retrying job: ${e.response?.data?.message || e.message}`);
    }
  };

  const activeJob = activeJobDetails;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Collection Jobs & Live Monitor</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time Server-Sent Events (SSE) background worker tracking and execution stats
          </p>
        </div>
        <Link
          href="/wizard"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg shadow-xs"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Launch New Job</span>
        </Link>
      </div>

      {/* Real-Time Live Monitor Card (if a job is active or selected) */}
      {activeJob && (
        <div className="bg-white rounded-xl border border-indigo-200 shadow-md p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500"></div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></span>
                <h2 className="text-lg font-bold text-slate-900">{activeJob.name}</h2>
                <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded-full">
                  {liveEvents?.status || activeJob.status}
                </span>
                {activeJob.isMockMode && (
                  <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-full">
                    Mock Engine
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Stage:{' '}
                <strong className="text-slate-800">
                  {liveEvents?.stage || activeJob.status.replace(/_/g, ' ')}
                </strong>{' '}
                {liveEvents?.message && `— ${liveEvents.message}`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {['SEARCHING', 'FETCHING_DETAILS', 'APPLYING_FILTERS', 'PENDING'].includes(activeJob.status) && (
                <button
                  onClick={() => handleCancel(activeJob.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  <span>Cancel Job</span>
                </button>
              )}

              {['FAILED', 'CANCELLED', 'COMPLETED_WITH_ERRORS'].includes(activeJob.status) && (
                <button
                  onClick={() => handleRetry(activeJob.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Job</span>
                </button>
              )}

              <Link
                href={`/businesses?jobId=${activeJob.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Results ({activeJob.matchedCount})</span>
              </Link>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="py-4">
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Collection Progress</span>
              <span>
                {liveEvents?.percentage !== undefined
                  ? `${liveEvents.percentage}%`
                  : activeJob.status === 'COMPLETED'
                  ? '100%'
                  : `${Math.round((activeJob.matchedCount / activeJob.targetCount) * 100)}%`}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  activeJob.status === 'FAILED'
                    ? 'bg-rose-500'
                    : activeJob.status === 'COMPLETED'
                    ? 'bg-emerald-500'
                    : 'bg-indigo-600'
                }`}
                style={{
                  width: `${
                    liveEvents?.percentage !== undefined
                      ? liveEvents.percentage
                      : activeJob.status === 'COMPLETED'
                      ? 100
                      : Math.min(Math.round((activeJob.matchedCount / activeJob.targetCount) * 100), 100)
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Live Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-2">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Discovered</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                {liveEvents?.discoveredCount ?? activeJob.discoveredCount}
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Processed</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                {liveEvents?.processedCount ?? activeJob.processedCount}
              </span>
            </div>
            <div className="bg-indigo-50/60 rounded-lg p-3 border border-indigo-100">
              <span className="text-[11px] font-medium text-indigo-700 block">Matched Target</span>
              <span className="text-lg font-bold text-indigo-900 mt-0.5 block">
                {liveEvents?.matchedCount ?? activeJob.matchedCount} / {activeJob.targetCount}
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">With Phone</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                {activeJob.stats?.withPhone ?? 0}
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">API Calls</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                {liveEvents?.requestCount ?? activeJob.requestCount}
              </span>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">Est. Cost</span>
              <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                ${(liveEvents?.estimatedCost ?? activeJob.estimatedCost).toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* All Jobs List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">All Collection Operations</h2>
          <span className="text-xs text-slate-500 font-medium">
            {jobsData?.pagination?.total ?? 0} total jobs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Job Name</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Progress</th>
                <th className="py-3 px-4">Matched</th>
                <th className="py-3 px-4">API Calls</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {jobsData?.items && jobsData.items.length > 0 ? (
                jobsData.items.map((job: any) => {
                  const loc = job.locationConfig || {};
                  const isSelected = activeJobId === job.id;

                  return (
                    <tr
                      key={job.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {job.name}
                        {job.isMockMode && (
                          <span className="ml-2 text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1 rounded">
                            Mock
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {loc.city || loc.locality || 'Global'}, {loc.country || ''}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            job.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : job.status === 'FAILED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(
                                Math.round((job.matchedCount / (job.targetCount || 1)) * 100),
                                100,
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {job.matchedCount} / {job.targetCount}
                      </td>
                      <td className="py-3.5 px-4">{job.requestCount}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveJobId(job.id)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Monitor
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No jobs recorded yet.
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

export default function JobsPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-slate-500 text-sm">Loading jobs tracker...</div>}>
      <JobsContent />
    </React.Suspense>
  );
}

