import { cookies } from 'next/headers';

export async function checkIsAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value === 'true';
}
