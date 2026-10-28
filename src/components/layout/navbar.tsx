'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusCircle, Database, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

export default function Navbar() {
  const [isMockMode, setIsMockMode] = useState(true);
  const [user, setUser] = useState({ name: 'Admin Lead', role: 'ADMIN' });

  useEffect(() => {
    // Check local storage or defaults
    const storedUser = localStorage.getItem('leadgen_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {}
    }
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      <div className="flex items-center gap-4">
        {/* Mode pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Google Places API (New) • Live Production Active</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/wizard"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-xs hover:shadow-indigo-100"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Collection Job</span>
        </Link>

        {/* User profile dropdown pill */}
        <Link
          href="/login"
          className="flex items-center gap-2 pl-3 border-l border-slate-200 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-semibold text-xs flex items-center justify-center">
            {user.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-semibold text-slate-900 block leading-tight">{user.name}</span>
            <span className="text-[10px] font-medium text-emerald-600 block uppercase font-bold">{user.role} • Active</span>
          </div>
        </Link>
      </div>
    </header>
  );
}
