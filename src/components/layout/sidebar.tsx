'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  PlusCircle,
  Activity,
  Building2,
  Filter,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Compass,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'New Collection Job', href: '/wizard', icon: PlusCircle, highlight: true },
  { name: 'Collection Jobs', href: '/jobs', icon: Activity },
  { name: 'Business Database', href: '/businesses', icon: Building2 },
  { name: 'Advanced Filters', href: '/filters', icon: Filter },
  { name: 'Export Center', href: '/exports', icon: FileSpreadsheet },
  { name: 'API Usage & Costs', href: '/usage', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-sm z-30">
      <div>
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-900 tracking-tight text-base block">LeadGen Studio</span>
            <span className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">Maps Intelligence</span>
          </div>
        </div>

        {/* Navigation links */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Core Platform
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50/80 text-indigo-700 shadow-xs border border-indigo-100/60 font-semibold'
                    : item.highlight
                    ? 'text-indigo-600 hover:bg-indigo-50/50 hover:text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-indigo-600' : item.highlight ? 'text-indigo-500' : 'text-slate-400'
                  }`}
                />
                {item.name}
                {item.highlight && (
                  <span className="ml-auto text-[10px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                    NEW
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">Google Places (New)</p>
            <p className="text-[11px] text-emerald-600 font-medium">Compliance Active</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
