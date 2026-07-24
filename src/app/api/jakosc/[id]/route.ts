import { NextResponse } from 'next/server';
import { QualityReportService } from '@/services/QualityReportService';

const qualityService = new QualityReportService();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const report = await qualityService.getReportById(id);
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === 'resolve') {
      const updated = await qualityService.resolveReport(
        id,
        body.fixedBy || 'Kontroler Jakości',
        body.actionTaken,
        body.fixPhotoUrl
      );
      return NextResponse.json(updated);
    }

    if (body.action === 'set_due_date') {
      const updated = await qualityService.setDueDate(id, body.dueDate, body.assignedToId);
      return NextResponse.json(updated);
    }

    const updated = await qualityService.updateReport(id, body);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating quality report:', error);
    return NextResponse.json({ error: error.message || 'Błąd aktualizacji zgłoszenia jakościowego' }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await qualityService.deleteReport(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
