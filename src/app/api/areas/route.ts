import { NextResponse } from 'next/server';
import { AreaService } from '@/services/AreaService';

const areaService = new AreaService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const withMachines = searchParams.get('withMachines') === 'true';
    const areas = await areaService.getAllAreas({ includeMachines: withMachines });
    return NextResponse.json(areas);
  } catch (error) {
    return NextResponse.json({ error: 'Nie udało się pobrać rejonów' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const area = await areaService.createArea({ name: body.name, description: body.description });
    return NextResponse.json(area, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
