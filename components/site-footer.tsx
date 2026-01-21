'use client';

import Link from 'next/link';

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white py-16 mt-20">
      <div className="container mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="text-2xl font-extralight tracking-widest uppercase">
              the Suss
            </Link>
            <p className="mt-4 text-sm text-gray-400 font-light leading-relaxed">
              Award-winning creative studio specializing in motion design, 
              visual effects, and cinematic storytelling.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider mb-4">Navigation</h3>
            <nav className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
                About
              </Link>
              <Link href="/projects" className="text-sm text-gray-400 hover:text-white transition-colors">
                Projects
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider mb-4">Contact</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p>hello@thesuss.tv</p>
              <p>Los Angeles, CA</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p className="text-xs text-gray-500">
            © {currentYear} the Suss. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
