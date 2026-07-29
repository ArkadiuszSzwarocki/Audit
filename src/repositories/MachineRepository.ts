import { prisma } from '../config/db';
import { Machine } from '@/generated/prisma/client';

export class MachineRepository {
  async findAll(): Promise<Machine[]> {
    return prisma.machine.findMany({
      orderBy: { name: 'asc' },
      include: { area: true }
    });
  }

  async findByArea(areaId: string): Promise<Machine[]> {
    return prisma.machine.findMany({
      where: { areaId },
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: string): Promise<Machine | null> {
    return prisma.machine.findUnique({
      where: { id },
      include: { area: true }
    });
  }

  async create(data: { name: string; description?: string; shortCode?: string; areaId: string }): Promise<Machine> {
    return prisma.machine.create({
      data
    });
  }

  async update(id: string, data: { name?: string; description?: string; shortCode?: string | null; areaId?: string }): Promise<Machine> {
    return prisma.machine.update({
      where: { id },
      data,
      include: { area: true }
    });
  }

  async delete(id: string): Promise<Machine> {
    return prisma.machine.delete({
      where: { id }
    });
  }
}
