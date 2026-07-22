import { MachineRepository } from '../repositories/MachineRepository';
import { Machine } from '@/generated/prisma/client';

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

  async createMachine(data: { name: string; description?: string; areaId: string }): Promise<Machine> {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Nazwa maszyny jest wymagana');
    }
    if (!data.areaId) {
      throw new Error('Maszyna musi być przypisana do rejonu');
    }
    return this.repository.create(data);
  }

  async deleteMachine(id: string): Promise<Machine> {
    return this.repository.delete(id);
  }
}
