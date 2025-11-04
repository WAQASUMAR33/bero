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

    if (!prisma.serviceSeekerMcaAssessment) {
      console.warn('Prisma client missing model ServiceSeekerMcaAssessment. Did you run `npx prisma generate` after schema changes?');
      return NextResponse.json([], { status: 200 });
    }
    const assessments = await prisma.serviceSeekerMcaAssessment.findMany({
      where: { serviceSeekerId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(assessments || [], { status: 200 });
  } catch (error) {
    console.error('GET /service-seekers/[id]/mca-assessments error:', error);
    return NextResponse.json({ error: 'Failed to fetch MCA assessments' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const {
      risk,
      lastAssessed,
      triggeredBy,
      hasImpairment,
      clinicalDiagnosis,
      decisionToMake,
      isImpairment,
      fluctuatingCapacity,
      fluctuatingCapacityReason,
      generalUnderstanding,
      generalUnderstandingDetails,
      canRetainInformation,
      canRetainInformationDetails,
      canUseWeighInformation,
      canUseWeighInformationDetails,
      canCommunicate,
      healthWelfareLpa,
      advancedDecision,
      deputyAppointed,
      imcaRequired,
      imcaName,
      imcaTelephone,
      option1,
      option2,
      option3,
      pastPresentWishes,
      pastPresentWishesDetails,
      consultedInterestedParties,
      consultedInterestedPartiesDetails,
      consultedProfessionals,
      consultedProfessionalsDetails,
      bestInterestDecision,
      decisionMade,
      leastRestrictivePrinciple,
      disagreement,
      disagreementDetails,
      everyOptionExplored,
      patientRecordsUpdated,
      useOfRestraint,
      misinformation,
      anyoneObjected,
      restraintForTreatment,
      relativesRequestedDischarge,
      restrictedAccessToFamily,
      leastRestrictiveOptions,
      restrictedAccessToCommunity,
      continuousSupervision,
      riskLevel,
      totalScore,
      staffTeam,
      office,
      sendSignoffs,
      conductedBy,
    } = body;

    const exists = await prisma.serviceSeeker.findUnique({ where: { id: serviceSeekerId } });
    if (!exists) return NextResponse.json({ error: 'Service user not found' }, { status: 404 });

    if (!prisma.serviceSeekerMcaAssessment) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const created = await prisma.serviceSeekerMcaAssessment.create({
      data: {
        serviceSeekerId,
        risk: risk?.trim() || null,
        lastAssessed: lastAssessed ? new Date(lastAssessed) : null,
        triggeredBy: triggeredBy?.trim() || null,
        hasImpairment: hasImpairment?.trim() || null,
        clinicalDiagnosis: clinicalDiagnosis?.trim() || null,
        decisionToMake: decisionToMake?.trim() || null,
        isImpairment: isImpairment?.trim() || null,
        fluctuatingCapacity: fluctuatingCapacity?.trim() || null,
        fluctuatingCapacityReason: fluctuatingCapacityReason?.trim() || null,
        generalUnderstanding: generalUnderstanding?.trim() || null,
        generalUnderstandingDetails: generalUnderstandingDetails?.trim() || null,
        canRetainInformation: canRetainInformation?.trim() || null,
        canRetainInformationDetails: canRetainInformationDetails?.trim() || null,
        canUseWeighInformation: canUseWeighInformation?.trim() || null,
        canUseWeighInformationDetails: canUseWeighInformationDetails?.trim() || null,
        canCommunicate: canCommunicate?.trim() || null,
        healthWelfareLpa: healthWelfareLpa?.trim() || null,
        advancedDecision: advancedDecision?.trim() || null,
        deputyAppointed: deputyAppointed?.trim() || null,
        imcaRequired: imcaRequired?.trim() || null,
        imcaName: imcaName?.trim() || null,
        imcaTelephone: imcaTelephone?.trim() || null,
        option1: option1?.trim() || null,
        option2: option2?.trim() || null,
        option3: option3?.trim() || null,
        pastPresentWishes: pastPresentWishes?.trim() || null,
        pastPresentWishesDetails: pastPresentWishesDetails?.trim() || null,
        consultedInterestedParties: consultedInterestedParties?.trim() || null,
        consultedInterestedPartiesDetails: consultedInterestedPartiesDetails?.trim() || null,
        consultedProfessionals: consultedProfessionals?.trim() || null,
        consultedProfessionalsDetails: consultedProfessionalsDetails?.trim() || null,
        bestInterestDecision: bestInterestDecision?.trim() || null,
        decisionMade: decisionMade?.trim() || null,
        leastRestrictivePrinciple: leastRestrictivePrinciple?.trim() || null,
        disagreement: disagreement?.trim() || null,
        disagreementDetails: disagreementDetails?.trim() || null,
        everyOptionExplored: everyOptionExplored?.trim() || null,
        patientRecordsUpdated: patientRecordsUpdated?.trim() || null,
        useOfRestraint: useOfRestraint?.trim() || null,
        misinformation: misinformation?.trim() || null,
        anyoneObjected: anyoneObjected?.trim() || null,
        restraintForTreatment: restraintForTreatment?.trim() || null,
        relativesRequestedDischarge: relativesRequestedDischarge?.trim() || null,
        restrictedAccessToFamily: restrictedAccessToFamily?.trim() || null,
        leastRestrictiveOptions: leastRestrictiveOptions?.trim() || null,
        restrictedAccessToCommunity: restrictedAccessToCommunity?.trim() || null,
        continuousSupervision: continuousSupervision?.trim() || null,
        riskLevel: riskLevel?.trim() || null,
        totalScore: totalScore?.trim() || null,
        staffTeam: staffTeam?.trim() || null,
        office: office?.trim() || null,
        sendSignoffs: sendSignoffs?.trim() || null,
        conductedBy: conductedBy?.trim() || null,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /service-seekers/[id]/mca-assessments error:', error);
    return NextResponse.json({ error: 'Failed to create MCA assessment' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const {
      id,
      risk,
      lastAssessed,
      triggeredBy,
      hasImpairment,
      clinicalDiagnosis,
      decisionToMake,
      isImpairment,
      fluctuatingCapacity,
      fluctuatingCapacityReason,
      generalUnderstanding,
      generalUnderstandingDetails,
      canRetainInformation,
      canRetainInformationDetails,
      canUseWeighInformation,
      canUseWeighInformationDetails,
      canCommunicate,
      healthWelfareLpa,
      advancedDecision,
      deputyAppointed,
      imcaRequired,
      imcaName,
      imcaTelephone,
      option1,
      option2,
      option3,
      pastPresentWishes,
      pastPresentWishesDetails,
      consultedInterestedParties,
      consultedInterestedPartiesDetails,
      consultedProfessionals,
      consultedProfessionalsDetails,
      bestInterestDecision,
      decisionMade,
      leastRestrictivePrinciple,
      disagreement,
      disagreementDetails,
      everyOptionExplored,
      patientRecordsUpdated,
      useOfRestraint,
      misinformation,
      anyoneObjected,
      restraintForTreatment,
      relativesRequestedDischarge,
      restrictedAccessToFamily,
      leastRestrictiveOptions,
      restrictedAccessToCommunity,
      continuousSupervision,
      riskLevel,
      totalScore,
      staffTeam,
      office,
      sendSignoffs,
      conductedBy,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required for update' }, { status: 400 });
    }

    if (!prisma.serviceSeekerMcaAssessment) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const existing = await prisma.serviceSeekerMcaAssessment.findFirst({
      where: { id: parseInt(id, 10), serviceSeekerId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'MCA assessment not found' }, { status: 404 });
    }

    const updated = await prisma.serviceSeekerMcaAssessment.update({
      where: { id: parseInt(id, 10) },
      data: {
        risk: risk?.trim() || null,
        lastAssessed: lastAssessed ? new Date(lastAssessed) : null,
        triggeredBy: triggeredBy?.trim() || null,
        hasImpairment: hasImpairment?.trim() || null,
        clinicalDiagnosis: clinicalDiagnosis?.trim() || null,
        decisionToMake: decisionToMake?.trim() || null,
        isImpairment: isImpairment?.trim() || null,
        fluctuatingCapacity: fluctuatingCapacity?.trim() || null,
        fluctuatingCapacityReason: fluctuatingCapacityReason?.trim() || null,
        generalUnderstanding: generalUnderstanding?.trim() || null,
        generalUnderstandingDetails: generalUnderstandingDetails?.trim() || null,
        canRetainInformation: canRetainInformation?.trim() || null,
        canRetainInformationDetails: canRetainInformationDetails?.trim() || null,
        canUseWeighInformation: canUseWeighInformation?.trim() || null,
        canUseWeighInformationDetails: canUseWeighInformationDetails?.trim() || null,
        canCommunicate: canCommunicate?.trim() || null,
        healthWelfareLpa: healthWelfareLpa?.trim() || null,
        advancedDecision: advancedDecision?.trim() || null,
        deputyAppointed: deputyAppointed?.trim() || null,
        imcaRequired: imcaRequired?.trim() || null,
        imcaName: imcaName?.trim() || null,
        imcaTelephone: imcaTelephone?.trim() || null,
        option1: option1?.trim() || null,
        option2: option2?.trim() || null,
        option3: option3?.trim() || null,
        pastPresentWishes: pastPresentWishes?.trim() || null,
        pastPresentWishesDetails: pastPresentWishesDetails?.trim() || null,
        consultedInterestedParties: consultedInterestedParties?.trim() || null,
        consultedInterestedPartiesDetails: consultedInterestedPartiesDetails?.trim() || null,
        consultedProfessionals: consultedProfessionals?.trim() || null,
        consultedProfessionalsDetails: consultedProfessionalsDetails?.trim() || null,
        bestInterestDecision: bestInterestDecision?.trim() || null,
        decisionMade: decisionMade?.trim() || null,
        leastRestrictivePrinciple: leastRestrictivePrinciple?.trim() || null,
        disagreement: disagreement?.trim() || null,
        disagreementDetails: disagreementDetails?.trim() || null,
        everyOptionExplored: everyOptionExplored?.trim() || null,
        patientRecordsUpdated: patientRecordsUpdated?.trim() || null,
        useOfRestraint: useOfRestraint?.trim() || null,
        misinformation: misinformation?.trim() || null,
        anyoneObjected: anyoneObjected?.trim() || null,
        restraintForTreatment: restraintForTreatment?.trim() || null,
        relativesRequestedDischarge: relativesRequestedDischarge?.trim() || null,
        restrictedAccessToFamily: restrictedAccessToFamily?.trim() || null,
        leastRestrictiveOptions: leastRestrictiveOptions?.trim() || null,
        restrictedAccessToCommunity: restrictedAccessToCommunity?.trim() || null,
        continuousSupervision: continuousSupervision?.trim() || null,
        riskLevel: riskLevel?.trim() || null,
        totalScore: totalScore?.trim() || null,
        staffTeam: staffTeam?.trim() || null,
        office: office?.trim() || null,
        sendSignoffs: sendSignoffs?.trim() || null,
        conductedBy: conductedBy?.trim() || null,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('PUT /service-seekers/[id]/mca-assessments error:', error);
    return NextResponse.json({ error: 'Failed to update MCA assessment' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const resolvedParams = await params;
    const serviceSeekerId = parseInt(resolvedParams.id, 10);
    if (Number.isNaN(serviceSeekerId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const assessmentId = parseInt(searchParams.get('id'), 10);
    if (Number.isNaN(assessmentId)) return NextResponse.json({ error: 'Invalid MCA assessment ID' }, { status: 400 });

    if (!prisma.serviceSeekerMcaAssessment) {
      return NextResponse.json({ error: 'Server not updated yet. Please try again shortly.' }, { status: 503 });
    }

    const assessment = await prisma.serviceSeekerMcaAssessment.findFirst({
      where: { id: assessmentId, serviceSeekerId },
    });

    if (!assessment) {
      return NextResponse.json({ error: 'MCA assessment not found' }, { status: 404 });
    }

    await prisma.serviceSeekerMcaAssessment.delete({
      where: { id: assessmentId },
    });

    return NextResponse.json({ message: 'MCA assessment deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /service-seekers/[id]/mca-assessments error:', error);
    return NextResponse.json({ error: 'Failed to delete MCA assessment' }, { status: 500 });
  }
}

