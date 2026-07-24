export interface CreateQualityReportDto {
  title: string;
  description: string;
  category: string;
  severity: string;
  reportedBy: string;
  batchNumber?: string | null;
  quantityAffected?: string | null;
  photoUrl?: string | null;
  notifyEmails?: string | null;
  dueDate?: string | null;
  areaId?: string | null;
  machineId?: string | null;
  assignedToId?: string | null;
}

export interface UpdateQualityReportDto {
  title?: string;
  description?: string;
  category?: string;
  severity?: string;
  status?: string;
  batchNumber?: string | null;
  quantityAffected?: string | null;
  photoUrl?: string | null;
  fixPhotoUrl?: string | null;
  fixedBy?: string | null;
  actionTaken?: string | null;
  notifyEmails?: string | null;
  dueDate?: string | null;
  areaId?: string | null;
  machineId?: string | null;
  assignedToId?: string | null;
}

export interface QualityReportFilterOptions {
  status?: string;
  category?: string;
  severity?: string;
  areaId?: string;
  machineId?: string;
  assignedToId?: string;
}

export interface IQualityReportRepository {
  findAll(filter?: QualityReportFilterOptions): Promise<any[]>;
  findById(id: string): Promise<any | null>;
  create(dto: CreateQualityReportDto): Promise<any>;
  update(id: string, dto: UpdateQualityReportDto): Promise<any>;
  delete(id: string): Promise<boolean>;
}
