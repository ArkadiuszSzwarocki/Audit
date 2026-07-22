import { NextResponse } from 'next/server';
import { MachineService } from '@/services/MachineService';

const machineService = new MachineService();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const areaId = searchParams.get('areaId');
    
    let machines;
    if (areaId) {
      machines = await machineService.getMachinesByArea(areaId);
    } else {
      machines = await machineService.getAllMachines();
    }
    
    return NextResponse.json(machines);
  } catch (error) {
    return NextResponse.json({ error: 'Nie udało się pobrać maszyn' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const machine = await machineService.createMachine({
      name: body.name,
      description: body.description,
      areaId: body.areaId,
    });
    return NextResponse.json(machine, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
