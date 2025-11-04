import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET() {
  try {
    const list = await prisma.fundingSource.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ success: true, data: list });
  } catch (e) {
    console.error('GET /api/funding-sources error:', e);
    return NextResponse.json({ success: false, error: 'Failed to fetch funding sources' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const created = await prisma.fundingSource.create({
      data: {
        name: body.name?.trim(),
        organisation: body.organisation?.trim() || null,
        contact: body.contact?.trim() || null,
        email: body.email?.trim() || null,
        address: body.address?.trim() || null,
      },
    });
    return NextResponse.json({ success: true, data: created });
  } catch (e) {
    console.error('POST /api/funding-sources error:', e);
    return NextResponse.json({ success: false, error: 'Failed to create funding source' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(id)) return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 });
    await prisma.serviceSeekerFunding.deleteMany({ where: { fundingSourceId: id } });
    await prisma.fundingSource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/funding-sources error:', e);
    return NextResponse.json({ success: false, error: 'Failed to delete funding source' }, { status: 500 });
  }
}


