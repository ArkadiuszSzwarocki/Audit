import fs from 'fs';
import path from 'path';

const PERMISSIONS_FILE_PATH = path.join(process.cwd(), 'src', 'config', 'permissions_matrix.json');

const DEFAULT_MATRIX: Record<string, Record<string, boolean>> = {
  'users.view': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
  'users.create': { ADMIN: true, ZARZAD: true, KIEROWNIK: true, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
  'users.edit': { ADMIN: true, ZARZAD: true, KIEROWNIK: false, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
  'users.delete': { ADMIN: true, ZARZAD: true, KIEROWNIK: false, BRYGADZISTA: false, OPERATOR: false, KOMISJA_KAIZEN: false, INSPEKTOR: false },
};

export function getPermissionsMatrix(): Record<string, Record<string, boolean>> {
  try {
    if (fs.existsSync(PERMISSIONS_FILE_PATH)) {
      const data = fs.readFileSync(PERMISSIONS_FILE_PATH, 'utf-8');
      return { ...DEFAULT_MATRIX, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error('Error reading permissions_matrix.json:', err);
  }
  return DEFAULT_MATRIX;
}

export function checkRolePermission(userRole: string | undefined | null, permissionKey: string): boolean {
  if (!userRole) return false;
  const roleUpper = userRole.toUpperCase().trim();

  // Admin, Master Admin i Zarząd posiadają zawsze pełne uprawnienia nadrzędne
  if (['ADMIN', 'ADMINISTRATOR', 'MASTER ADMIN', 'MASTER_ADMIN', 'SUPERADMIN', 'ZARZAD', 'ZARZĄD', 'BOARD'].includes(roleUpper)) {
    return true;
  }

  let matrixRoleKey = 'OPERATOR';
  if (['KIEROWNIK', 'MANAGER', 'DIRECTOR', 'DYREKTOR'].includes(roleUpper)) {
    matrixRoleKey = 'KIEROWNIK';
  } else if (['BRYGADZISTA', 'LIDER', 'LEADER'].includes(roleUpper)) {
    matrixRoleKey = 'BRYGADZISTA';
  } else if (['KOMISJA KAIZEN', 'KOMISJA_KAIZEN', 'KAIZEN_COMMITTEE'].includes(roleUpper)) {
    matrixRoleKey = 'KOMISJA_KAIZEN';
  } else if (['AUDYTOR', 'AUDITOR', 'INSPEKTOR', 'BHP', 'JAKOSC', 'JAKOŚĆ', 'QUALITY'].includes(roleUpper)) {
    matrixRoleKey = 'INSPEKTOR';
  } else {
    matrixRoleKey = 'OPERATOR';
  }

  const matrix = getPermissionsMatrix();
  const permObj = matrix[permissionKey];
  if (!permObj) return false;

  return !!permObj[matrixRoleKey] || !!permObj[roleUpper];
}
