import { NextResponse } from 'next/server';
import { ObservationService } from '@/services/ObservationService';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const service = new ObservationService();
    
    if (body.action === 'extendDueDate') {
      const obs = await service.extendDueDate(
        resolvedParams.id, 
        new Date(body.newDueDate), 
        body.reason, 
        body.requestedBy || 'Operator'
      );
      return NextResponse.json(obs);
    }

    if (body.assignedToId !== undefined) {
      const obs = await service.assignObservation(resolvedParams.id, body.assignedToId || null);
      return NextResponse.json(obs);
    }
    
    return NextResponse.json({ error: 'Nieprawidłowe dane do aktualizacji' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
