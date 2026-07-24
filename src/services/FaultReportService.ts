import { FaultReportRepository } from '@/repositories/FaultReportRepository';
import { FaultReportWithRelations, CreateFaultReportDto } from '@/interfaces/IFaultReportRepository';

export class FaultReportService {
  private readonly repo: FaultReportRepository;

  constructor() {
    this.repo = new FaultReportRepository();
  }

  async getAll(options?: { assignedToId?: string; status?: string }): Promise<FaultReportWithRelations[]> {
    return this.repo.findAll(options);
  }

  async getById(id: string): Promise<FaultReportWithRelations> {
    const report = await this.repo.findById(id);
    if (!report) throw new Error(`Zgłoszenie o ID ${id} nie istnieje`);
    return report;
  }

  async create(data: CreateFaultReportDto): Promise<FaultReportWithRelations> {
    if (!data.title?.trim()) throw new Error('Tytuł usterki jest wymagany');
    if (!data.description?.trim()) throw new Error('Opis usterki jest wymagany');
    if (!data.reportedBy?.trim()) throw new Error('Imię i nazwisko zgłaszającego jest wymagane');
    return this.repo.create(data);
  }

  async markResolved(id: string, fixedBy: string, fixPhotoUrl?: string, comment?: string): Promise<FaultReportWithRelations> {
    await this.getById(id);
    return this.repo.update(id, {
      status: 'RESOLVED',
      fixedBy,
      fixedAt: new Date(),
      ...(fixPhotoUrl ? { fixPhotoUrl } : {}),
      ...(comment ? { operatorComment: comment } : {}),
    });
  }

  async updateStatus(id: string, status: string): Promise<FaultReportWithRelations> {
    await this.getById(id);
    return this.repo.update(id, { status });
  }

  async holdAndExtend(id: string, newDueDate: Date, reason: string): Promise<FaultReportWithRelations> {
    const existing = await this.getById(id);
    const formattedDate = newDueDate.toLocaleDateString('pl-PL');
    const extensionNote = `[ZAWIESZONE - PRZEDŁUŻONO TERMIN DO ${formattedDate}]: ${reason}`;
    const updatedComment = existing.operatorComment
      ? `${existing.operatorComment}\n${extensionNote}`
      : extensionNote;

    return this.repo.update(id, {
      status: 'HOLD',
      dueDate: newDueDate,
      operatorComment: updatedComment,
    });
  }

  async assignTo(id: string, assignedToId: string | null): Promise<FaultReportWithRelations> {
    await this.getById(id);
    return this.repo.update(id, { assignedToId: assignedToId ?? undefined });
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    return this.repo.delete(id);
  }

  async countOpen(): Promise<number> {
    return this.repo.countOpen();
  }
}
