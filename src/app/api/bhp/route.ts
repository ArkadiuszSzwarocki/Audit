import { NextRequest, NextResponse } from 'next/server';
import { BhpHazardReportService } from '@/services/BhpHazardReportService';

const service = new BhpHazardReportService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assignedToId = searchParams.get('assignedToId') ?? undefined;
    const status = searchParams.get('status') ?? undefined;
    const category = searchParams.get('category') ?? undefined;

    const reports = await service.getAll({ assignedToId, status, category });
    return NextResponse.json(reports);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const report = await service.create(body);
    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
