'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const pathname = usePathname();

  const links = [
    { href: '/home', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/projects', label: 'Projects' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black">
      <nav className="container mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <Link href="/home" className="text-2xl font-extralight tracking-widest text-white uppercase">
            the Suss
          </Link>
          
          <div className="flex gap-12">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-light tracking-wide uppercase transition-opacity hover:opacity-100 text-white',
                  pathname === link.href
                    ? 'opacity-100'
                    : 'opacity-60'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}
