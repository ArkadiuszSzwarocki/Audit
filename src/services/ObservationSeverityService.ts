import { ObservationSeverityRepository } from '../repositories/ObservationSeverityRepository';
import { ObservationSeverity } from '@/generated/prisma/client';

export class ObservationSeverityService {
  private repository: ObservationSeverityRepository;

  constructor() {
    this.repository = new ObservationSeverityRepository();
  }

  async getAllSeverities(): Promise<ObservationSeverity[]> {
    return this.repository.seedDefaultsIfEmpty();
  }

  async createSeverity(data: { name: string; color?: string; isPositive?: boolean }): Promise<ObservationSeverity> {
    if (!data.name || !data.name.trim()) {
      throw new Error('Nazwa kategorii/wagi jest wymagana');
    }
    return this.repository.create(data);
  }

  async deleteSeverity(id: string): Promise<ObservationSeverity> {
    return this.repository.delete(id);
  }
}
