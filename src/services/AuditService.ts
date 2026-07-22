import { AuditRepository } from '../repositories/AuditRepository';
import { prisma } from '../config/db';
import { Audit } from '@/generated/prisma/client';

export class AuditService {
  private repository: AuditRepository;

  constructor() {
    this.repository = new AuditRepository();
  }

  async getAllAudits(): Promise<Audit[]> {
    return this.repository.findAll();
  }

  async getAudit(id: string): Promise<Audit | null> {
    return this.repository.findById(id);
  }

  async createAudit(data: { title?: string; areaId: string; machineId?: string; auditTypeId?: string }): Promise<Audit> {
    if (!data.areaId) throw new Error('Rejon audytu jest wymagany');
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pl-PL')} ${now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
    
    let typePrefix = '';
    if (data.auditTypeId) {
      const typeObj = await prisma.auditType.findUnique({ where: { id: data.auditTypeId } });
      if (typeObj) {
        typePrefix = `${typeObj.name} `;
      }
    }
    
    const title = data.title && data.title.trim() ? data.title : `Audyt ${typePrefix}z dnia ${formattedDate}`;
    return this.repository.create({ ...data, title });
  }
}
