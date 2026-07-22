export interface IFaultReportRepository {
  findAll(options?: { assignedToId?: string; status?: string }): Promise<FaultReportWithRelations[]>;
  findById(id: string): Promise<FaultReportWithRelations | null>;
  create(data: CreateFaultReportDto): Promise<FaultReportWithRelations>;
  update(id: string, data: Partial<CreateFaultReportDto & { status: string; fixedBy: string; fixedAt: Date; fixPhotoUrl: string; operatorComment: string }>): Promise<FaultReportWithRelations>;
  delete(id: string): Promise<void>;
  countOpen(): Promise<number>;
}

export interface FaultReportWithRelations {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  reportedBy: string;
  photoUrl: string | null;
  fixPhotoUrl: string | null;
  fixedBy: string | null;
  fixedAt: Date | null;
  operatorComment: string | null;
  notifyEmails: string | null;
  dueDate: Date | null;
  areaId: string | null;
  machineId: string | null;
  assignedToId: string | null;
  createdAt: Date;
  updatedAt: Date;
  area: { id: string; name: string } | null;
  machine: { id: string; name: string } | null;
  assignedTo: { id: string; name: string; email: string | null } | null;
}

export interface CreateFaultReportDto {
  title: string;
  description: string;
  severity?: string;
  reportedBy: string;
  photoUrl?: string | null;
  notifyEmails?: string | null;
  dueDate?: Date | null;
  areaId?: string | null;
  machineId?: string | null;
  assignedToId?: string | null;
}
