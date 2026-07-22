import { prisma } from '../config/db';
import { Audit } from '@/generated/prisma/client';

export class AuditRepository {
  async findAll(): Promise<Audit[]> {
    return prisma.audit.findMany({
      orderBy: { createdAt: 'desc' },
      include: { area: true, machine: true, observations: true, auditType: true }
    });
  }

  async findById(id: string): Promise<Audit | null> {
    return prisma.audit.findUnique({
      where: { id },
      include: { area: true, machine: true, observations: true, auditType: true }
    });
  }

  async create(data: { title: string; areaId: string; machineId?: string; auditTypeId?: string }): Promise<Audit> {
    return prisma.audit.create({
      data,
      include: { area: true, machine: true, auditType: true }
    });
  }
}
