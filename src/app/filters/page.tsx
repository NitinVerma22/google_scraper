'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Filter, Plus, Trash2, Save, Bookmark, ArrowRight, CheckCircle } from 'lucide-react';

interface Rule {
  id: string;
  field: string;
  operator: string;
  value: string;
}

export default function FiltersPage() {
  const [logic, setLogic] = useState<'AND' | 'OR'>('AND');
  const [rules, setRules] = useState<Rule[]>([
    { id: '1', field: 'Country', operator: 'equals', value: 'India' },
    { id: '2', field: 'City', operator: 'equals', value: 'Lucknow' },
    { id: '3', field: 'Category', operator: 'equals', value: 'Real Estate' },
    { id: '4', field: 'Rating', operator: 'gte', value: '4.0' },
    { id: '5', field: 'Review Count', operator: 'gte', value: '20' },
    { id: '6', field: 'Has Phone', operator: 'equals', value: 'true' },
  ]);

  const [presetName, setPresetName] = useState('High-Rating Leads with Phone');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const { data: savedPresets, refetch: refetchPresets } = useQuery({
    queryKey: ['savedFilters'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/businesses/filters');
      return res.data;
    },
  });

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      { id: Date.now().toString(), field: 'Rating', operator: 'gte', value: '4.0' },
    ]);
  };

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSavePreset = async () => {
    try {
      await apiClient.post('/api/v1/businesses/filters', {
        name: presetName,
        filterConfiguration: { logic, rules },
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      refetchPresets();
    } catch (e: any) {
      alert(`Save failed: ${e.message}`);
    }
  };

  const handleDeletePreset = async (id: string) => {
    try {
      await apiClient.delete(`/api/v1/businesses/filters/${id}`);
      refetchPresets();
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Advanced Business Filters</h1>
        <p className="text-sm text-slate-500 mt-1">
          Build multi-criteria AND / OR rule sets and save query presets
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filter Builder Panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Group Logic:</span>
              <div className="flex rounded-lg border border-slate-300 p-0.5 bg-slate-100">
                <button
                  onClick={() => setLogic('AND')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    logic === 'AND' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  AND (All Match)
                </button>
                <button
                  onClick={() => setLogic('OR')}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                    logic === 'OR' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  OR (Any Match)
                </button>
              </div>
            </div>

            <button
              onClick={() => setRules([])}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Clear All
            </button>
          </div>

          {/* Rules List */}
          <div className="space-y-3">
            {rules.map((rule, idx) => (
              <div
                key={rule.id}
                className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50"
              >
                <span className="w-6 text-[11px] font-bold text-slate-400">
                  {idx === 0 ? 'WHERE' : logic}
                </span>

                <select
                  value={rule.field}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRules((prev) =>
                      prev.map((r) => (r.id === rule.id ? { ...r, field: val } : r)),
                    );
                  }}
                  className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="Country">Country</option>
                  <option value="City">City</option>
                  <option value="Category">Category</option>
                  <option value="Rating">Rating</option>
                  <option value="Review Count">Review Count</option>
                  <option value="Has Phone">Has Phone</option>
                  <option value="Has Website">Has Website</option>
                </select>

                <select
                  value={rule.operator}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRules((prev) =>
                      prev.map((r) => (r.id === rule.id ? { ...r, operator: val } : r)),
                    );
                  }}
                  className="text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="equals">Equals</option>
                  <option value="gte">&gt;= (Greater or equal)</option>
                  <option value="lte">&lt;= (Less or equal)</option>
                  <option value="contains">Contains</option>
                </select>

                <input
                  type="text"
                  value={rule.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRules((prev) =>
                      prev.map((r) => (r.id === rule.id ? { ...r, value: val } : r)),
                    );
                  }}
                  className="flex-1 text-xs bg-white border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none"
                />

                <button
                  onClick={() => removeRule(rule.id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={addRule}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="w-4 h-4" />
              <span>Add Condition</span>
            </button>

            <Link
              href="/businesses"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
            >
              <span>Apply to Database</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Preset Save Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset Name"
              className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-none"
            />
            <button
              onClick={handleSavePreset}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-lg"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savedSuccess ? 'Saved!' : 'Save Preset'}</span>
            </button>
          </div>
        </div>

        {/* Saved Presets Sidebar */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Saved Presets</h2>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {savedPresets && savedPresets.length > 0 ? (
              savedPresets.map((p: any) => (
                <div key={p.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 block">{p.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {p.filterConfiguration?.rules?.length || 0} conditions
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeletePreset(p.id)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                No saved presets yet. Build a filter and click Save Preset.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
