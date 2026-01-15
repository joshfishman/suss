'use client';

interface PageHeroProps {
  title: string;
  description?: string | null;
}

export function PageHero({ title, description }: PageHeroProps) {
  return (
    <section className="py-20 px-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-6">
          {title}
        </h1>
        {description && (
          <p className="text-lg md:text-xl font-light text-muted-foreground leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
