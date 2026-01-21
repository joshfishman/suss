'use client';

import { ReactNode } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageTransition } from '@/components/page-transition';

interface PageShellProps {
  children: ReactNode;
}

export function PageShell({ children }: PageShellProps) {
  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="pt-20 flex-1">
          {children}
        </main>
        <SiteFooter />
      </div>
    </PageTransition>
  );
}
