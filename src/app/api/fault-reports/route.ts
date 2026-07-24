import { NextRequest, NextResponse } from 'next/server';
import { FaultReportService } from '@/services/FaultReportService';
import { createFaultReportSchema } from '@/schemas/faultReportSchema';
import { ApiResponse } from '@/utils/apiResponse';

const service = new FaultReportService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? undefined;
    const assignedToId = searchParams.get('assignedToId') ?? undefined;

    const reports = await service.getAll({ status, assignedToId });
    return NextResponse.json(reports);
  } catch (error: any) {
    return ApiResponse.handleApiError(error, 'Nie udało się pobrać usterki');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createFaultReportSchema.parse(body);

    const report = await service.create({
      title: validatedData.title,
      description: validatedData.description,
      severity: body.severity ?? validatedData.priority ?? null,
      reportedBy: validatedData.reportedBy,
      photoUrl: body.photoUrl ?? null,
      notifyEmails: body.notifyEmails ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      areaId: validatedData.areaId || null,
      machineId: validatedData.machineId || null,
      assignedToId: body.assignedToId ?? null,
    });

    return ApiResponse.success(report, 201);
  } catch (error: any) {
    return ApiResponse.handleApiError(error, 'Nie udało się utworzyć zgłoszenia usterki');
  }
}
