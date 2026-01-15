import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

async function DashboardContent() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const { data: pages } = await supabase
    .from('pages')
    .select('*')
    .order('slug', { ascending: true });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white">Admin Dashboard</h1>
        
        <div className="grid gap-4">
          {pages?.map((page) => (
            <Card key={page.id} className="p-6 bg-gray-800 border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">{page.title}</h2>
                  <p className="text-gray-400">/{page.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/${page.slug}`} target="_blank">
                    <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">View</Button>
                  </Link>
                  <Link href={`/admin/${page.slug}`}>
                    <Button className="bg-white text-black hover:bg-gray-200">Edit</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
