import { prisma } from '../config/db';
import { Observation } from '@/generated/prisma/client';

export class ObservationRepository {
  async findByAuditId(auditId: string): Promise<Observation[]> {
    return prisma.observation.findMany({
      where: { auditId },
      orderBy: { createdAt: 'desc' },
      include: {
        extensions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async findById(id: string) {
    return prisma.observation.findUnique({
      where: { id },
      include: {
        audit: {
          include: { area: true, machine: true }
        },
        assignedTo: {
          select: { id: true, name: true, login: true, email: true }
        },
        extensions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async findPending(): Promise<(Observation & { audit: any; assignedTo?: any; extensions?: any[] })[]> {
    return prisma.observation.findMany({
      where: {
        isFixed: false,
        AND: [
          { NOT: { severity: 'POSITIVE' } },
          { NOT: { severity: { contains: 'Pozytyw' } } },
          { NOT: { severity: { contains: 'Dobra Praktyka' } } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        audit: {
          include: { area: true, machine: true }
        },
        assignedTo: {
          select: { id: true, name: true, login: true }
        },
        extensions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async create(data: { auditId: string; description: string; photoUrl?: string; aiSuggestion?: string; severity?: string; dueDate?: Date }): Promise<Observation> {
    const s = data.severity?.toLowerCase() || '';
    const isPositive = s === 'positive' || s.includes('pozytyw') || s.includes('dobra praktyka');
    return prisma.observation.create({
      data: {
        ...data,
        isFixed: isPositive ? true : false,
        fixedBy: isPositive ? 'Dobra Praktyka' : undefined,
        fixedAt: isPositive ? new Date() : undefined
      },
      include: {
        extensions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async assignUser(id: string, assignedToId: string | null): Promise<Observation> {
    return prisma.observation.update({
      where: { id },
      data: { assignedToId },
      include: {
        extensions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async extendDueDate(id: string, newDueDate: Date, reason: string, requestedBy: string): Promise<Observation> {
    const current = await prisma.observation.findUnique({ where: { id } });
    if (!current) throw new Error('Usterka nie istnieje');

    await prisma.observationExtension.create({
      data: {
        observationId: id,
        previousDueDate: current.dueDate,
        newDueDate,
        reason,
        requestedBy
      }
    });

    return prisma.observation.update({
      where: { id },
      data: { dueDate: newDueDate },
      include: {
        extensions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async updateFixStatus(id: string, data: { isFixed: boolean; fixPhotoUrl?: string; fixedBy?: string; fixedAt?: Date; operatorComment?: string }): Promise<Observation> {
    return prisma.observation.update({
      where: { id },
      data,
      include: {
        extensions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  async delete(id: string): Promise<Observation> {
    return prisma.observation.delete({
      where: { id }
    });
  }
}
