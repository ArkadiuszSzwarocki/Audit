import { AreaRepository } from '../repositories/AreaRepository';
import { Area } from '@/generated/prisma/client';

export class AreaService {
  private repository: AreaRepository;

  constructor() {
    this.repository = new AreaRepository();
  }

  async getAllAreas(options?: { includeMachines?: boolean }): Promise<any[]> {
    return this.repository.findAll(options);
  }

  async getArea(id: string): Promise<Area | null> {
    return this.repository.findById(id);
  }

  async createArea(data: { name: string; description?: string }): Promise<Area> {
    if (!data.name || data.name.trim() === '') {
      throw new Error('Nazwa rejonu jest wymagana');
    }
    return this.repository.create(data);
  }

  async deleteArea(id: string): Promise<Area> {
    return this.repository.delete(id);
  }
}
