'use server';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    if (!prisma.serviceSeekerAdmission) {
      console.warn('Prisma client missing model ServiceSeekerAdmission. Did you run `npx prisma generate` after schema changes?');
      return NextResponse.json(null, { status: 200 });
    }
    const admission = await prisma.serviceSeekerAdmission.findUnique({
      where: { serviceSeekerId },
      include: { defaultShiftRun: true },
    });

    return NextResponse.json(admission || null, { status: 200 });
  } catch (error) {
    console.error('GET /service-seekers/[id]/admission error:', error);
    return NextResponse.json({ error: 'Failed to fetch admission' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const {
      advancedCarePlanUrl,
      startDate,
      banding,
      authorityCategory,
      funeralArrangement,
      funeralDirector,
      teamId,
      defaultShiftRunId,
      nhsHscNo,
      chiNumber,
      niNumber,
      personId,
      councilServiceUserId,
      councilCareProviderId,
      serviceType,
      serviceLevel,
      maritalStatus,
      religion,
      ethnicity,
      communicationPreference,
      emergencyRating,
      addressLine1,
      addressLine2,
      addressLine3,
      addressLine4,
      addressLine5,
      postcode,
      addressLatitude,
      addressLongitude,
      region,
      keySafeCode,
      accessDetails,
      telephone,
      mobile,
      email,
      preferredContactMethod,
      height,
      weight,
      bmi,
      medicalHistory,
      medicineAllergies,
      oxygen,
      onCatheter,
      teamInvolvement,
      foodAllergies,
      nilByMouth,
      mainDiet,
      specialDiet,
      dietInstructions,
    } = body;

    // Ensure service seeker exists
    const exists = await prisma.serviceSeeker.findUnique({ where: { id: serviceSeekerId } });
    if (!exists) return NextResponse.json({ error: 'Service user not found' }, { status: 404 });

    if (!prisma.serviceSeekerAdmission) {
      console.warn('Prisma client missing model ServiceSeekerAdmission. Did you run `npx prisma generate` after schema changes?');
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }
    const saved = await prisma.serviceSeekerAdmission.upsert({
      where: { serviceSeekerId },
      update: {
        advancedCarePlanUrl: advancedCarePlanUrl || null,
        startDate: startDate ? new Date(startDate) : null,
        banding: banding || null,
        authorityCategory: authorityCategory || null,
        funeralArrangement: funeralArrangement || null,
        funeralDirector: funeralDirector || null,
        teamId: typeof teamId === 'number' ? teamId : null,
        defaultShiftRunId: typeof defaultShiftRunId === 'number' ? defaultShiftRunId : null,
        nhsHscNo: nhsHscNo || null,
        chiNumber: chiNumber || null,
        niNumber: niNumber || null,
        personId: personId || null,
        councilServiceUserId: councilServiceUserId || null,
        councilCareProviderId: councilCareProviderId || null,
        serviceType: serviceType || null,
        serviceLevel: serviceLevel || null,
        maritalStatus: maritalStatus || null,
        religion: religion || null,
        ethnicity: ethnicity || null,
        communicationPreference: communicationPreference || null,
        emergencyRating: emergencyRating || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        addressLine3: addressLine3 || null,
        addressLine4: addressLine4 || null,
        addressLine5: addressLine5 || null,
        postcode: postcode || null,
        addressLatitude: addressLatitude || null,
        addressLongitude: addressLongitude || null,
        region: region || null,
        keySafeCode: keySafeCode || null,
        accessDetails: accessDetails || null,
        telephone: telephone || null,
        mobile: mobile || null,
        email: email || null,
        preferredContactMethod: preferredContactMethod || null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        bmi: bmi ? parseFloat(bmi) : null,
        medicalHistory: medicalHistory || null,
        medicineAllergies: medicineAllergies || null,
        oxygen: oxygen || null,
        onCatheter: onCatheter || null,
        teamInvolvement: teamInvolvement ? teamInvolvement : null,
        foodAllergies: foodAllergies || null,
        nilByMouth: nilByMouth || null,
        mainDiet: mainDiet || null,
        specialDiet: specialDiet || null,
        dietInstructions: dietInstructions || null,
      },
      create: {
        serviceSeekerId,
        advancedCarePlanUrl: advancedCarePlanUrl || null,
        startDate: startDate ? new Date(startDate) : null,
        banding: banding || null,
        authorityCategory: authorityCategory || null,
        funeralArrangement: funeralArrangement || null,
        funeralDirector: funeralDirector || null,
        teamId: typeof teamId === 'number' ? teamId : null,
        defaultShiftRunId: typeof defaultShiftRunId === 'number' ? defaultShiftRunId : null,
        nhsHscNo: nhsHscNo || null,
        chiNumber: chiNumber || null,
        niNumber: niNumber || null,
        personId: personId || null,
        councilServiceUserId: councilServiceUserId || null,
        councilCareProviderId: councilCareProviderId || null,
        serviceType: serviceType || null,
        serviceLevel: serviceLevel || null,
        maritalStatus: maritalStatus || null,
        religion: religion || null,
        ethnicity: ethnicity || null,
        communicationPreference: communicationPreference || null,
        emergencyRating: emergencyRating || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        addressLine3: addressLine3 || null,
        addressLine4: addressLine4 || null,
        addressLine5: addressLine5 || null,
        postcode: postcode || null,
        addressLatitude: addressLatitude || null,
        addressLongitude: addressLongitude || null,
        region: region || null,
        keySafeCode: keySafeCode || null,
        accessDetails: accessDetails || null,
        telephone: telephone || null,
        mobile: mobile || null,
        email: email || null,
        preferredContactMethod: preferredContactMethod || null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        bmi: bmi ? parseFloat(bmi) : null,
        medicalHistory: medicalHistory || null,
        medicineAllergies: medicineAllergies || null,
        oxygen: oxygen || null,
        onCatheter: onCatheter || null,
        teamInvolvement: teamInvolvement ? teamInvolvement : null,
        foodAllergies: foodAllergies || null,
        nilByMouth: nilByMouth || null,
        mainDiet: mainDiet || null,
        specialDiet: specialDiet || null,
        dietInstructions: dietInstructions || null,
      },
    });

    // touch updatedBy on parent for audit
    await prisma.serviceSeeker.update({ where: { id: serviceSeekerId }, data: { updatedById: decoded.userId } });

    return NextResponse.json(saved, { status: 200 });
  } catch (error) {
    console.error('PUT /service-seekers/[id]/admission error:', error);
    return NextResponse.json({ error: 'Failed to save admission' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const {
      advancedCarePlanUrl,
      startDate,
      banding,
      authorityCategory,
      funeralArrangement,
      funeralDirector,
      teamId,
      defaultShiftRunId,
      nhsHscNo,
      chiNumber,
      niNumber,
      personId,
      councilServiceUserId,
      councilCareProviderId,
      serviceType,
      serviceLevel,
      maritalStatus,
      religion,
      ethnicity,
      communicationPreference,
      emergencyRating,
      addressLine1,
      addressLine2,
      addressLine3,
      addressLine4,
      addressLine5,
      postcode,
      addressLatitude,
      addressLongitude,
      region,
      keySafeCode,
      accessDetails,
      telephone,
      mobile,
      email,
      preferredContactMethod,
      height,
      weight,
      bmi,
      medicalHistory,
      medicineAllergies,
      oxygen,
      onCatheter,
      teamInvolvement,
      foodAllergies,
      nilByMouth,
      mainDiet,
      specialDiet,
      dietInstructions,
    } = body;

    // Ensure service seeker exists
    const exists = await prisma.serviceSeeker.findUnique({ where: { id: serviceSeekerId } });
    if (!exists) return NextResponse.json({ error: 'Service user not found' }, { status: 404 });

    if (!prisma.serviceSeekerAdmission) {
      console.warn('Prisma client missing model ServiceSeekerAdmission. Did you run `npx prisma generate` after schema changes?');
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }
    const created = await prisma.serviceSeekerAdmission.create({
      data: {
        serviceSeekerId,
        advancedCarePlanUrl: advancedCarePlanUrl || null,
        startDate: startDate ? new Date(startDate) : null,
        banding: banding || null,
        authorityCategory: authorityCategory || null,
        funeralArrangement: funeralArrangement || null,
        funeralDirector: funeralDirector || null,
        teamId: typeof teamId === 'number' ? teamId : null,
        defaultShiftRunId: typeof defaultShiftRunId === 'number' ? defaultShiftRunId : null,
        nhsHscNo: nhsHscNo || null,
        chiNumber: chiNumber || null,
        niNumber: niNumber || null,
        personId: personId || null,
        councilServiceUserId: councilServiceUserId || null,
        councilCareProviderId: councilCareProviderId || null,
        serviceType: serviceType || null,
        serviceLevel: serviceLevel || null,
        maritalStatus: maritalStatus || null,
        religion: religion || null,
        ethnicity: ethnicity || null,
        communicationPreference: communicationPreference || null,
        emergencyRating: emergencyRating || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        addressLine3: addressLine3 || null,
        addressLine4: addressLine4 || null,
        addressLine5: addressLine5 || null,
        postcode: postcode || null,
        addressLatitude: addressLatitude || null,
        addressLongitude: addressLongitude || null,
        region: region || null,
        keySafeCode: keySafeCode || null,
        accessDetails: accessDetails || null,
        telephone: telephone || null,
        mobile: mobile || null,
        email: email || null,
        preferredContactMethod: preferredContactMethod || null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        bmi: bmi ? parseFloat(bmi) : null,
        medicalHistory: medicalHistory || null,
        medicineAllergies: medicineAllergies || null,
        oxygen: oxygen || null,
        onCatheter: onCatheter || null,
        teamInvolvement: teamInvolvement ? teamInvolvement : null,
        foodAllergies: foodAllergies || null,
        nilByMouth: nilByMouth || null,
        mainDiet: mainDiet || null,
        specialDiet: specialDiet || null,
        dietInstructions: dietInstructions || null,
      },
    });

    await prisma.serviceSeeker.update({ where: { id: serviceSeekerId }, data: { updatedById: decoded.userId } });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /service-seekers/[id]/admission error:', error);
    return NextResponse.json({ error: 'Failed to create admission' }, { status: 500 });
  }
}

