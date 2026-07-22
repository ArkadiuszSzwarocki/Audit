import { NextResponse } from 'next/server';
import { ObservationService } from '@/services/ObservationService';

const observationService = new ObservationService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const auditId = searchParams.get('auditId');
    const status = searchParams.get('status');
    
    let observations;
    
    if (status === 'pending') {
      observations = await observationService.getPendingObservations();
    } else if (auditId) {
      observations = await observationService.getObservationsForAudit(auditId);
    } else {
      return NextResponse.json({ error: 'Brak wymaganych parametrów' }, { status: 400 });
    }
    
    return NextResponse.json(observations);
  } catch (error: any) {
    console.error('API Error in GET /api/observations:', error);
    return NextResponse.json({ error: error?.message || 'Nie udało się pobrać spostrzeżeń' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const service = new ObservationService();
    const obs = await service.addObservation({
      auditId: data.auditId,
      description: data.description,
      photoUrl: data.photoUrl,
      aiSuggestion: data.aiSuggestion,
      severity: data.severity,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined
    });
    return NextResponse.json(obs, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, fixedBy, fixPhotoUrl, operatorComment } = body;
    
    if (!id || !fixedBy) {
      return NextResponse.json({ error: 'Brak ID spostrzeżenia lub podpisu operatora' }, { status: 400 });
    }
    
    const fixedObs = await observationService.fixObservation(id, { fixedBy, fixPhotoUrl, operatorComment });
    return NextResponse.json(fixedObs, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Brak ID spostrzeżenia' }, { status: 400 });
    }
    
    const deletedObs = await observationService.deleteObservation(id);
    return NextResponse.json(deletedObs, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
