import { NextRequest, NextResponse } from 'next/server';
import { ObservationSeverityService } from '@/services/ObservationSeverityService';

const severityService = new ObservationSeverityService();

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await severityService.deleteSeverity(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Błąd podczas usuwania' }, { status: 400 });
  }
}
