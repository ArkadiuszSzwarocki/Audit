import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Plik bazy danych nie istnieje' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(dbPath);
    const dateStr = new Date().toISOString().split('T')[0];

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-sqlite3',
        'Content-Disposition': `attachment; filename="audit_database_backup_${dateStr}.db"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
