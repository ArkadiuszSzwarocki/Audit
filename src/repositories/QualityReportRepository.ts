import { prisma } from '@/config/db';
import {
  IQualityReportRepository,
  CreateQualityReportDto,
  UpdateQualityReportDto,
  QualityReportFilterOptions,
} from '@/interfaces/IQualityReportRepository';

export class QualityReportRepository implements IQualityReportRepository {
  async findAll(filter?: QualityReportFilterOptions): Promise<any[]> {
    const where: any = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.category) where.category = filter.category;
    if (filter?.severity) where.severity = filter.severity;
    if (filter?.areaId) where.areaId = filter.areaId;
    if (filter?.machineId) where.machineId = filter.machineId;
    if (filter?.assignedToId) where.assignedToId = filter.assignedToId;

    return prisma.qualityReport.findMany({
      where,
      include: {
        area: { select: { id: true, name: true } },
        machine: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return prisma.qualityReport.findUnique({
      where: { id },
      include: {
        area: { select: { id: true, name: true } },
        machine: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async create(dto: CreateQualityReportDto): Promise<any> {
    return prisma.qualityReport.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category ?? 'PRODUCT_DEFECT',
        severity: dto.severity ?? 'CRITICAL',
        reportedBy: dto.reportedBy,
        batchNumber: dto.batchNumber || null,
        quantityAffected: dto.quantityAffected || null,
        photoUrl: dto.photoUrl || null,
        notifyEmails: dto.notifyEmails || null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        areaId: dto.areaId || null,
        machineId: dto.machineId || null,
        assignedToId: dto.assignedToId || null,
      },
      include: {
        area: { select: { id: true, name: true } },
        machine: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async update(id: string, dto: UpdateQualityReportDto): Promise<any> {
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.severity !== undefined) data.severity = dto.severity;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.batchNumber !== undefined) data.batchNumber = dto.batchNumber;
    if (dto.quantityAffected !== undefined) data.quantityAffected = dto.quantityAffected;
    if (dto.photoUrl !== undefined) data.photoUrl = dto.photoUrl;
    if (dto.fixPhotoUrl !== undefined) data.fixPhotoUrl = dto.fixPhotoUrl;
    if (dto.fixedBy !== undefined) data.fixedBy = dto.fixedBy;
    if (dto.actionTaken !== undefined) data.actionTaken = dto.actionTaken;
    if (dto.notifyEmails !== undefined) data.notifyEmails = dto.notifyEmails;

    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    if (dto.areaId !== undefined) data.areaId = dto.areaId;
    if (dto.machineId !== undefined) data.machineId = dto.machineId;
    if (dto.assignedToId !== undefined) data.assignedToId = dto.assignedToId;

    if (dto.status === 'RESOLVED' && !data.fixedAt) {
      data.fixedAt = new Date();
    }

    return prisma.qualityReport.update({
      where: { id },
      data,
      include: {
        area: { select: { id: true, name: true } },
        machine: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async delete(id: string): Promise<boolean> {
    await prisma.qualityReport.delete({ where: { id } });
    return true;
  }
}
