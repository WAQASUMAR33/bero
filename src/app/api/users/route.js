import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isManager, hasPermission } from '@/lib/permissions';

// GET /api/users - Fetch all users
export async function GET(request) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(currentUser, 'users.view')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const includeArchived = searchParams.get('includeArchived');

    const where = {};
    const isManagerUser = isManager(currentUser);

    if (!isManagerUser) {
      // Non-managers can ONLY access their own staff record
      where.id = currentUser.id;
    } else {
      if ((statusParam && statusParam.toLowerCase() === 'all') || includeArchived === 'true') {
        // Return all users
      } else if (statusParam && statusParam.toUpperCase() === 'ARCHIVED') {
        where.status = 'ARCHIVED';
      } else {
        // Default: only CURRENT users across the system (shifts, rota, calendar, etc.)
        where.status = 'CURRENT';
      }
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        region: true,
        role: true,
        permissions: true,
        supervisions: {
          orderBy: { supervisionDate: 'desc' },
          take: 5,
          include: {
            supervisor: { select: { id: true, firstName: true, lastName: true } }
          }
        },
        appraisals: {
          orderBy: { dueDate: 'desc' },
          take: 5,
          include: {
            appraiser: { select: { id: true, firstName: true, lastName: true } }
          }
        },
        probations: {
          orderBy: { dueDate: 'desc' },
          take: 5,
          include: {
            reviewer: { select: { id: true, firstName: true, lastName: true } }
          }
        },
        pdps: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Remove password from response
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return NextResponse.json(usersWithoutPassword);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Safe parsing utilities
const parseDate = (val) => {
  if (!val || val === '' || val === 'null' || val === 'undefined') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const parseInteger = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const num = parseInt(val, 10);
  return isNaN(num) ? null : num;
};

const parseFloatNumber = (val) => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[^0-9.-]+/g, '');
    if (!cleaned) return null;
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
};

// POST /api/users - Create a new user
export async function POST(request) {
  try {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized: Session expired or invalid. Please log in again.' }, { status: 401 });
    }

    if (!hasPermission(currentUser, 'users.create')) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to add new staff members.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      username,
      phoneNo,
      roleId: roleIdStr,
      status,
      password,
      permissions = [],
      employeeNumber,
      startDate,
      leaveDate,
      regionId: regionIdStr,
      emergencyName,
      emergencyContact,
      postalCode,
      contractedHours,
      niNumber,
      profilePic,
      // Sheet 1: Personal & Contact
      dob,
      secondaryPhone,
      consentToEmail,
      address,
      // Sheet 1: Employment & Compensation
      reasonForLeaving,
      rateOfPay,
      sleepingNights,
      costForSleepingNights,
      salary,
      // Sheet 1: Compliance & Right to Work
      dbsDate,
      dbsUpdateCode,
      sponsorshipStatus,
      shareCode,
      visaExpiryDate,
      // Sheet 1: Next of Kin & Medical
      nokRelationship,
      allergyStatus,
      allergies,
      vaccinationStatus,
      paysForPrescriptions,
      gpDetails,
      // Sheet 2: Staff Driving Details
      drivingLicenceValid,
      ownCar,
      carMake,
      carModel,
      carColour,
      carRegistration,
      carInsuranceVerified,
      businessInsurance
    } = body;

    // Convert and derive username if missing
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    let cleanUsername = username ? username.trim() : '';
    if (!cleanUsername && cleanEmail) {
      cleanUsername = cleanEmail.split('@')[0];
    }

    const roleId = parseInteger(roleIdStr);
    const regionId = parseInteger(regionIdStr);

    // Validate required fields
    const missingFields = [];
    if (!firstName?.trim()) missingFields.push('First Name');
    if (!lastName?.trim()) missingFields.push('Last Name');
    if (!cleanEmail) missingFields.push('Email');
    if (!password) missingFields.push('Password');
    if (!phoneNo?.trim()) missingFields.push('Phone Number');
    if (!roleId) missingFields.push('Role');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required field(s): ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if user already exists by email
    const existingEmail = await prisma.user.findFirst({
      where: { email: cleanEmail }
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: `A staff member with email "${cleanEmail}" already exists.` },
        { status: 400 }
      );
    }

    // Check if username exists; if so, make it unique
    let finalUsername = cleanUsername;
    const existingUsername = await prisma.user.findFirst({
      where: { username: finalUsername }
    });
    if (existingUsername) {
      finalUsername = `${cleanUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Employee number uniqueness check
    const cleanEmployeeNumber = employeeNumber && employeeNumber.trim() !== '' ? employeeNumber.trim() : null;
    if (cleanEmployeeNumber) {
      const existingEmp = await prisma.user.findUnique({
        where: { employeeNumber: cleanEmployeeNumber }
      });
      if (existingEmp) {
        return NextResponse.json(
          { error: `Employee number "${cleanEmployeeNumber}" is already in use by another staff member.` },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Deduplicate permissions
    const uniquePermissions = Array.isArray(permissions)
      ? [...new Set(permissions.filter(p => typeof p === 'string' && p.trim() !== ''))]
      : [];

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: cleanEmail,
        username: finalUsername,
        phoneNo: phoneNo.trim(),
        roleId,
        status: (status === 'ARCHIVED' || status === 'CURRENT') ? status : 'CURRENT',
        password: hashedPassword,
        isEmailVerified: true,
        profilePic: profilePic || null,
        employeeNumber: cleanEmployeeNumber,
        startDate: parseDate(startDate),
        leaveDate: parseDate(leaveDate),
        regionId,
        emergencyName: emergencyName || null,
        emergencyContact: emergencyContact || null,
        postalCode: postalCode || null,
        contractedHours: parseInteger(contractedHours),
        niNumber: niNumber || null,
        // Sheet 1: Personal & Contact
        dob: parseDate(dob),
        secondaryPhone: secondaryPhone || null,
        consentToEmail: Boolean(consentToEmail),
        address: address || null,
        // Sheet 1: Employment & Compensation
        reasonForLeaving: reasonForLeaving || null,
        rateOfPay: parseFloatNumber(rateOfPay),
        sleepingNights: Boolean(sleepingNights),
        costForSleepingNights: parseFloatNumber(costForSleepingNights),
        salary: parseFloatNumber(salary),
        // Sheet 1: Compliance & Right to Work
        dbsDate: parseDate(dbsDate),
        dbsUpdateCode: dbsUpdateCode || null,
        sponsorshipStatus: sponsorshipStatus || null,
        shareCode: shareCode || null,
        visaExpiryDate: parseDate(visaExpiryDate),
        // Sheet 1: Next of Kin & Medical
        nokRelationship: nokRelationship || null,
        allergyStatus: allergyStatus || null,
        allergies: allergies || null,
        vaccinationStatus: vaccinationStatus || null,
        paysForPrescriptions: Boolean(paysForPrescriptions),
        gpDetails: gpDetails || null,
        // Sheet 2: Staff Driving Details
        drivingLicenceValid: Boolean(drivingLicenceValid),
        ownCar: Boolean(ownCar),
        carMake: carMake || null,
        carModel: carModel || null,
        carColour: carColour || null,
        carRegistration: carRegistration || null,
        carInsuranceVerified: Boolean(carInsuranceVerified),
        businessInsurance: Boolean(businessInsurance),
        permissions: {
          create: uniquePermissions.map(permission => ({
            key: permission
          }))
        }
      },
      include: {
        region: true,
        permissions: true,
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    // Notify HR and Admins about new staff member (OPTIMIZED)
    try {
      const hrAdmins = await prisma.user.findMany({
        where: {
          role: { name: { in: ['ADMIN', 'HR', 'DIRECTOR'] } },
          status: 'CURRENT'
        },
        select: { id: true },
        take: 50 // Limit to prevent excessive queries
      });

      if (hrAdmins.length > 0) {
        await prisma.notification.createMany({
          data: hrAdmins.map(admin => ({
            userId: admin.id,
            title: 'New Staff Member Registered',
            message: `${firstName} ${lastName} has been added to the system.`,
            type: 'INFO',
            link: '/admin/staff-management',
            isRead: false
          })),
          skipDuplicates: true
        });
      }
    } catch (notifError) {
      console.error('Failed to create new staff notifications:', notifError);
    }

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);

    if (error.code === 'P2002') {
      const field = error.meta?.target || 'a unique field';
      return NextResponse.json(
        { error: `Conflict: ${field} already exists.` },
        { status: 409 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Invalid reference for Role or Region. Please re-select the options.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create staff member. Please check all fields and try again.' },
      { status: 500 }
    );
  }
}