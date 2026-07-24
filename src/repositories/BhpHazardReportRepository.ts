import { prisma } from '../config/db';
import { IBhpHazardReportRepository, BhpHazardReportWithRelations, CreateBhpHazardReportDto } from '@/interfaces/IBhpHazardReportRepository';

const include = {
  area: { select: { id: true, name: true } },
  machine: { select: { id: true, name: true } },
  assignedTo: { select: { id: true, name: true, email: true } },
} as const;

export class BhpHazardReportRepository implements IBhpHazardReportRepository {
  async findAll(options?: { assignedToId?: string; status?: string; category?: string }): Promise<BhpHazardReportWithRelations[]> {
    return prisma.bhpHazardReport.findMany({
      where: {
        ...(options?.assignedToId ? { assignedToId: options.assignedToId } : {}),
        ...(options?.status ? { status: options.status } : {}),
        ...(options?.category ? { category: options.category } : {}),
      },
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<BhpHazardReportWithRelations | null> {
    return prisma.bhpHazardReport.findUnique({ where: { id }, include });
  }

  async create(data: CreateBhpHazardReportDto): Promise<BhpHazardReportWithRelations> {
    return prisma.bhpHazardReport.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category ?? 'NEAR_MISS',
        severity: data.severity ?? 'CRITICAL',
        reportedBy: data.reportedBy,
        photoUrl: data.photoUrl ?? null,
        notifyEmails: data.notifyEmails ?? null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        areaId: data.areaId ?? null,
        machineId: data.machineId ?? null,
        assignedToId: data.assignedToId ?? null,
      },
      include,
    });
  }

  async update(id: string, data: Partial<CreateBhpHazardReportDto & {
    status: string;
    fixedBy: string;
    fixedAt: Date;
    fixPhotoUrl: string;
    actionTaken: string;
  }>): Promise<BhpHazardReportWithRelations> {
    const updateData: any = { ...data };
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    }
    return prisma.bhpHazardReport.update({ where: { id }, data: updateData, include });
  }

  async delete(id: string): Promise<void> {
    await prisma.bhpHazardReport.delete({ where: { id } });
  }

  async countOpen(): Promise<number> {
    return prisma.bhpHazardReport.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    });
  }
}
