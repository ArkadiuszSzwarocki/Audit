import { prisma } from '../config/db';
import { Area } from '@/generated/prisma/client';

export class AreaRepository {
  async findAll(options?: { includeMachines?: boolean }): Promise<any[]> {
    return prisma.area.findMany({
      include: options?.includeMachines ? { machines: { select: { id: true, name: true }, orderBy: { name: 'asc' } } } : undefined,
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: string): Promise<Area | null> {
    return prisma.area.findUnique({
      where: { id }
    });
  }

  async create(data: { name: string; description?: string; shortCode?: string }): Promise<Area> {
    return prisma.area.create({
      data
    });
  }

  async update(id: string, data: { name?: string; description?: string; shortCode?: string | null }): Promise<Area> {
    return prisma.area.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<Area> {
    return prisma.area.delete({
      where: { id }
    });
  }
}
