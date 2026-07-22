import { NextResponse } from 'next/server';
import { DocumentService } from '@/services/DocumentService';

const documentService = new DocumentService();

export async function GET() {
  try {
    const documents = await documentService.getAllDocuments();
    return NextResponse.json(documents);
  } catch (error) {
    console.error('API Documents Error:', error);
    return NextResponse.json({ error: 'Nie udało się pobrać dokumentacji' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const doc = await documentService.addDocument({
      title: body.title,
      category: body.category,
      url: body.url,
      areaId: body.areaId || undefined,
      machineId: body.machineId || undefined
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
