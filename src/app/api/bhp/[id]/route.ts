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
    } else {
      const updateData: any = {};
      if (body.status !== undefined) updateData.status = body.status;
      if (body.actionTaken !== undefined) updateData.actionTaken = body.actionTaken;
      if (body.hazardCategory !== undefined) updateData.hazardCategory = body.hazardCategory;
      if (body.probability !== undefined) updateData.probability = Number(body.probability);
      if (body.injurySeverity !== undefined) updateData.injurySeverity = Number(body.injurySeverity);
      if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId || null;
      if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
      if (body.notifyEmails !== undefined) updateData.notifyEmails = body.notifyEmails;
      if (body.fixPhotoUrl !== undefined) updateData.fixPhotoUrl = body.fixPhotoUrl;

      if (updateData.probability && updateData.injurySeverity) {
        const score = updateData.probability * updateData.injurySeverity;
        updateData.riskScore = score;
        updateData.riskLevel = score <= 6 ? 'LOW' : score <= 14 ? 'MEDIUM' : 'HIGH';
      }

      report = await service.update(id, updateData);
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
