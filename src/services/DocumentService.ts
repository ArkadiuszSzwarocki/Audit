import { DocumentRepository } from '../repositories/DocumentRepository';
import { Document } from '@/generated/prisma/client';

export class DocumentService {
  private repository: DocumentRepository;

  constructor() {
    this.repository = new DocumentRepository();
  }

  async getAllDocuments(): Promise<Document[]> {
    return this.repository.findAll();
  }

  async addDocument(data: { title: string; category: string; url: string; areaId?: string; machineId?: string }): Promise<Document> {
    if (!data.title) throw new Error('Tytuł dokumentu jest wymagany');
    if (!data.category) throw new Error('Kategoria dokumentu jest wymagana');
    if (!data.url) throw new Error('Adres URL (plik) jest wymagany');
    
    return this.repository.create(data);
  }
}
