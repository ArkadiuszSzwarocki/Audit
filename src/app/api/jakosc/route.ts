import { NextResponse } from 'next/server';
import { QualityReportService } from '@/services/QualityReportService';

const qualityService = new QualityReportService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const category = searchParams.get('category') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const areaId = searchParams.get('areaId') || undefined;
    const machineId = searchParams.get('machineId') || undefined;
    const assignedToId = searchParams.get('assignedToId') || undefined;

    const reports = await qualityService.getAllReports({
      status,
      category,
      severity,
      areaId,
      machineId,
      assignedToId,
    });

    return NextResponse.json(reports);
  } catch (error: any) {
    console.error('Error fetching quality reports:', error);
    return NextResponse.json({ error: error.message || 'Błąd pobierania zgłoszeń jakościowych' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = await qualityService.createReport(body);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('Error creating quality report:', error);
    return NextResponse.json({ error: error.message || 'Błąd dodawania zgłoszenia jakościowego' }, { status: 400 });
  }
}
