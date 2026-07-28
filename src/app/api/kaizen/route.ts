import { NextResponse } from 'next/server';
import { prisma } from '@/config/db';
import { createKaizenSchema } from '@/schemas/kaizenSchema';
import { ApiResponse } from '@/utils/apiResponse';

export async function GET() {
  try {
    console.log('Fetching Kaizen...');
    const kaizens = await prisma.kaizen.findMany();
    console.log('Kaizens found:', kaizens.length, kaizens);
    return NextResponse.json(kaizens);
  } catch (error) {
    console.error('Error fetching Kaizen:', error);
    return ApiResponse.handleApiError(error, 'Nie udało się pobrać pomysłów Kaizen');
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createKaizenSchema.parse(body);

    const kaizen = await prisma.kaizen.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        benefits: validatedData.expectedBenefit || body.benefits || null,
        submittedBy: validatedData.submittedBy,
        areaId: validatedData.areaId || null,
        machineId: validatedData.machineId || null,
        photoUrl: validatedData.photoUrl || null,
      }
    });
    return ApiResponse.success(kaizen, 201);
  } catch (error) {
    return ApiResponse.handleApiError(error, 'Nie udało się zapisać pomysłu Kaizen');
  }
}
