import { prisma } from '../config/db';
import { Area } from '@/generated/prisma/client';

export class AreaRepository {
  async findAll(): Promise<Area[]> {
    return prisma.area.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: string): Promise<Area | null> {
    return prisma.area.findUnique({
      where: { id }
    });
  }

  async create(data: { name: string; description?: string }): Promise<Area> {
    return prisma.area.create({
      data
    });
  }

  async delete(id: string): Promise<Area> {
    return prisma.area.delete({
      where: { id }
    });
  }
}
