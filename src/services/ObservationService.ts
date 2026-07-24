import { ObservationRepository } from '../repositories/ObservationRepository';
import { Observation } from '@/generated/prisma/client';

export class ObservationService {
  private repository: ObservationRepository;

  constructor() {
    this.repository = new ObservationRepository();
  }

  async getObservationsForAudit(auditId: string): Promise<Observation[]> {
    return this.repository.findByAuditId(auditId);
  }

  async getObservationById(id: string) {
    return this.repository.findById(id);
  }

  async getPendingObservations(): Promise<Observation[]> {
    return this.repository.findPending();
  }

  async addObservation(data: { auditId: string; description: string; photoUrl?: string; aiSuggestion?: string; severity?: string; dueDate?: Date }): Promise<Observation> {
    if (!data.description) throw new Error('Opis spostrzeżenia jest wymagany');
    return this.repository.create(data);
  }

  async assignObservation(id: string, assignedToId: string | null): Promise<Observation> {
    return this.repository.assignUser(id, assignedToId);
  }

  async extendDueDate(id: string, newDueDate: Date, reason: string, requestedBy: string): Promise<Observation> {
    if (!newDueDate) throw new Error('Nowa data jest wymagana');
    if (!reason || !reason.trim()) throw new Error('Podanie powodu przedłużenia terminu jest obowiązkowe');
    return this.repository.extendDueDate(id, newDueDate, reason, requestedBy);
  }

  async fixObservation(id: string, data: { fixedBy: string; fixPhotoUrl?: string; operatorComment?: string }): Promise<Observation> {
    return this.repository.updateFixStatus(id, {
      isFixed: true,
      fixedBy: data.fixedBy,
      fixPhotoUrl: data.fixPhotoUrl,
      operatorComment: data.operatorComment,
      fixedAt: new Date()
    });
  }

  async deleteObservation(id: string): Promise<Observation> {
    return this.repository.delete(id);
  }
}
