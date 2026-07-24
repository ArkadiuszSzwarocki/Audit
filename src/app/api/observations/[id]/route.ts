import { NextRequest, NextResponse } from 'next/server';
import { ObservationService } from '@/services/ObservationService';

export async function GET(request: NextRequest, { params }: { params: Promise<any> }) {
  try {
    const resolvedParams = await params;
    const service = new ObservationService();
    const obs = await service.getObservationById(resolvedParams.id);
    if (!obs) {
      return NextResponse.json({ error: 'Nie znaleziono zadania produkcyjnego' }, { status: 404 });
    }
    return NextResponse.json(obs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<any> }) {
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

    if (body.action === 'fix') {
      const obs = await service.fixObservation(resolvedParams.id, {
        fixedBy: body.fixedBy || 'Operator',
        fixPhotoUrl: body.fixPhotoUrl,
        operatorComment: body.operatorComment,
      });
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

export async function DELETE(request: NextRequest, { params }: { params: Promise<any> }) {
  try {
    const resolvedParams = await params;
    const service = new ObservationService();
    await service.deleteObservation(resolvedParams.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
