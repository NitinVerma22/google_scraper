import './globals.css';
import React from 'react';
import QueryProvider from '@/providers/query-provider';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';

export const metadata = {
  title: 'LeadGen & Maps Intelligence Platform',
  description: 'Enterprise Business Intelligence & Lead Generation powered by Google Maps Platform APIs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased min-h-screen flex">
        <QueryProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </QueryProvider>
      </body>
    </html>
  );
}
