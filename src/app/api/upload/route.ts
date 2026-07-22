import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: 'Nie wybrano pliku' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Aby zachować unikalność, dodaj timestamp
    const uniqueName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const path = join(process.cwd(), 'public/uploads', uniqueName);
    
    await writeFile(path, buffer);
    
    return NextResponse.json({ url: `/uploads/${uniqueName}` });
  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: 'Wystąpił błąd podczas przesyłania pliku' }, { status: 500 });
  }
}
