import { NextRequest, NextResponse } from 'next/server';
import { BhpHazardReportService } from '@/services/BhpHazardReportService';

const service = new BhpHazardReportService();

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
      // Calculate risk score
      const riskScore = body.probability && body.injurySeverity 
        ? body.probability * body.injurySeverity 
        : null;
      
      const riskLevel = riskScore
        ? riskScore >= 1 && riskScore <= 6
          ? 'LOW'
          : riskScore >= 8 && riskScore <= 14
          ? 'MEDIUM'
          : 'HIGH'
        : null;

      report = await service.markResolved(
        id,
        body.fixedBy ?? 'Inspektor BHP / Operator',
        body.fixPhotoUrl,
        body.actionTaken,
        body.hazardCategory,
        body.probability,
        body.injurySeverity,
        riskScore,
        riskLevel
      );
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
