import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { rawDescription } = await request.json();
    return NextResponse.json({ improvedDescription: rawDescription || '' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
