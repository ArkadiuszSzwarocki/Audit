import { MachineRepository } from '../repositories/MachineRepository';
import { Machine } from '@/generated/prisma/client';
import { prisma } from '@/config/db';

export class MachineService {
  private repository: MachineRepository;

  constructor() {
    this.repository = new MachineRepository();
  }

  async getAllMachines(): Promise<Machine[]> {
    return this.repository.findAll();
  }

  async getMachinesByArea(areaId: string): Promise<Machine[]> {
    return this.repository.findByArea(areaId);
  }

  async createMachine(data: { name: string; description?: string; shortCode?: string; areaId: string }): Promise<Machine> {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Nazwa maszyny jest wymagana');
    }
    if (!data.areaId) {
      throw new Error('Maszyna musi być przypisana do rejonu');
    }

    const area = await prisma.area.findUnique({ where: { id: data.areaId } });
    if (area && area.name.toLowerCase().includes('magazyn')) {
      throw new Error('Magazyny nie mogą posiadać przypisanych maszyn');
    }

    return this.repository.create({
      ...data,
      name: data.name.trim(),
      shortCode: data.shortCode ? data.shortCode.trim() : undefined,
    });
  }

  async updateMachine(id: string, data: { name?: string; description?: string; shortCode?: string | null; areaId?: string }): Promise<Machine> {
    if (data.name !== undefined && data.name.trim() === '') {
      throw new Error('Nazwa maszyny nie może być pusta');
    }
    if (data.areaId) {
      const area = await prisma.area.findUnique({ where: { id: data.areaId } });
      if (area && area.name.toLowerCase().includes('magazyn')) {
        throw new Error('Magazyny nie mogą posiadać przypisanych maszyn');
      }
    }
    return this.repository.update(id, {
      ...data,
      name: data.name ? data.name.trim() : undefined,
      shortCode: data.shortCode !== undefined ? (data.shortCode ? data.shortCode.trim() : null) : undefined,
    });
  }

  async deleteMachine(id: string): Promise<Machine> {
    return this.repository.delete(id);
  }
}
