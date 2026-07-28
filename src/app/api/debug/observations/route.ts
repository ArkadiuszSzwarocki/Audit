import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET(req: NextRequest) {
  try {
    const count = await prisma.observation.count();
    const observations = await prisma.observation.findMany({ take: 5 });
    
    return NextResponse.json({
      status: 'ok',
      total_count: count,
      sample: observations,
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
    }, { status: 500 });
  }
}
