import { NextResponse } from 'next/server';
import { LeaveService } from '@/services/LeaveService';
import { updateLeaveRequestStatusSchema } from '@/schemas/leaveSchema';

const leaveService = new LeaveService();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    // Walidacja schematem Zod
    const validatedData = updateLeaveRequestStatusSchema.parse({
      status: body.status
    });

    let result;

    if (validatedData.status === 'APPROVED') {
      result = await leaveService.approveLeaveRequest(id);
    } else if (validatedData.status === 'REJECTED') {
      result = await leaveService.rejectLeaveRequest(id);
    } else {
      return NextResponse.json(
        { error: 'Nieznany status' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Błąd podczas zmiany statusu wniosku' },
      { status: 400 }
    );
  }
}
