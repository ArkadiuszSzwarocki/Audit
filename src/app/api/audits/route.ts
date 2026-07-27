import { NextResponse } from 'next/server';
import { AuditService } from '@/services/AuditService';
import { createAuditSchema } from '@/schemas/auditSchema';
import { ApiResponse } from '@/utils/apiResponse';

const auditService = new AuditService();

export async function GET() {
  try {
    const audits = await auditService.getAllAudits();
    return NextResponse.json(audits);
  } catch (error) {
    return ApiResponse.handleApiError(error, 'Nie udało się pobrać audytów');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createAuditSchema.parse(body);

    const audit = await auditService.createAudit({
      title: validatedData.title,
      areaId: validatedData.areaId,
      machineId: validatedData.machineId || undefined,
      auditTypeId: validatedData.auditTypeId || undefined
    });
    return ApiResponse.success(audit, 201);
  } catch (error: any) {
    return ApiResponse.handleApiError(error, 'Nie udało się utworzyć nowego audytu');
  }
}
