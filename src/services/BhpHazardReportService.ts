import { BhpHazardReportRepository } from '@/repositories/BhpHazardReportRepository';
import { BhpHazardReportWithRelations, CreateBhpHazardReportDto } from '@/interfaces/IBhpHazardReportRepository';

export class BhpHazardReportService {
  private readonly repo: BhpHazardReportRepository;

  constructor() {
    this.repo = new BhpHazardReportRepository();
  }

  async getAll(options?: { assignedToId?: string; status?: string; category?: string }): Promise<BhpHazardReportWithRelations[]> {
    return this.repo.findAll(options);
  }

  async getById(id: string): Promise<BhpHazardReportWithRelations> {
    const report = await this.repo.findById(id);
    if (!report) throw new Error(`Zgłoszenie BHP o ID ${id} nie istnieje`);
    return report;
  }

  async create(data: CreateBhpHazardReportDto): Promise<BhpHazardReportWithRelations> {
    if (!data.title?.trim()) throw new Error('Tytuł zagrożenia BHP jest wymagany');
    if (!data.description?.trim()) throw new Error('Opis zagrożenia BHP jest wymagany');
    if (!data.reportedBy?.trim()) throw new Error('Imię i nazwisko zgłaszającego jest wymagane');
    return this.repo.create(data);
  }

  async markResolved(id: string, fixedBy: string, fixPhotoUrl?: string, actionTaken?: string): Promise<BhpHazardReportWithRelations> {
    await this.getById(id);
    return this.repo.update(id, {
      status: 'RESOLVED',
      fixedBy,
      fixedAt: new Date(),
      ...(fixPhotoUrl ? { fixPhotoUrl } : {}),
      ...(actionTaken ? { actionTaken } : {}),
    });
  }

  async updateStatus(id: string, status: string): Promise<BhpHazardReportWithRelations> {
    await this.getById(id);
    return this.repo.update(id, { status });
  }

  async assignTo(id: string, assignedToId: string | null): Promise<BhpHazardReportWithRelations> {
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
