import { prisma } from '../config/db';
import { Document } from '@/generated/prisma/client';

export class DocumentRepository {
  async findAll(): Promise<(Document & { area: any, machine: any })[]> {
    return prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      include: { area: true, machine: true }
    });
  }

  async create(data: { title: string; category: string; url: string; areaId?: string; machineId?: string }): Promise<Document> {
    return prisma.document.create({
      data
    });
  }
}
