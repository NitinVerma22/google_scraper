'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { FileSpreadsheet, Download, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function ExportsPage() {
  const [isExporting, setIsExporting] = useState(false);

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
        selectedFields: ['name', 'phone', 'website', 'rating', 'userRatingCount', 'city', 'formattedAddress'],
      });
      refetch();
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Export Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate compliant CSV and Excel XLSX lead spreadsheets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={isExporting}
            onClick={() => triggerExport('CSV')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Generate CSV</span>
          </button>
          <button
            disabled={isExporting}
            onClick={() => triggerExport('XLSX')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Generate Excel XLSX</span>
          </button>
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
                <th className="py-3 px-4">Records</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {exportsList && exportsList.length > 0 ? (
                exportsList.map((job: any) => (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900">
                      {job.fileName || `Export #${job.id.slice(0, 8)}`}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded">
                        {job.format}
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
                          href={`http://localhost:4000${job.fileUrl}`}
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
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No export files generated yet. Click Generate CSV or Excel above.
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
