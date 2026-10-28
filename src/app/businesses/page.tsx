'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  Search,
  Filter,
  Download,
  Building2,
  ExternalLink,
  Phone,
  Globe,
  Star,
  MapPin,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
} from 'lucide-react';

export default function BusinessesPage() {
  const searchParams = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [minRating, setMinRating] = useState('');
  const [hasPhone, setHasPhone] = useState<string>('');
  const [hasWebsite, setHasWebsite] = useState<string>('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [drawerBusiness, setDrawerBusiness] = useState<any | null>(null);

  // Fetch businesses
  const { data, isLoading } = useQuery({
    queryKey: ['businesses', page, search, city, category, minRating, hasPhone, hasWebsite, initialJobId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (search) params.set('search', search);
      if (city) params.set('city', city);
      if (category) params.set('category', category);
      if (minRating) params.set('minRating', minRating);
      if (hasPhone) params.set('hasPhone', hasPhone);
      if (hasWebsite) params.set('hasWebsite', hasWebsite);
      if (initialJobId) params.set('jobId', initialJobId);

      const res = await apiClient.get(`/api/v1/businesses?${params.toString()}`);
      return res.data;
    },
  });

  const toggleSelectAll = () => {
    if (!data?.items) return;
    if (selectedIds.length === data.items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(data.items.map((i: any) => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleExportSelected = async (format: 'CSV' | 'XLSX') => {
    try {
      await apiClient.post('/api/v1/exports', {
        format,
        businessIds: selectedIds.length > 0 ? selectedIds : undefined,
        jobId: initialJobId || undefined,
      });
      alert(`Export generated successfully! Download ID: ${res.data.id}. View in Export Center.`);
    } catch (e: any) {
      alert(`Export failed: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Business Lead Database</h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, inspect, and export verified business listings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportSelected('CSV')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
          </button>
          <button
            onClick={() => handleExportSelected('XLSX')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export XLSX {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, phone, address..."
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* City Filter */}
          <div>
            <input
              type="text"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setPage(1);
              }}
              placeholder="Filter by City (e.g. Lucknow)"
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Min Rating */}
          <div>
            <select
              value={minRating}
              onChange={(e) => {
                setMinRating(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Any Rating</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.8">4.8+ Stars</option>
            </select>
          </div>

          {/* Phone Availability */}
          <div>
            <select
              value={hasPhone}
              onChange={(e) => {
                setHasPhone(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="">Phone: All</option>
              <option value="true">Has Phone Only</option>
              <option value="false">No Phone Only</option>
            </select>
          </div>
        </div>

        {initialJobId && (
          <div className="flex items-center gap-2 pt-2 text-xs text-indigo-700 bg-indigo-50/50 p-2 rounded-lg">
            <span>Filtering records linked to Collection Job ID: <strong>{initialJobId}</strong></span>
            <Link href="/businesses" className="text-indigo-900 underline font-semibold ml-2">
              Clear Job Filter
            </Link>
          </div>
        )}
      </div>

      {/* TanStack Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={data?.items?.length > 0 && selectedIds.length === data?.items?.length}
                    onChange={toggleSelectAll}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="py-3 px-4">Business Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Website</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Loading verified directory records...
                  </td>
                </tr>
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((b: any) => {
                  const isChecked = selectedIds.includes(b.id);
                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isChecked ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(b.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <button
                          onClick={() => setDrawerBusiness(b)}
                          className="hover:text-indigo-600 text-left"
                        >
                          {b.name}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 capitalize">
                        {b.primaryType ? b.primaryType.replace(/_/g, ' ') : 'Business'}
                      </td>
                      <td className="py-3.5 px-4">{b.city || 'Lucknow'}</td>
                      <td className="py-3.5 px-4">
                        {b.rating ? (
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{b.rating}</span>
                            <span className="text-slate-400 font-normal">
                              ({b.userRatingCount || 0})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No rating</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {b.phone ? (
                          <span className="font-mono text-slate-800">{b.phone}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not available</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {b.website ? (
                          <a
                            href={b.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                          >
                            <span>Visit</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setDrawerBusiness(b)}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No business records matched the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data?.pagination && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page <strong>{data.pagination.page}</strong> of{' '}
              <strong>{data.pagination.totalPages || 1}</strong> ({data.pagination.total} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= (data.pagination.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded border border-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-out Business Detail Drawer */}
      {drawerBusiness && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-50 flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 block">
                  Business Intelligence Profile
                </span>
                <h2 className="text-lg font-bold text-slate-900 truncate mt-0.5">
                  {drawerBusiness.name}
                </h2>
              </div>
              <button
                onClick={() => setDrawerBusiness(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <span className="text-slate-500 block">Google Place ID</span>
                <span className="font-mono text-slate-800 text-[11px] truncate block mt-0.5">
                  {drawerBusiness.placeId}
                </span>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                <span className="text-slate-500 block">Operating Status</span>
                <span className="font-semibold text-emerald-700 block mt-0.5">
                  {drawerBusiness.businessStatus || 'OPERATIONAL'}
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-3 text-xs">
              <span className="font-bold text-slate-900 uppercase tracking-wide block">Contact & Location</span>
              
              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200">
                <MapPin className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span className="text-slate-800">{drawerBusiness.formattedAddress || 'N/A'}</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="font-mono text-slate-800">{drawerBusiness.phone || 'Not available'}</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                {drawerBusiness.website ? (
                  <a
                    href={drawerBusiness.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 underline font-medium truncate"
                  >
                    {drawerBusiness.website}
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Not available</span>
                )}
              </div>

              {drawerBusiness.googleMapsUrl && (
                <a
                  href={drawerBusiness.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100/60 text-indigo-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors mt-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Official Google Maps</span>
                </a>
              )}
            </div>

            {/* Opening Hours */}
            {drawerBusiness.openingHours?.weekdayDescriptions && (
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-900 uppercase tracking-wide block">Opening Hours</span>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1 text-slate-700">
                  {drawerBusiness.openingHours.weekdayDescriptions.map((desc: string, i: number) => (
                    <div key={i}>{desc}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
