import { prisma } from '../config/db';
import { ObservationSeverity } from '@/generated/prisma/client';

export class ObservationSeverityRepository {
  async findAll(): Promise<ObservationSeverity[]> {
    return prisma.observationSeverity.findMany({
      orderBy: { createdAt: 'asc' }
    });
  }

  async findById(id: string): Promise<ObservationSeverity | null> {
    return prisma.observationSeverity.findUnique({
      where: { id }
    });
  }

  async create(data: { name: string; color?: string; isPositive?: boolean }): Promise<ObservationSeverity> {
    return prisma.observationSeverity.create({
      data: {
        name: data.name,
        color: data.color || 'red',
        isPositive: data.isPositive || false
      }
    });
  }

  async update(id: string, data: { name?: string; color?: string; isPositive?: boolean }): Promise<ObservationSeverity> {
    return prisma.observationSeverity.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<ObservationSeverity> {
    return prisma.observationSeverity.delete({
      where: { id }
    });
  }

  async seedDefaultsIfEmpty(): Promise<ObservationSeverity[]> {
    const existing = await this.findAll();
    if (existing.length > 0) return existing;

    const defaults = [
      { name: '🔴 Krytyczna Niezgodność', color: 'red', isPositive: false },
      { name: '🟠 Umiarkowana Niezgodność', color: 'orange', isPositive: false },
      { name: '🟡 Mało istotna zmiana', color: 'yellow', isPositive: false },
      { name: '🟢 Dobra Praktyka (Pozytyw)', color: 'green', isPositive: true },
      { name: '💡 Propozycja Udoskonalenia', color: 'purple', isPositive: true }
    ];

    for (const item of defaults) {
      await this.create(item);
    }

    return this.findAll();
  }
}
