'use server';

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({ error: 'Endpoint disabled' }, { status: 501 });
}

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Endpoint disabled' }, { status: 501 });
}
