import { NextRequest, NextResponse } from 'next/server';
import { FaultReportService } from '@/services/FaultReportService';

const service = new FaultReportService();

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const report = await service.getById(id);
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    let report;

    if (body.action === 'resolve') {
      report = await service.markResolved(id, body.fixedBy ?? 'Operator', body.fixPhotoUrl, body.operatorComment);
    } else if (body.action === 'assign') {
      report = await service.assignTo(id, body.assignedToId);
    } else if (body.status) {
      report = await service.updateStatus(id, body.status);
    } else {
      return NextResponse.json({ error: 'Nieznana akcja' }, { status: 400 });
    }

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await service.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
