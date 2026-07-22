import { prisma } from '../config/db';
import { IFaultReportRepository, FaultReportWithRelations, CreateFaultReportDto } from '@/interfaces/IFaultReportRepository';

const include = {
  area: { select: { id: true, name: true } },
  machine: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
} as const;

export class FaultReportRepository implements IFaultReportRepository {
  async findAll(options?: { assignedToId?: string; status?: string }): Promise<FaultReportWithRelations[]> {
    return prisma.faultReport.findMany({
      where: {
        ...(options?.assignedToId ? { assignedToId: options.assignedToId } : {}),
        ...(options?.status ? { status: options.status } : {}),
      },
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<FaultReportWithRelations | null> {
    return prisma.faultReport.findUnique({ where: { id }, include });
  }

  async create(data: CreateFaultReportDto): Promise<FaultReportWithRelations> {
    return prisma.faultReport.create({
      data: {
        title: data.title,
        description: data.description,
        severity: data.severity ?? 'MODERATE',
        reportedBy: data.reportedBy,
        photoUrl: data.photoUrl ?? null,
        notifyEmails: data.notifyEmails ?? null,
        dueDate: data.dueDate ?? null,
        areaId: data.areaId ?? null,
        machineId: data.machineId ?? null,
        assignedToId: data.assignedToId ?? null,
      },
      include,
    });
  }

  async update(id: string, data: Partial<CreateFaultReportDto & {
    status: string;
    fixedBy: string;
    fixedAt: Date;
    fixPhotoUrl: string;
    operatorComment: string;
  }>): Promise<FaultReportWithRelations> {
    return prisma.faultReport.update({ where: { id }, data, include });
  }

  async delete(id: string): Promise<void> {
    await prisma.faultReport.delete({ where: { id } });
  }

  async countOpen(): Promise<number> {
    return prisma.faultReport.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    });
  }
}
