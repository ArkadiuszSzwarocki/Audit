import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  cookieStore.delete('session_token');
}

export async function GET(request: NextRequest) {
  await clearAuthCookies();
  return NextResponse.redirect(new URL('/logowanie', request.url));
}

export async function POST() {
  await clearAuthCookies();
  return NextResponse.json({ success: true });
}
