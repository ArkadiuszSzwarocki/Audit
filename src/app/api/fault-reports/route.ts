import { NextRequest, NextResponse } from 'next/server';
import { FaultReportService } from '@/services/FaultReportService';

const service = new FaultReportService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? undefined;
    const assignedToId = searchParams.get('assignedToId') ?? undefined;

    const reports = await service.getAll({ status, assignedToId });
    return NextResponse.json(reports);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const report = await service.create({
      title: body.title,
      description: body.description,
      severity: body.severity,
      reportedBy: body.reportedBy ?? 'Anonimowy',
      photoUrl: body.photoUrl ?? null,
      notifyEmails: body.notifyEmails ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      areaId: body.areaId ?? null,
      machineId: body.machineId ?? null,
      assignedToId: body.assignedToId ?? null,
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
