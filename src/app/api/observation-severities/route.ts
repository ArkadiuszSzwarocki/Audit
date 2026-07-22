import { NextResponse } from 'next/server';
import { ObservationSeverityService } from '@/services/ObservationSeverityService';

const severityService = new ObservationSeverityService();

export async function GET() {
  try {
    const severities = await severityService.getAllSeverities();
    return NextResponse.json(severities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Nie udało się pobrać wag/kategorii' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const severity = await severityService.createSeverity({
      name: body.name,
      color: body.color,
      isPositive: body.isPositive
    });
    return NextResponse.json(severity, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Błąd tworzenia kategorii' }, { status: 400 });
  }
}
