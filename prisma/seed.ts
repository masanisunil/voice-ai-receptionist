import { PrismaClient, AppointmentStatus, CallbackStatus, CallDirection, CallSessionStatus } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function minutes(hours: number, mins = 0): number {
  return hours * 60 + mins;
}

function nextWeekday(dayOfWeek: number, hour: number, minute = 0): Date {
  const now = new Date();
  const date = new Date(now);
  const distance = (dayOfWeek + 7 - now.getDay()) % 7 || 7;
  date.setDate(now.getDate() + distance);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main(): Promise<void> {
  await prisma.$transaction([
    prisma.pmsWriteback.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.pendingFollowup.deleteMany(),
    prisma.conversationMessage.deleteMany(),
    prisma.appointment.deleteMany(),
    prisma.callSession.deleteMany(),
    prisma.outboundCallback.deleteMany(),
    prisma.availabilityWindow.deleteMany(),
    prisma.doctor.deleteMany(),
    prisma.branch.deleteMany(),
    prisma.patient.deleteMany(),
    prisma.idempotencyRecord.deleteMany(),
    prisma.clinic.deleteMany()
  ]);

  const clinic = await prisma.clinic.create({
    data: {
      id: "clinic_nu_hospitals",
      name: "NU Hospitals",
      website: "https://www.nuhospitals.com/",
      timezone: "Asia/Kolkata",
      metadata: {
        sourceNotes:
          "Public seed data uses NU Hospitals branch/specialty information. Slot inventory is synthetic because live PMS availability requires clinic credentials."
      }
    }
  });

  const padmanabhanagar = await prisma.branch.create({
    data: {
      id: "branch_padmanabhanagar",
      clinicId: clinic.id,
      name: "Padmanabhanagar",
      city: "Bengaluru",
      country: "IN",
      timezone: "Asia/Kolkata",
      address: "Padmanabhanagar, Bengaluru",
      metadata: { publicSource: "https://www.nuhospitals.com/" }
    }
  });

  const rajajinagar = await prisma.branch.create({
    data: {
      id: "branch_rajajinagar",
      clinicId: clinic.id,
      name: "Rajajinagar",
      city: "Bengaluru",
      country: "IN",
      timezone: "Asia/Kolkata",
      address: "Rajajinagar, Bengaluru",
      metadata: { publicSource: "https://www.nuhospitals.com/" }
    }
  });

  const doctors = await Promise.all([
    prisma.doctor.create({
      data: {
        id: "doc_venkatesh_urology",
        clinicId: clinic.id,
        branchId: padmanabhanagar.id,
        fullName: "Dr. Venkatesh Krishnamoorthy",
        spokenName: "Doctor Venkatesh",
        specialty: "Urology",
        department: "Urology",
        languages: ["en", "hi", "kn"],
        sourceUrl: "https://en.wikipedia.org/wiki/NU_Hospitals",
        metadata: { seedRole: "publicly listed founder/doctor" }
      }
    }),
    prisma.doctor.create({
      data: {
        id: "doc_prasanna_pediatric_urology",
        clinicId: clinic.id,
        branchId: rajajinagar.id,
        fullName: "Dr. Prasanna Venkatesh M. K.",
        spokenName: "Doctor Prasanna",
        specialty: "Pediatric Urology",
        department: "Urology",
        languages: ["en", "hi", "kn"],
        sourceUrl: "https://en.wikipedia.org/wiki/NU_Hospitals",
        metadata: { seedRole: "publicly listed founder/doctor" }
      }
    }),
    prisma.doctor.create({
      data: {
        id: "doc_demo_nephrology_pad",
        clinicId: clinic.id,
        branchId: padmanabhanagar.id,
        fullName: "Dr. Clinic Demo Nephrologist",
        spokenName: "Doctor Nephrology",
        specialty: "Nephrology",
        department: "Nephrology",
        languages: ["en", "hi"],
        sourceUrl: "https://www.nuhospitals.com/",
        metadata: {
          seedRole: "replace-with-Cliniko-import",
          note: "Used so the evaluation harness can test branch-specific specialty routing."
        }
      }
    })
  ]);

  const [venkatesh, prasanna, nephrology] = doctors;

  await prisma.availabilityWindow.createMany({
    data: [
      {
        doctorId: venkatesh.id,
        branchId: padmanabhanagar.id,
        dayOfWeek: 1,
        startMinute: minutes(9),
        endMinute: minutes(13),
        slotDurationMinutes: 30,
        bufferMinutes: 10
      },
      {
        doctorId: venkatesh.id,
        branchId: padmanabhanagar.id,
        dayOfWeek: 3,
        startMinute: minutes(9),
        endMinute: minutes(13),
        slotDurationMinutes: 30,
        bufferMinutes: 10
      },
      {
        doctorId: venkatesh.id,
        branchId: padmanabhanagar.id,
        dayOfWeek: 5,
        startMinute: minutes(14),
        endMinute: minutes(17, 30),
        slotDurationMinutes: 30,
        bufferMinutes: 10
      },
      {
        doctorId: prasanna.id,
        branchId: rajajinagar.id,
        dayOfWeek: 2,
        startMinute: minutes(10),
        endMinute: minutes(14),
        slotDurationMinutes: 30,
        bufferMinutes: 10
      },
      {
        doctorId: prasanna.id,
        branchId: rajajinagar.id,
        dayOfWeek: 4,
        startMinute: minutes(8, 30),
        endMinute: minutes(12),
        slotDurationMinutes: 30,
        bufferMinutes: 10
      },
      {
        doctorId: nephrology.id,
        branchId: padmanabhanagar.id,
        dayOfWeek: 4,
        startMinute: minutes(15),
        endMinute: minutes(18),
        slotDurationMinutes: 30,
        bufferMinutes: 15
      }
    ]
  });

  const ananya = await prisma.patient.create({
    data: {
      id: "patient_ananya_rao",
      fullName: "Ananya Rao",
      normalizedName: normalizeName("Ananya Rao"),
      phoneE164: "+919999000001",
      languagePreference: "en",
      metadata: { returningPatient: true, preferredBranchId: padmanabhanagar.id }
    }
  });

  await prisma.patient.createMany({
    data: [
      {
        id: "patient_raj_sharma",
        fullName: "Raj Sharma",
        normalizedName: normalizeName("Raj Sharma"),
        phoneE164: "+919999000002",
        languagePreference: "hi",
        metadata: { familyLine: true }
      },
      {
        id: "patient_mira_sharma",
        fullName: "Mira Sharma",
        normalizedName: normalizeName("Mira Sharma"),
        phoneE164: "+919999000002",
        languagePreference: "en",
        metadata: { familyLine: true }
      }
    ]
  });

  const existingStart = nextWeekday(3, 9, 0);
  const existingEnd = new Date(existingStart.getTime() + 30 * 60_000);
  await prisma.appointment.create({
    data: {
      id: "appt_existing_ananya",
      patientId: ananya.id,
      doctorId: venkatesh.id,
      branchId: padmanabhanagar.id,
      startAt: existingStart,
      endAt: existingEnd,
      status: AppointmentStatus.CONFIRMED,
      reason: "Follow-up consultation",
      language: "en",
      idempotencyKey: "seed-existing-ananya",
      externalPmsId: "mock_pms_existing_ananya",
      pmsStatus: "SUCCEEDED"
    }
  });

  const dropped = await prisma.callSession.create({
    data: {
      id: "call_dropped_ananya",
      phoneE164: ananya.phoneE164,
      patientId: ananya.id,
      direction: CallDirection.INBOUND,
      status: CallSessionStatus.DROPPED,
      language: "en",
      intent: "booking",
      currentStep: "select_slot",
      lastCompletedStep: "identified_patient",
      droppedAt: new Date(Date.now() - 10 * 60_000),
      state: {
        requestedSpecialty: "Urology",
        requestedBranchId: padmanabhanagar.id,
        capturedName: "Ananya Rao"
      }
    }
  });

  await prisma.conversationMessage.create({
    data: {
      callSessionId: dropped.id,
      role: "assistant",
      language: "en",
      transcript: "I found urology slots at Padmanabhanagar. Let me check the afternoon options."
    }
  });

  await prisma.outboundCallback.create({
    data: {
      id: "callback_missed_family_line",
      phoneE164: "+919999000002",
      status: CallbackStatus.MISSED,
      reason: "Patient requested appointment callback",
      missedAt: new Date(Date.now() - 60 * 60_000),
      context: {
        specialty: "Pediatric Urology",
        preferredBranchId: rajajinagar.id,
        originalLanguage: "hi"
      }
    }
  });

  await prisma.auditLog.create({
    data: {
      actorType: "seed",
      entityType: "Clinic",
      entityId: clinic.id,
      action: "seed_demo_clinic",
      after: { clinic: clinic.name }
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
