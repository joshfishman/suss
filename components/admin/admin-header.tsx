'use client';

import Link from 'next/link';
import { LogoutButton } from '@/components/logout-button';

interface AdminHeaderProps {
  userEmail?: string;
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  return (
    <header className="bg-black border-b border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xl font-bold text-white">
              Admin Panel
            </Link>
            <Link href="/home" className="text-sm text-gray-400 hover:text-white">
              View Site
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {userEmail && (
              <span className="text-sm text-gray-400">{userEmail}</span>
            )}
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
