import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { verifyJwtToken } from '@/lib/auth';

const PERMISSIONS_FILE_PATH = path.join(process.cwd(), 'src', 'config', 'permissions_matrix.json');

const DEFAULT_MATRIX: Record<string, Record<string, boolean>> = {
  // 1. Dashboard
  'dashboard.view': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: true, INSPEKTOR: true },
  'dashboard.export': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: true },

  // 2. Usterki
  'faults.view': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: false, INSPEKTOR: true },
  'faults.create': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: false, INSPEKTOR: true },
  'faults.update_status': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: true },
  'faults.assign_mechanic': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
  'faults.delete': { ADMIN: true, ZARZAD: true, KIEROWNIK: false, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
  'faults.print_pdf': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: false, INSPEKTOR: true },

  // 3. Kaizen
  'kaizen.view': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: true, INSPEKTOR: true },
  'kaizen.create': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: true, INSPEKTOR: true },
  'kaizen.score': { ADMIN: true, ZARZAD: true, KIEROWNIK: false, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: true, INSPEKTOR: false },
  'kaizen.manage_payouts': { ADMIN: true, ZARZAD: true, KIEROWNIK: false, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: true, INSPEKTOR: false },
  'kaizen.delete': { ADMIN: true, ZARZAD: true, KIEROWNIK: false, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },

  // 4. Urlopy
  'leaves.view_calendar': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: true, INSPEKTOR: true },
  'leaves.create_request': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: true, INSPEKTOR: true },
  'leaves.view_team_calendar': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: true, INSPEKTOR: true },
  'leaves.approve': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
  'leaves.cancel_approved': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
  'leaves.manage_balances': { ADMIN: true, ZARZAD: true, KIEROWNIK: false, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
  'leaves.export_reports': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },

  // 5. Kody QR
  'qr.view': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: true, INSPEKTOR: true },
  'qr.create': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: true, INSPEKTOR: true },
  'qr.edit_shortcode': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
  'qr.print_3x4': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: true, INSPEKTOR: true },

  // 6. BHP
  'bhp.view': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: true, INSPEKTOR: true },
  'bhp.create_report': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: true, INSPEKTOR: true },
  'bhp.manage_actions': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: true },
  'bhp.manage_trainings': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: true },

  // 7. Jakość
  'quality.view': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: false, INSPEKTOR: true },
  'quality.create': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: false, INSPEKTOR: true },
  'quality.decide': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: true },
  'quality.print_pdf': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: true },

  // 8. Struktura
  'structure.view': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: true, INSPEKTOR: true },
  'structure.create': { ADMIN: true, ZARZAD: true, KIEROWNIK: false, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
  'structure.edit': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
  'structure.delete': { ADMIN: true, ZARZAD: true, KIEROWNIK: false, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },

  // 9. Użytkownicy / Organizacja
  'users.view': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
  'users.create': { ADMIN: true, ZARZAD: true, KIEROWNIK: false, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
  'users.edit': { ADMIN: true, ZARZAD: true, KIEROWNIK: false, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
  'users.reset_password': { ADMIN: true, ZARZAD: true, KIEROWNIK: false, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
  'users.delete': { ADMIN: true, ZARZAD: true, KIEROWNIK: false, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },

  // 10. Audyty
  'audits.view': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: false, INSPEKTOR: true },
  'audits.start': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: true },
  'audits.evaluate': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: true },
  'audits.print_pdf': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: false, INSPEKTOR: true },

  // 11. HelpDesk
  'helpdesk.view': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: true, INSPEKTOR: true },
  'helpdesk.create': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: true, OPERATOR: true, KOMISJA_KAIZEN: true, INSPEKTOR: true },
  'helpdesk.resolve': { ADMIN: true, ZARZAD: true, KIEROWNIK: false, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
};

function readPermissionsMatrix() {
  try {
    if (fs.existsSync(PERMISSIONS_FILE_PATH)) {
      const data = fs.readFileSync(PERMISSIONS_FILE_PATH, 'utf-8');
      return { ...DEFAULT_MATRIX, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error reading permissions file:', err);
  }
  return DEFAULT_MATRIX;
}

function writePermissionsMatrix(matrix: any) {
  const dir = path.dirname(PERMISSIONS_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(PERMISSIONS_FILE_PATH, JSON.stringify(matrix, null, 2), 'utf-8');
}

export async function GET() {
  const matrix = readPermissionsMatrix();
  return NextResponse.json({ success: true, matrix });
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    const isAdminCookie = cookieStore.get('admin_session')?.value === 'true';

    let userRole = 'OPERATOR';
    if (isAdminCookie) {
      userRole = 'ADMIN';
    } else if (sessionToken) {
      const payload = await verifyJwtToken(sessionToken);
      if (payload && payload.role) {
        userRole = String(payload.role).toUpperCase();
      }
    }

    const headerRole = req.headers.get('x-user-role')?.toUpperCase();
    if (headerRole) userRole = headerRole;

    const isAuthorized = ['ADMIN', 'ADMINISTRATOR', 'MASTER ADMIN', 'MASTER_ADMIN', 'SUPERADMIN', 'ZARZAD', 'ZARZĄD', 'BOARD'].includes(userRole);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Tylko Administrator lub Zarząd może zmieniać uprawnienia ról.' }, { status: 403 });
    }

    const body = await req.json();
    const { matrix, resetToDefault } = body;

    if (resetToDefault) {
      writePermissionsMatrix(DEFAULT_MATRIX);
      return NextResponse.json({
        success: true,
        message: 'Przywrócono domyślną fabryczną macierz uprawnień!',
        matrix: DEFAULT_MATRIX,
      });
    }

    if (!matrix || typeof matrix !== 'object') {
      return NextResponse.json({ error: 'Nieprawidłowa struktura danych uprawnień.' }, { status: 400 });
    }

    writePermissionsMatrix(matrix);

    return NextResponse.json({
      success: true,
      message: 'Macierz uprawnień ról została pomyślnie zapisana i wdrożona w systemie!',
      matrix,
    });
  } catch (error: any) {
    console.error('POST /api/permissions error:', error);
    return NextResponse.json({ error: error.message || 'Błąd zapisu uprawnień' }, { status: 500 });
  }
}
