import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ error: 'Endpoint disabled - Leave model not configured' }, { status: 501 });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'Endpoint disabled - Leave model not configured' }, { status: 501 });
}
