import {
  IQualityReportRepository,
  CreateQualityReportDto,
  UpdateQualityReportDto,
  QualityReportFilterOptions,
} from '@/interfaces/IQualityReportRepository';
import { QualityReportRepository } from '@/repositories/QualityReportRepository';

export class QualityReportService {
  private repository: IQualityReportRepository;

  constructor(repository?: IQualityReportRepository) {
    this.repository = repository || new QualityReportRepository();
  }

  async getAllReports(filter?: QualityReportFilterOptions) {
    return this.repository.findAll(filter);
  }

  async getReportById(id: string) {
    const report = await this.repository.findById(id);
    if (!report) {
      throw new Error('Zgłoszenie jakościowe nie zostało znalezione.');
    }
    return report;
  }

  async createReport(dto: CreateQualityReportDto) {
    if (!dto.title || dto.title.trim() === '') {
      throw new Error('Tytuł zgłoszenia jakościowego jest wymagany.');
    }
    if (!dto.description || dto.description.trim() === '') {
      throw new Error('Opis wady lub odchylenia jakościowego jest wymagany.');
    }
    return this.repository.create(dto);
  }

  async updateReport(id: string, dto: UpdateQualityReportDto) {
    await this.getReportById(id);
    return this.repository.update(id, dto);
  }

  async setDueDate(id: string, dueDate: string, assignedToId?: string) {
    await this.getReportById(id);
    return this.repository.update(id, {
      dueDate,
      ...(assignedToId ? { assignedToId } : {}),
    });
  }

  async resolveReport(id: string, fixedBy: string, actionTaken: string, fixPhotoUrl?: string) {
    await this.getReportById(id);
    if (!actionTaken || actionTaken.trim() === '') {
      throw new Error('Opis podjętych działań korygujących i zapobiegawczych CAPA jest wymagany.');
    }

    return this.repository.update(id, {
      status: 'RESOLVED',
      fixedBy,
      actionTaken: actionTaken.trim(),
      fixPhotoUrl: fixPhotoUrl || null,
    });
  }

  async deleteReport(id: string) {
    await this.getReportById(id);
    return this.repository.delete(id);
  }
}
