import { NextResponse } from 'next/server';
import { AuditService } from '@/services/AuditService';

const auditService = new AuditService();

export async function GET() {
  try {
    const audits = await auditService.getAllAudits();
    return NextResponse.json(audits);
  } catch (error) {
    return NextResponse.json({ error: 'Nie udało się pobrać audytów' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const audit = await auditService.createAudit({
      title: body.title,
      areaId: body.areaId,
      machineId: body.machineId,
      auditTypeId: body.auditTypeId
    });
    return NextResponse.json(audit, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
