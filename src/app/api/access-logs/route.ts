import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/config/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userLogin = searchParams.get('userLogin')?.trim();
    const entityType = searchParams.get('entityType')?.trim();
    const entityId = searchParams.get('entityId')?.trim();

    const where: any = {};
    if (userLogin) {
      where.userLogin = { contains: userLogin, mode: 'insensitive' };
    }
    if (entityType) {
      where.entityType = entityType;
    }
    if (entityId) {
      where.entityId = entityId;
    }

    const logs = await prisma.accessLog.findMany({
      where,
      orderBy: { openedAt: 'desc' },
      take: 300,
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      const text = await req.text();
      body = text ? JSON.parse(text) : {};
    } catch {
      body = {};
    }

    const { action, logId, userLogin, userName, entityType, entityId, entityTitle, durationSec, actionCount, actionTypes, engagementLevel } = body;

    // Get IP address from headers
    const forwarded = req.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : '127.0.0.1';

    if (action === 'open') {
      const finalUserLogin = (userLogin || 'admin').trim();
      const finalUserName = (userName || finalUserLogin).trim();
      const finalEntityType = (entityType || 'AUDIT').trim();
      const finalEntityId = (entityId || 'general').trim();

      const log = await prisma.accessLog.create({
        data: {
          userLogin: finalUserLogin,
          userName: finalUserName,
          entityType: finalEntityType,
          entityId: finalEntityId,
          entityTitle: entityTitle || 'Dokument',
          openedAt: new Date(),
          closedAt: new Date(),
          durationSec: 0,
          actionCount: 0,
          actionTypes: '[]',
          engagementLevel: 'SKIMMED',
          ipAddress,
        },
      });

      return NextResponse.json({ logId: log.id });
    }

    if (action === 'update_title' && logId && entityTitle) {
      const updatedLog = await prisma.accessLog.update({
        where: { id: logId },
        data: { entityTitle },
      });
      return NextResponse.json(updatedLog);
    }

    if (action === 'heartbeat' || action === 'close') {
      if (!logId) {
        return NextResponse.json({ error: 'Brak logId' }, { status: 400 });
      }

      const finalActionCount = Math.max(0, Number(actionCount) || 0);
      const finalActionTypes = Array.isArray(actionTypes) ? actionTypes : [];
      const finalEngagementLevel = (engagementLevel || 'SKIMMED').trim();

      const updatedLog = await prisma.accessLog.update({
        where: { id: logId },
        data: {
          closedAt: new Date(),
          durationSec: Math.max(0, Number(durationSec) || 0),
          actionCount: finalActionCount,
          actionTypes: JSON.stringify(finalActionTypes),
          engagementLevel: finalEngagementLevel,
        },
      });

      return NextResponse.json(updatedLog);
    }

    return NextResponse.json({ error: 'Nieprawidłowa akcja' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
