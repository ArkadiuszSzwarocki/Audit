export interface BhpHazardReportWithRelations {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  reportedBy: string;
  photoUrl: string | null;
  fixPhotoUrl: string | null;
  fixedBy: string | null;
  fixedAt: Date | null;
  actionTaken: string | null;
  notifyEmails: string | null;
  dueDate: Date | null;
  areaId: string | null;
  machineId: string | null;
  assignedToId: string | null;
  // Risk Assessment Fields
  hazardCategory: string | null;
  probability: number | null;
  injurySeverity: number | null;
  riskScore: number | null;
  riskLevel: string | null;
  createdAt: Date;
  updatedAt: Date;
  area?: { id: string; name: string } | null;
  machine?: { id: string; name: string } | null;
  assignedTo?: { id: string; name: string; email: string | null } | null;
}

export interface CreateBhpHazardReportDto {
  title: string;
  description: string;
  category?: string;
  severity?: string;
  reportedBy: string;
  photoUrl?: string | null;
  notifyEmails?: string | null;
  dueDate?: Date | string | null;
  areaId?: string | null;
  machineId?: string | null;
  assignedToId?: string | null;
}

export interface IBhpHazardReportRepository {
  findAll(options?: { assignedToId?: string; status?: string; category?: string }): Promise<BhpHazardReportWithRelations[]>;
  findById(id: string): Promise<BhpHazardReportWithRelations | null>;
  create(data: CreateBhpHazardReportDto): Promise<BhpHazardReportWithRelations>;
  update(id: string, data: Partial<CreateBhpHazardReportDto & {
    status: string;
    fixedBy: string;
    fixedAt: Date;
    fixPhotoUrl: string;
    actionTaken: string;
    hazardCategory: string;
    probability: number;
    injurySeverity: number;
    riskScore: number;
    riskLevel: string;
  }>): Promise<BhpHazardReportWithRelations>;
  delete(id: string): Promise<void>;
  countOpen(): Promise<number>;
}
