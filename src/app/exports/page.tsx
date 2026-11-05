'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { FileSpreadsheet, Download, FileText, CheckCircle2, Clock, AlertCircle, Filter, Sparkles, Building2, Layers } from 'lucide-react';

export default function ExportsPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [minRating, setMinRating] = useState('');
  const [hasPhone, setHasPhone] = useState('');

  // Fetch unique categories
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/api/v1/businesses/categories');
        return res.data || [];
      } catch {
        return [];
      }
    },
  });

  // Fetch collection jobs for dropdown
  const { data: jobsList = [] } = useQuery<any[]>({
    queryKey: ['exportJobsSelect'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/api/v1/jobs?limit=50');
        return res.data?.items || [];
      } catch {
        return [];
      }
    },
  });

  // Calculate live matching records count for selected filters
  const { data: matchCount = 0, isLoading: isCountLoading } = useQuery({
    queryKey: ['exportMatchCount', selectedJobId, selectedCategory, selectedCity, minRating, hasPhone],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '1');
      if (selectedJobId) params.set('jobId', selectedJobId);
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedCity) params.set('city', selectedCity);
      if (minRating) params.set('minRating', minRating);
      if (hasPhone) params.set('hasPhone', hasPhone);

      const res = await apiClient.get(`/api/v1/businesses?${params.toString()}`);
      return res.data?.total || 0;
    },
  });

  const { data: exportsList, refetch } = useQuery({
    queryKey: ['exportJobs'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/exports');
      return res.data;
    },
    refetchInterval: 4000,
  });

  const triggerExport = async (format: 'CSV' | 'XLSX') => {
    setIsExporting(true);
    try {
      await apiClient.post('/api/v1/exports', {
        format,
        jobId: selectedJobId || undefined,
        category: selectedCategory || undefined,
        city: selectedCity || undefined,
        minRating: minRating || undefined,
        hasPhone: hasPhone || undefined,
        selectedFields: [
          'name',
          'primaryType',
          'phone',
          'website',
          'rating',
          'userRatingCount',
          'reviewOpportunityScore',
          'leadGrade',
          'locality',
          'city',
          'state',
          'postalCode',
          'formattedAddress',
          'googleMapsUrl',
        ],
      });
      refetch();
    } catch (e: any) {
      alert(`Export failed: ${e.response?.data?.message || e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedJobObj = jobsList.find((j: any) => j.id === selectedJobId);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Export Center</h1>
        <p className="text-sm text-slate-500 mt-1">
          Download leads by collection operation, business category or custom filters in CSV & Excel formats
        </p>
      </div>

      {/* Category & Filter Export Card */}
      <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-6 space-y-5 bg-gradient-to-br from-white to-indigo-50/20">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Download Data by Collection Job or Filter</h2>
              <p className="text-xs text-slate-500">Select any collection or apply filters to download verified leads</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-200 text-xs font-semibold text-indigo-800">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {isCountLoading ? 'Counting leads...' : `${matchCount} leads available to download`}
            </span>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {/* Collection Job Dropdown */}
          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Filter by Collection Job</span>
              </span>
              {selectedJobId && (
                <button
                  type="button"
                  onClick={() => setSelectedJobId('')}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-normal hover:underline"
                >
                  Clear Selection (Show All Collections)
                </button>
              )}
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-indigo-200 bg-white focus:outline-none focus:border-indigo-500 font-medium text-slate-800 shadow-2xs"
            >
              <option value="">-- All Collections / Full Database ({jobsList.length} jobs available) --</option>
              {jobsList.map((job: any) => (
                <option key={job.id} value={job.id}>
                  {job.name} ({job.matchedCount} leads) • {job.status} • {new Date(job.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Business Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              City / Locality
            </label>
            <input
              type="text"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              placeholder="All Cities or type city..."
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Minimum Rating */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Minimum Rating
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Any Rating</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.8">4.8+ Stars</option>
            </select>
          </div>

          {/* Phone Requirement */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Phone Availability
            </label>
            <select
              value={hasPhone}
              onChange={(e) => setHasPhone(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">Phone: Any</option>
              <option value="true">Has Phone Only</option>
              <option value="false">No Phone Only</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {selectedJobObj ? (
              <span>
                Selected Collection: <strong className="text-indigo-700">{selectedJobObj.name}</strong> ({matchCount} leads matched)
              </span>
            ) : selectedCategory ? (
              <span>
                Target: <strong className="text-slate-800">{selectedCategory.replace(/_/g, ' ')}</strong> ({matchCount} records)
              </span>
            ) : (
              <span>
                Target: <strong className="text-slate-800">All Database Records</strong> ({matchCount} records)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={isExporting || matchCount === 0}
              onClick={() => triggerExport('CSV')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs disabled:opacity-50 transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-600" />
              <span>Download CSV ({matchCount})</span>
            </button>
            <button
              disabled={isExporting || matchCount === 0}
              onClick={() => triggerExport('XLSX')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Download Excel XLSX ({matchCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Export Generation History</h2>
          <span className="text-xs text-slate-500 font-medium">
            {exportsList?.length || 0} total generated files
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Category / Job Filter</th>
                <th className="py-3 px-4">Records</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {exportsList && exportsList.length > 0 ? (
                exportsList.map((job: any) => {
                  const filterInfo = job.filterCriteria?.jobId
                    ? `Job: ${job.filterCriteria.jobId.slice(0, 8)}`
                    : job.filterCriteria?.category
                    ? `Category: ${job.filterCriteria.category.replace(/_/g, ' ')}`
                    : 'All Records';

                  return (
                    <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                        {job.fileName || `Export #${job.id.slice(0, 8)}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded">
                          {job.format}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        <span className="bg-indigo-50/70 text-indigo-700 px-2 py-0.5 rounded text-[11px] border border-indigo-100">
                          {filterInfo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {job.recordCount} records
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            job.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : job.status === 'FAILED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {job.status === 'COMPLETED' && job.fileUrl ? (
                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${job.fileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download File</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Processing...</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No export files generated yet. Select a collection or category above and click Download CSV or Excel.
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
