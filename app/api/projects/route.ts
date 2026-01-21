import { NextResponse } from 'next/server';
import { getProjects } from '@/lib/projects';

export async function GET() {
  try {
    const projects = await getProjects();
    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load projects' }, { status: 500 });
  }
}
