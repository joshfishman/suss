import type { ReactNode, Ref } from 'react';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

interface PageTemplateProps {
  readOnly?: boolean;
  hero: ReactNode;
  content: ReactNode;
  contentRef?: Ref<HTMLDivElement>;
}

export function PageTemplate({ readOnly = false, hero, content, contentRef }: PageTemplateProps) {
  return (
    <>
      <SiteHeader />
      <main className={`${readOnly ? 'pt-20' : 'pt-32'} flex-1`}>
        <section className="py-20 px-8">
          <div className="container mx-auto sm:px-8">{hero}</div>
        </section>
        <div className="container mx-auto px-8 pb-24" ref={contentRef}>
          {content}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
