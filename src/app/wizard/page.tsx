'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, ensureAuthenticated } from '@/lib/api';
import {
  MapPin,
  Tag,
  Sliders,
  CheckSquare,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

const CATEGORY_PRESETS = [
  'Restaurants',
  'Hotels & Lodging',
  'Hospitals & Medical Centers',
  'Clinics',
  'Dental Clinics',
  'Pharmacies',
  'Real Estate Agencies',
  'Property Dealers',
  'Builders & Developers',
  'Schools & Colleges',
  'Coaching Institutes',
  'Gyms & Fitness Centers',
  'Beauty Salons & Spas',
  'Automobile Dealers',
  'Auto Repair & Service',
  'Travel & Tour Agencies',
  'Legal & Financial Services',
  'Retail Stores',
  'Manufacturers',
  'Wholesalers',
];

const AVAILABLE_FIELDS = [
  { id: 'name', label: 'Business Name', isBasic: true, desc: 'Official trade name' },
  { id: 'formattedAddress', label: 'Complete Address', isBasic: true, desc: 'Street, city, postal code' },
  { id: 'latitude', label: 'Geo Coordinates', isBasic: true, desc: 'Latitude & Longitude' },
  { id: 'primaryType', label: 'Primary Category', isBasic: true, desc: 'Google Places primary type' },
  { id: 'googleMapsUrl', label: 'Google Maps URL', isBasic: true, desc: 'Direct place link' },
  { id: 'phone', label: 'Phone Number', isBasic: false, desc: 'Local contact number (Place Details API)' },
  { id: 'website', label: 'Website URL', isBasic: false, desc: 'Official company website' },
  { id: 'rating', label: 'Customer Rating', isBasic: false, desc: 'Average star rating (1.0 to 5.0)' },
  { id: 'userRatingCount', label: 'Review Count', isBasic: false, desc: 'Total number of reviews' },
  { id: 'openingHours', label: 'Opening Hours', isBasic: false, desc: 'Weekly schedule & current open status' },
  { id: 'businessStatus', label: 'Operating Status', isBasic: false, desc: 'Operational, Temporarily Closed' },
];

export default function CollectionWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form states
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedState, setSelectedState] = useState('Uttar Pradesh');
  const [selectedCity, setSelectedCity] = useState('Lucknow');
  const [locality, setLocality] = useState('Gomti Nagar');
  const [radiusKm, setRadiusKm] = useState(15);

  const [selectedCategory, setSelectedCategory] = useState('Real Estate Agencies');
  const [customKeywords, setCustomKeywords] = useState('property dealers, apartments');

  const [jobName, setJobName] = useState('Lucknow Real Estate Lead Scan');
  const [targetCount, setTargetCount] = useState(50);
  const [minRating, setMinRating] = useState('4.0');
  const [minReviews, setMinReviews] = useState('10');
  const [requirePhone, setRequirePhone] = useState(true);
  const [requireWebsite, setRequireWebsite] = useState(false);

  const [selectedFields, setSelectedFields] = useState<string[]>([
    'name',
    'formattedAddress',
    'phone',
    'website',
    'rating',
    'userRatingCount',
    'googleMapsUrl',
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch geography lists
  useEffect(() => {
    apiClient.get('/api/v1/locations/countries').then((res) => {
      setCountries(res.data);
    });
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      apiClient.get(`/api/v1/locations/states?country=${selectedCountry}`).then((res) => {
        setStates(res.data);
        if (res.data.length > 0 && !res.data.includes(selectedState)) {
          setSelectedState(res.data[0]);
        }
      });
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry && selectedState) {
      apiClient
        .get(`/api/v1/locations/cities?country=${selectedCountry}&state=${selectedState}`)
        .then((res) => {
          setCities(res.data);
          if (res.data.length > 0 && !res.data.includes(selectedCity)) {
            setSelectedCity(res.data[0]);
          }
        });
    }
  }, [selectedCountry, selectedState]);

  // Cost calculation
  const searchRequests = Math.ceil(targetCount / 20);
  const hasDetailsFields = selectedFields.some((f) => ['phone', 'website', 'openingHours'].includes(f));
  const estimatedCost = (searchRequests * 0.035 + (hasDetailsFields ? targetCount * 0.017 : 0)).toFixed(3);

  const toggleField = (fieldId: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldId) ? prev.filter((id) => id !== fieldId) : [...prev, fieldId],
    );
  };

  const handleLaunchJob = async () => {
    setIsSubmitting(true);
    try {
      await ensureAuthenticated();
      const payload = {
        name: jobName,
        locationConfig: {
          country: selectedCountry,
          state: selectedState,
          city: selectedCity,
          locality: locality,
          radiusKm,
        },
        categoryConfig: {
          primaryCategory: selectedCategory.toLowerCase().replace(/[^a-z0-9]/g, '_'),
          categories: [selectedCategory],
          customKeywords: customKeywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
        },
        filterConfig: {
          minRating: minRating ? parseFloat(minRating) : undefined,
          minReviews: minReviews ? parseInt(minReviews, 10) : undefined,
          requirePhone,
          requireWebsite,
        },
        targetCount,
        selectedFields,
      };

      const res = await apiClient.post('/api/v1/jobs', payload);
      router.push(`/jobs?highlight=${res.data.id}`);
    } catch (err: any) {
      alert(`Job launch failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Wizard Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Collection Job Wizard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure an automated Google Places API collection workflow in 5 simple steps
        </p>
      </div>

      {/* Steps Indicator */}
      <div className="grid grid-cols-5 gap-2 border-b border-slate-200 pb-4">
        {[
          { num: 1, label: 'Location' },
          { num: 2, label: 'Category' },
          { num: 3, label: 'Settings' },
          { num: 4, label: 'Fields' },
          { num: 5, label: 'Review' },
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`flex items-center gap-2 pb-2 text-xs font-semibold text-left border-b-2 transition-all ${
              step === s.num
                ? 'border-indigo-600 text-indigo-700'
                : step > s.num
                ? 'border-emerald-500 text-emerald-700'
                : 'border-transparent text-slate-400'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === s.num
                  ? 'bg-indigo-600 text-white'
                  : step > s.num
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        {/* STEP 1: Location */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Step 1: Geographic Target Selection</h2>
                <p className="text-xs text-slate-500">
                  Select your cascading target region or define a custom search center
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Country</label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  {countries.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">State / Province</label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  {states.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Locality / Neighborhood (Optional)
                </label>
                <input
                  type="text"
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Gomti Nagar, Hazratganj, Downtown"
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Search Radius ({radiusKm} km)
                </label>
                <input
                  type="range"
                  min="2"
                  max="50"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 mt-2"
                />
              </div>
            </div>

            <div className="bg-indigo-50/60 rounded-lg p-3.5 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-900">
              <Info className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
              <span>
                Coordinates will be geocoded automatically for <strong>{locality ? `${locality}, ` : ''}{selectedCity}, {selectedState}, {selectedCountry}</strong>.
              </span>
            </div>
          </div>
        )}

        {/* STEP 2: Category */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Tag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Step 2: Business Category & Search Keywords</h2>
                <p className="text-xs text-slate-500">
                  Select a standard Google Places category or specify custom query variations
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">Preset Categories</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                {CATEGORY_PRESETS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setJobName(`${selectedCity} ${cat} Scan`);
                    }}
                    className={`text-left p-2.5 rounded-lg text-xs font-medium border transition-all ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Custom Search Keywords (Comma separated variations)
              </label>
              <input
                type="text"
                value={customKeywords}
                onChange={(e) => setCustomKeywords(e.target.value)}
                placeholder="e.g. property consultants, real estate brokers, apartment sales"
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Collection Settings */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Step 3: Lead Filters & Target Limits</h2>
                <p className="text-xs text-slate-500">
                  Configure qualification criteria and maximum target count
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Collection Job Name</label>
                <input
                  type="text"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Unique Listings (Max 200)
                </label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={targetCount}
                  onChange={(e) => setTargetCount(parseInt(e.target.value, 10))}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Minimum Star Rating</label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Any Rating</option>
                  <option value="3.5">3.5+ Stars</option>
                  <option value="4.0">4.0+ Stars</option>
                  <option value="4.5">4.5+ Stars</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Minimum Review Count</label>
                <select
                  value={minReviews}
                  onChange={(e) => setMinReviews(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="0">0+ (Any)</option>
                  <option value="5">5+ Reviews</option>
                  <option value="10">10+ Reviews</option>
                  <option value="50">50+ Reviews</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={requirePhone}
                  onChange={(e) => setRequirePhone(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Must have valid Phone Number</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={requireWebsite}
                  onChange={(e) => setRequireWebsite(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Must have active Website</span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 4: Field Selection */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Step 4: Select Data Fields & API Optimization</h2>
                <p className="text-xs text-slate-500">
                  Select fields to retrieve via X-Goog-FieldMask. Only request fields your team requires to minimize API billing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVAILABLE_FIELDS.map((field) => {
                const isSelected = selectedFields.includes(field.id);
                return (
                  <div
                    key={field.id}
                    onClick={() => toggleField(field.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{field.label}</span>
                        {field.isBasic ? (
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                            Basic
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold bg-violet-100 text-violet-700 px-1.5 py-0.2 rounded">
                            Details Pro
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{field.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: Review & Cost */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Step 5: Review Configuration & Cost Estimation</h2>
                <p className="text-xs text-slate-500">
                  Verify search parameters and pricing estimate before dispatching to worker queue
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
                <span className="font-semibold text-slate-900 block text-sm">Operation Parameters</span>
                <div>
                  <span className="text-slate-500">Job:</span> <span className="font-medium text-slate-800">{jobName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Target Area:</span>{' '}
                  <span className="font-medium text-slate-800">
                    {locality ? `${locality}, ` : ''}{selectedCity}, {selectedState}, {selectedCountry}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Category:</span>{' '}
                  <span className="font-medium text-slate-800">{selectedCategory}</span>
                </div>
                <div>
                  <span className="text-slate-500">Target Count:</span>{' '}
                  <span className="font-medium text-slate-800">{targetCount} leads</span>
                </div>
                <div>
                  <span className="text-slate-500">Filter Criteria:</span>{' '}
                  <span className="font-medium text-slate-800">
                    Rating ≥ {minRating || 'Any'}, Reviews ≥ {minReviews}, Phone required
                  </span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl p-4 border border-indigo-100 text-xs space-y-2.5">
                <span className="font-semibold text-indigo-950 block text-sm">Estimated Google API Quota</span>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Places Text Search (New):</span>
                  <span className="font-bold text-slate-900">{searchRequests} calls (~${(searchRequests * 0.035).toFixed(3)})</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>Place Details Enriched Calls:</span>
                  <span className="font-bold text-slate-900">
                    {hasDetailsFields ? `${targetCount} calls` : '0 calls'}
                  </span>
                </div>
                <div className="pt-2 border-t border-indigo-200/60 flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-900">Estimated Total Cost:</span>
                  <span className="font-extrabold text-indigo-700 text-base">${estimatedCost} USD</span>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  *In Mock Mode, charges are simulated and no real billing occurs.
                </div>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold">Compliance & API Limitation Notice</p>
                <p className="mt-0.5 text-amber-800">
                  Google Places API results represent publicly available business locations according to Google Maps Platform terms of service. Target counts are objectives subject to regional coverage.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Navigation Footer */}
        <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
          ) : (
            <div></div>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleLaunchJob}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-semibold shadow-md shadow-indigo-100 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Launching Queue...' : 'Confirm & Launch Collection'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
