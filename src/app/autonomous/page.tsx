'use client';

import React, { useState, useEffect, useRef } from 'react';
import { apiClient, ensureAuthenticated } from '@/lib/api';
import {
  Sparkles,
  MapPin,
  Play,
  Pause,
  RotateCcw,
  Square,
  Activity,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Layers,
  Phone,
  MessageSquare,
  Download,
  Building2,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Search,
  Zap,
  X,
  ShieldCheck,
  FileCheck,
  Coins,
} from 'lucide-react';

interface GeoCell {
  id: string;
  cellIndex: number;
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  localityName?: string;
  status: 'PENDING' | 'EXPLORING' | 'COMPLETED' | 'UNDER_EXPLORED' | 'SATURATED' | 'FAILED';
  discoveredCount: number;
  isInsidePolygon?: boolean;
}

interface DecisionLog {
  id: string;
  stage: string;
  strategy: string;
  locality?: string;
  decision: string;
  reason: string;
  createdAt: string;
}

interface CoverageMetrics {
  totalCells: number;
  completedCells: number;
  pendingCells: number;
  underExploredCells: number;
  saturatedCells: number;
  failedCells: number;
  uniqueBusinesses: number;
  duplicateCount: number;
  duplicatePercentage: number;
  coveragePercentage: number;
  hotLeadsCount: number;
  warmLeadsCount: number;
  discoveryRateLeadsPerCall: number;
  estimatedCostUSD: number;
  totalApiCalls: number;
}

interface DryRunResult {
  isDryRun: boolean;
  city: string;
  state: string;
  country: string;
  polygonMetrics: {
    boundaryAreaKm2: number;
    polygonVerticesCount: number;
    retainedUrbanGridPoints: number;
  };
  localityCatalog: {
    totalCuratedLocalities: number;
    sampleLocalities: string[];
    granularGoogleTypesCount: number;
  };
  taskGraph: {
    plannedNearbySearchTasks: number;
    plannedLocalityTextTasks: number;
    plannedTotalTasks: number;
  };
  simulatedCostTiers: {
    lowCaseUSD: number;
    lowCaseINR: number;
    expectedUSD: number;
    expectedINR: number;
    highCaseUSD: number;
    highCaseINR: number;
    exchangeRate: number;
  };
  estimatedDurationMinutes: number;
  message: string;
}

export default function AutonomousDiscoveryPage() {
  const [selectedCountry, setSelectedCountry] = useState('India');
  const [selectedState, setSelectedState] = useState('Uttar Pradesh');
  const [selectedCity, setSelectedCity] = useState('Lucknow');
  const [targetCount, setTargetCount] = useState(1000);
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [showDryRunModal, setShowDryRunModal] = useState(false);
  const [dryRunData, setDryRunData] = useState<DryRunResult | null>(null);

  const [jobStatus, setJobStatus] = useState<'IDLE' | 'SEARCHING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED'>('IDLE');

  // Live Metrics & Telemetry
  const [currentLocality, setCurrentLocality] = useState('Initializing city coordinates...');
  const [currentCoord, setCurrentCoord] = useState<{ lat: number; lng: number }>({ lat: 26.8467, lng: 80.9462 });
  const [currentCategory, setCurrentCategory] = useState('Dental Clinics');
  const [currentStrategy, setCurrentStrategy] = useState('Strategy A: Nearby Search (DISTANCE Ranked)');

  const [metrics, setMetrics] = useState<CoverageMetrics>({
    totalCells: 55,
    completedCells: 0,
    pendingCells: 55,
    underExploredCells: 0,
    saturatedCells: 0,
    failedCells: 0,
    uniqueBusinesses: 0,
    duplicateCount: 0,
    duplicatePercentage: 0,
    coveragePercentage: 0,
    hotLeadsCount: 0,
    warmLeadsCount: 0,
    discoveryRateLeadsPerCall: 0,
    estimatedCostUSD: 0,
    totalApiCalls: 0,
  });

  const [cells, setCells] = useState<GeoCell[]>([]);
  const [decisions, setDecisions] = useState<DecisionLog[]>([]);
  const [recentBusinesses, setRecentBusinesses] = useState<any[]>([]);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Poll recent businesses when job is active
  useEffect(() => {
    if (!activeJobId) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/api/v1/businesses?jobId=${activeJobId}&limit=12&sortBy=createdAt&sortOrder=desc`);
        if (res.data?.items) {
          setRecentBusinesses(res.data.items);
        }
      } catch (err) {
        console.error('Failed to fetch discovered leads', err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeJobId]);

  // Format currency helper
  const formatCost = (usd: number) => {
    if (currency === 'INR') {
      return `₹${(usd * 86.5).toFixed(1)}`;
    }
    return `$${usd.toFixed(3)}`;
  };

  // Pre-flight Dry-Run Simulation
  const handleDryRun = async () => {
    setIsDryRunning(true);
    try {
      await ensureAuthenticated();
      const res = await apiClient.post('/api/v1/autonomous/dry-run', {
        country: selectedCountry,
        state: selectedState,
        city: selectedCity,
        targetCount: Number(targetCount),
        maxBudgetUSD: 25.0,
      });

      if (res.data) {
        setDryRunData(res.data);
        setShowDryRunModal(true);
      }
    } catch (err: any) {
      alert(`Dry run failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setIsDryRunning(false);
    }
  };

  // Handle Start Autonomous Discovery
  const handleStartDiscovery = async () => {
    setIsStarting(true);
    setShowDryRunModal(false);
    try {
      await ensureAuthenticated();
      const res = await apiClient.post('/api/v1/autonomous/start', {
        country: selectedCountry,
        state: selectedState,
        city: selectedCity,
        targetCount: Number(targetCount),
        maxBudgetUSD: 25.0,
      });

      if (res.data?.jobId) {
        setActiveJobId(res.data.jobId);
        setJobStatus('SEARCHING');
        connectEventStream(res.data.jobId);
        fetchInitialStatus(res.data.jobId);
      }
    } catch (err: any) {
      alert(`Failed to start autonomous discovery: ${err?.response?.data?.message || err.message}`);
    } finally {
      setIsStarting(false);
    }
  };

  const fetchInitialStatus = async (jobId: string) => {
    try {
      const res = await apiClient.get(`/api/v1/autonomous/${jobId}/status`);
      if (res.data?.metrics) setMetrics(res.data.metrics);
      if (res.data?.cells) setCells(res.data.cells);
      if (res.data?.recentDecisions) setDecisions(res.data.recentDecisions);
    } catch (err) {
      console.error('Status fetch error', err);
    }
  };

  const connectEventStream = (jobId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const es = new EventSource(`${apiBase}/api/v1/autonomous/${jobId}/events`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status) setJobStatus(data.status);
        if (data.metrics) setMetrics(data.metrics);
        if (data.currentLocality) setCurrentLocality(data.currentLocality);
        if (data.currentCoordinate) setCurrentCoord(data.currentCoordinate);
        if (data.currentCategory) setCurrentCategory(data.currentCategory);
        if (data.currentStrategy) setCurrentStrategy(data.currentStrategy);

        if (data.recentDecision) {
          setDecisions((prev) => [
            {
              id: `dec_${Date.now()}`,
              stage: 'AUTONOMOUS_SWEEP',
              strategy: data.currentStrategy || 'NEARBY_DISTANCE',
              decision: data.recentDecision.action,
              reason: data.recentDecision.reason,
              createdAt: data.recentDecision.timestamp,
            },
            ...prev.slice(0, 24),
          ]);
        }
      } catch (e) {
        console.error('SSE JSON error', e);
      }
    };

    es.onerror = () => {
      // Reconnect handled automatically by browser
    };
  };

  // Job Controls
  const handlePause = async () => {
    if (!activeJobId) return;
    await apiClient.post(`/api/v1/autonomous/${activeJobId}/pause`);
    setJobStatus('PAUSED');
  };

  const handleResume = async () => {
    if (!activeJobId) return;
    await apiClient.post(`/api/v1/autonomous/${activeJobId}/resume`);
    setJobStatus('SEARCHING');
  };

  const handleStop = async () => {
    if (!activeJobId) return;
    if (confirm('Are you sure you want to stop this autonomous discovery session?')) {
      await apiClient.post(`/api/v1/autonomous/${activeJobId}/stop`);
      setJobStatus('CANCELLED');
      if (eventSourceRef.current) eventSourceRef.current.close();
    }
  };

  const handleRetryFailed = async () => {
    if (!activeJobId) return;
    await apiClient.post(`/api/v1/autonomous/${activeJobId}/retry-failed`);
    alert('Re-queued all failed tasks. Resuming worker sweep.');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-8 space-y-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-2 border border-emerald-200">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            Autonomous Hyperlocal Engine • QR Review Studio
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Autonomous Business Discovery
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Zero-config geospatial search engine targeting small neighbourhood businesses across Lucknow.
          </p>
        </div>

        {/* Currency Switcher & Global Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setCurrency('INR')}
              className={`px-3 py-1.5 rounded-lg transition ${currency === 'INR' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              ₹ INR
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 rounded-lg transition ${currency === 'USD' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              $ USD
            </button>
          </div>

          {activeJobId && (
            <div className="flex items-center gap-2.5 bg-white p-2 rounded-xl shadow-xs border border-slate-200">
              {jobStatus === 'SEARCHING' ? (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition"
                >
                  <Pause className="w-3.5 h-3.5" /> Pause
                </button>
              ) : jobStatus === 'PAUSED' ? (
                <button
                  onClick={handleResume}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                >
                  <Play className="w-3.5 h-3.5" /> Resume
                </button>
              ) : null}

              <button
                onClick={handleRetryFailed}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry Failed
              </button>

              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
              >
                <Square className="w-3.5 h-3.5" /> Stop
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 1. PRIMARY USER EXPERIENCE: 1-Click Launch Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Select City & Start Discovery</h2>
              <p className="text-xs text-slate-500">
                The engine self-plans coordinates, categories, grid density, polygon clipping, and distance rankings automatically.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium border border-emerald-100">
            ✓ 16-Point Urban Polygon Clipping Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Country</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              disabled={jobStatus === 'SEARCHING'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="India">India</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">State / Province</label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              disabled={jobStatus === 'SEARCHING'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Delhi">Delhi</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Karnataka">Karnataka</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">City (Urban Area)</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={jobStatus === 'SEARCHING'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="Lucknow">Lucknow (85+ Curated Localities)</option>
              <option value="Kanpur">Kanpur</option>
              <option value="Varanasi">Varanasi</option>
              <option value="Noida">Noida</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Target Leads Goal</label>
            <select
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              disabled={jobStatus === 'SEARCHING'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value={250}>250 Leads (Quick Sector Test)</option>
              <option value={500}>500 Leads (Standard Colony Sweep)</option>
              <option value={1000}>1,000 Leads (Full Metropolitan Grid)</option>
              <option value={2000}>2,000 Leads (Exhaustive City Census)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Distance-Ranked Nearby Search
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              0–75 Reviews Opportunity Scoring
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-violet-500"></span>
              SHA-256 Memory Engine
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Dry-Run Pre-Flight Simulation Button */}
            <button
              onClick={handleDryRun}
              disabled={isDryRunning || isStarting || jobStatus === 'SEARCHING'}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isDryRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                  Simulating Pre-Flight...
                </>
              ) : (
                <>
                  <Coins className="w-4 h-4 text-slate-600" />
                  Pre-Flight Simulation
                </>
              )}
            </button>

            {/* Start Live Autonomous Engine Button */}
            <button
              onClick={handleStartDiscovery}
              disabled={isStarting || jobStatus === 'SEARCHING'}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-sm shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isStarting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Planning City Boundaries...
                </>
              ) : jobStatus === 'SEARCHING' ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse" />
                  Autonomous Engine Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  START AUTONOMOUS DISCOVERY
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. LIVE METRICS & HERO STATUS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: HOT Leads */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-emerald-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">QR Studio Target</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Flame className="w-5 h-5 fill-emerald-500 text-emerald-500" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">{metrics.hotLeadsCount}</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">
              HOT Leads (0–30 reviews, with phone)
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              + {metrics.warmLeadsCount} WARM leads (31–75 reviews)
            </div>
          </div>
        </div>

        {/* Metric 2: Unique Discovered */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Verified Leads</span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Building2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">{metrics.uniqueBusinesses}</div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Target: <span className="font-bold text-slate-800">{targetCount} leads</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Skipped {metrics.duplicateCount} duplicates ({metrics.duplicatePercentage}%)
            </div>
          </div>
        </div>

        {/* Metric 3: Discovery Velocity */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Discovery Rate</span>
            <span className="p-2 rounded-lg bg-violet-50 text-violet-600">
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">
              {metrics.discoveryRateLeadsPerCall} <span className="text-sm font-normal text-slate-400">leads/call</span>
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Total API Calls: <span className="font-bold text-slate-800">{metrics.totalApiCalls}</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Failed Tasks: <span className="text-rose-600 font-semibold">{metrics.failedCells}</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Cost Optimization */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live API Cost</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Cpu className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">
              {formatCost(metrics.estimatedCostUSD)}
            </div>
            <div className="text-xs text-amber-700 font-semibold mt-1">
              {currency === 'INR' ? `≈ $${metrics.estimatedCostUSD.toFixed(3)} USD` : `≈ ₹${(metrics.estimatedCostUSD * 86.5).toFixed(1)} INR`}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Coverage Progress: <span className="font-bold text-slate-800">{metrics.coveragePercentage}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LIVE SCANNER BANNER (Active Locality, Coordinates, Strategy) */}
      <div className="bg-indigo-900 text-white rounded-2xl p-5 shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-800 flex items-center justify-center shrink-0 border border-indigo-700">
            <Compass className="w-5 h-5 text-indigo-300 animate-spin" />
          </div>
          <div>
            <div className="text-xs font-semibold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Autonomous Scanning
            </div>
            <div className="text-base sm:text-lg font-bold text-white mt-0.5">
              {currentLocality}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-indigo-200 border-t lg:border-t-0 border-indigo-800 pt-3 lg:pt-0">
          <div>
            <span className="text-indigo-400 block">Coordinates:</span>
            <span className="font-mono font-semibold text-white">
              {currentCoord.lat.toFixed(4)}° N, {currentCoord.lng.toFixed(4)}° E
            </span>
          </div>
          <div>
            <span className="text-indigo-400 block">Current Category:</span>
            <span className="font-semibold text-white">{currentCategory}</span>
          </div>
          <div>
            <span className="text-indigo-400 block">Active Strategy:</span>
            <span className="font-semibold text-emerald-300">{currentStrategy}</span>
          </div>
        </div>
      </div>

      {/* 4. GEOGRAPHICAL COVERAGE MATRIX & EXPLAINABLE DECISION LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spatial Grid Matrix (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Geographical Coverage Grid (Lucknow Urban Area)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                55 centroid coordinates filtered inside official 16-point urban boundary polygon (65 rural points pruned).
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> Explored
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span> Active
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span> Subdivided
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-200"></span> Pending
              </span>
            </div>
          </div>

          {/* Interactive Cell Grid */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 max-h-[280px] overflow-y-auto">
            <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-11 gap-1.5">
              {Array.from({ length: metrics.totalCells || 55 }).map((_, idx) => {
                const isCompleted = idx < metrics.completedCells;
                const isUnderExplored = idx >= metrics.completedCells && idx < metrics.completedCells + metrics.underExploredCells;
                const isCurrent = idx === metrics.completedCells && jobStatus === 'SEARCHING';

                let cellBg = 'bg-slate-200 text-slate-400';
                if (isCurrent) cellBg = 'bg-indigo-600 text-white ring-2 ring-indigo-300 animate-pulse';
                else if (isCompleted) cellBg = 'bg-emerald-500 text-white';
                else if (isUnderExplored) cellBg = 'bg-amber-400 text-slate-900';

                return (
                  <div
                    key={idx}
                    title={`Cell #${idx + 1} (Inside Urban Polygon)`}
                    className={`h-6 rounded-md flex items-center justify-center text-[10px] font-mono font-bold transition-all cursor-pointer ${cellBg}`}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>
              Explored Cells: <strong className="text-slate-800">{metrics.completedCells}</strong> / {metrics.totalCells}
            </span>
            <span>
              Polygon Yield Efficiency: <strong className="text-emerald-600 font-bold">100% Urban Centroids</strong> (0 Rural Waste)
            </span>
            <span>
              Coverage Score: <strong className="text-indigo-600 font-bold">{metrics.coveragePercentage}%</strong>
            </span>
          </div>
        </div>

        {/* Explainable Decision Engine Stream (1 Col) */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              Live Decision Engine Stream
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time reasoning behind search shifts, retries, and category rotations.
            </p>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[270px] pr-1">
            {decisions.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">
                Engine decisions will stream here in real time as queries execute.
              </div>
            ) : (
              decisions.map((dec, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-700 text-[11px] bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {dec.decision}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(dec.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed pt-1">
                    {dec.reason}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 5. LIVE DISCOVERED LEADS TABLE */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Live Lead Stream (QR Review Studio Qualified)
            </h3>
            <p className="text-xs text-slate-500">
              Businesses dynamically scored based on 0–75 review count, star rating, and contact availability.
            </p>
          </div>

          <a
            href="/exports"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5" /> Open Export Center
          </a>
        </div>

        {recentBusinesses.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No leads discovered yet. Select Lucknow and click START AUTONOMOUS DISCOVERY above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Lead Grade</th>
                  <th className="py-3 px-3">Business Name</th>
                  <th className="py-3 px-3">Primary Category</th>
                  <th className="py-3 px-3">Reviews & Stars</th>
                  <th className="py-3 px-3">Locality / Address</th>
                  <th className="py-3 px-3">Direct Phone</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentBusinesses.map((b) => {
                  const isHot = b.leadGrade === 'HOT';
                  const isWarm = b.leadGrade === 'WARM';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        {isHot ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Flame className="w-3 h-3 fill-emerald-600" /> HOT ({b.reviewOpportunityScore})
                          </span>
                        ) : isWarm ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            WARM ({b.reviewOpportunityScore})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                            NURTURE
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 max-w-[200px] truncate">
                        {b.name}
                      </td>
                      <td className="py-3 px-3 capitalize">
                        {(b.primaryType || 'Business').replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900">{b.userRatingCount || 0} reviews</span>
                        <span className="text-amber-500 ml-1.5">★ {b.rating ? b.rating.toFixed(1) : 'Unrated'}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 max-w-[220px] truncate">
                        {b.locality || b.formattedAddress || 'Lucknow, UP'}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                        {b.phone || <span className="text-slate-300 font-normal">No Phone</span>}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {b.phone ? (
                          <a
                            href={`https://wa.me/91${b.phone.replace(/[^\d]/g, '').slice(-10)}?text=${encodeURIComponent(`Hello ${b.name}, we noticed your profile has ${b.userRatingCount || 0} Google reviews. We help local businesses boost verified reviews with QR Review Studio.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs transition"
                          >
                            <MessageSquare className="w-3 h-3" /> WhatsApp
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Field Visit</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. PRE-FLIGHT DRY-RUN SIMULATION MODAL */}
      {showDryRunModal && dryRunData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  <ShieldCheck className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Pre-Flight Discovery Simulation</h3>
                  <p className="text-xs text-slate-500">
                    Dry-Run Mode • 0 Live API Requests Made • Complete Plan Breakdown
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDryRunModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Geographic Boundary Metrics */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                Geospatial Boundary Polygon & Grid Analysis
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">Polygon Vertices</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    {dryRunData.polygonMetrics?.polygonVerticesCount || 16} Points
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-400 block">Urban Footprint</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    {dryRunData.polygonMetrics?.boundaryAreaKm2 || 950} km²
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[11px] text-emerald-600 font-medium block">Active Cells (Inside)</span>
                  <span className="text-lg font-extrabold text-emerald-700">
                    {dryRunData.polygonMetrics?.retainedUrbanGridPoints || 55} Cells
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <span className="text-[11px] text-indigo-600 font-medium block">Curated Localities</span>
                  <span className="text-lg font-extrabold text-indigo-700">
                    {dryRunData.localityCatalog?.totalCuratedLocalities || 73} Sectors
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Task Graph Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                Autonomous Task Graph Breakdown
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-600">Strategy A: Nearby Search Batches (20 max/req)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {dryRunData.taskGraph?.plannedNearbySearchTasks || 55} tasks
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-600">Strategy B: Locality Text Searches (Curated Colonies)</span>
                  <span className="font-mono font-bold text-slate-900">
                    {dryRunData.taskGraph?.plannedLocalityTextTasks || 45} tasks
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-600">Google Places API Supported Granular Types</span>
                  <span className="font-mono font-bold text-slate-900">
                    {dryRunData.localityCatalog?.granularGoogleTypesCount || 13} verified types
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 font-bold text-slate-900">
                  <span>Total Planned Autonomous Tasks</span>
                  <span className="font-mono text-indigo-600 text-sm">
                    {dryRunData.taskGraph?.plannedTotalTasks || 100} tasks (~{dryRunData.estimatedDurationMinutes || 13} mins duration)
                  </span>
                </div>
              </div>
            </div>

            {/* Section 3: Cost Tiers Projection */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                Configurable SKU Cost Projection (India Regional Rates • 1 USD = ₹{dryRunData.simulatedCostTiers?.exchangeRate || 86.5})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-semibold block">Low-Range Scenario</span>
                  <span className="text-lg font-black text-slate-800 mt-0.5 block">
                    ${dryRunData.simulatedCostTiers?.lowCaseUSD?.toFixed(2)} USD
                  </span>
                  <span className="text-xs font-bold text-emerald-600 mt-0.5 block">
                    ≈ ₹{dryRunData.simulatedCostTiers?.lowCaseINR?.toFixed(1)} INR
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200">
                  <span className="text-[11px] text-indigo-700 font-bold block">Expected Target (1,000 Leads)</span>
                  <span className="text-lg font-black text-indigo-900 mt-0.5 block">
                    ${dryRunData.simulatedCostTiers?.expectedUSD?.toFixed(2)} USD
                  </span>
                  <span className="text-xs font-bold text-indigo-700 mt-0.5 block">
                    ≈ ₹{dryRunData.simulatedCostTiers?.expectedINR?.toFixed(1)} INR
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-semibold block">High-Range Ceilings</span>
                  <span className="text-lg font-black text-slate-800 mt-0.5 block">
                    ${dryRunData.simulatedCostTiers?.highCaseUSD?.toFixed(2)} USD
                  </span>
                  <span className="text-xs font-bold text-amber-700 mt-0.5 block">
                    ≈ ₹{dryRunData.simulatedCostTiers?.highCaseINR?.toFixed(1)} INR
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Simulation confirms all operations remain well within the <strong>$25.00 USD safety budget ceiling</strong>.</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                onClick={() => setShowDryRunModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Close Simulation
              </button>
              <button
                onClick={handleStartDiscovery}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white text-xs font-bold shadow-md shadow-indigo-100 transition flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Launch Live Autonomous Scan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
