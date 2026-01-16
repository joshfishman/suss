'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AdminEditToggle } from '@/components/admin/admin-edit-toggle';

export function SiteHeader() {
  const pathname = usePathname();
  const [projects, setProjects] = useState<{ id: string; slug: string; title: string }[]>([]);

  const links = [
    { href: '/home', label: 'Home' },
    { href: '/about', label: 'About' },
  ];

  useEffect(() => {
    let cancelled = false;
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        const data = await response.json();
        if (!cancelled && response.ok) {
          const items = (data.projects || []).map((project: any) => ({
            id: project.id,
            slug: project.slug,
            title: project.title,
          }));
          setProjects(items);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
      }
    };
    loadProjects();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black">
      <nav className="container mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <Link href="/home" className="text-2xl font-extralight tracking-widest text-white uppercase">
            the Suss
          </Link>
          
          <div className="flex items-center gap-6 md:gap-12">
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
            <div className="relative group">
              <Link
                href="/projects"
                className={cn(
                  'text-sm font-light tracking-wide uppercase transition-opacity hover:opacity-100 text-white',
                  pathname === '/projects'
                    ? 'opacity-100'
                    : 'opacity-60'
                )}
              >
                Projects
              </Link>
              {projects.length > 0 && (
                <div className="absolute left-0 mt-3 min-w-[220px] rounded-md border border-white/10 bg-black/95 shadow-lg opacity-0 pointer-events-none transition group-hover:opacity-100 group-hover:pointer-events-auto">
                  <div className="py-2">
                    {projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/${project.slug}`}
                        className="block px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/5"
                      >
                        {project.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <AdminEditToggle />
          </div>
        </div>
      </nav>
    </header>
  );
}
