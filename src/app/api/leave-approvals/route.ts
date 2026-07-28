import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/config/db';
// import { LeaveNotificationService } from '@/services/LeaveNotificationService';
// import { LeaveService } from '@/services/LeaveService';

export async function GET(req: NextRequest) {
  return NextResponse.json({ error: 'Endpoint disabled - Leave model not configured' }, { status: 501 });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: 'Endpoint disabled - Leave model not configured' }, { status: 501 });
}
