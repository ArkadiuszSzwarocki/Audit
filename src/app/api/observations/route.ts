import { NextResponse } from 'next/server';
import { ObservationService } from '@/services/ObservationService';
import { createObservationSchema } from '@/schemas/observationSchema';
import { ApiResponse } from '@/utils/apiResponse';

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
      return ApiResponse.error('Brak wymaganych parametrów (auditId lub status)', 400);
    }
    
    return NextResponse.json(observations);
  } catch (error: any) {
    return ApiResponse.handleApiError(error, 'Nie udało się pobrać spostrzeżeń');
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const validatedData = createObservationSchema.parse(data);

    const obs = await observationService.addObservation({
      auditId: validatedData.auditId || data.auditId,
      description: validatedData.description,
      photoUrl: validatedData.photoUrl || data.photoUrl,
      aiSuggestion: data.aiSuggestion,
      severity: data.severity,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined
    });
    return ApiResponse.success(obs, 201);
  } catch (error: any) {
    return ApiResponse.handleApiError(error, 'Nie udało się dodać spostrzeżenia');
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, fixedBy, fixPhotoUrl, operatorComment } = body;
    
    if (!id || !fixedBy) {
      return ApiResponse.error('Brak ID spostrzeżenia lub podpisu operatora', 400);
    }
    
    const fixedObs = await observationService.fixObservation(id, { fixedBy, fixPhotoUrl, operatorComment });
    return ApiResponse.success(fixedObs, 200);
  } catch (error: any) {
    return ApiResponse.handleApiError(error, 'Nie udało się zaktualizować spostrzeżenia');
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return ApiResponse.error('Brak ID spostrzeżenia do usunięcia', 400);
    }
    
    const deletedObs = await observationService.deleteObservation(id);
    return ApiResponse.success(deletedObs, 200);
  } catch (error: any) {
    return ApiResponse.handleApiError(error, 'Nie udało się usunąć spostrzeżenia');
  }
}
