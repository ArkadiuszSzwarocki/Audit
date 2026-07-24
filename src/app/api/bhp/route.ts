import { NextRequest, NextResponse } from 'next/server';
import { BhpHazardReportService } from '@/services/BhpHazardReportService';
import { createBhpSchema } from '@/schemas/bhpSchema';
import { ApiResponse } from '@/utils/apiResponse';

const service = new BhpHazardReportService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assignedToId = searchParams.get('assignedToId') ?? undefined;
    const status = searchParams.get('status') ?? undefined;
    const category = searchParams.get('category') ?? undefined;

    const reports = await service.getAll({ assignedToId, status, category });
    return NextResponse.json(reports);
  } catch (error: any) {
    return ApiResponse.handleApiError(error, 'Nie udało się pobrać zgłoszeń BHP');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = createBhpSchema.parse(body);
    const report = await service.create({
      ...body,
      title: validatedData.title,
      description: validatedData.description,
      areaId: validatedData.areaId,
      reportedBy: validatedData.reportedBy,
    });
    return ApiResponse.success(report, 201);
  } catch (error: any) {
    return ApiResponse.handleApiError(error, 'Nie udało się zapisać zgłoszenia BHP');
  }
}
