CREATE TYPE "AppointmentStatus" AS ENUM ('HELD', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW');
CREATE TYPE "CallSessionStatus" AS ENUM ('IN_PROGRESS', 'DROPPED', 'COMPLETED', 'ESCALATED', 'ABANDONED');
CREATE TYPE "CallDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "CallbackStatus" AS ENUM ('SCHEDULED', 'MISSED', 'RESOLVED', 'CANCELLED');
CREATE TYPE "PmsWritebackStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED');
CREATE TYPE "FollowupReason" AS ENUM ('HUMAN_REQUEST', 'CLINICAL_CONCERN', 'PMS_FAILURE', 'DROPPED_CALL', 'MISSED_CALLBACK', 'OTHER');

CREATE TABLE "Clinic" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "website" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Branch" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "phone" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "address" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Doctor" (
  "id" TEXT NOT NULL,
  "clinicId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "spokenName" TEXT NOT NULL,
  "specialty" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "languages" TEXT[],
  "sourceUrl" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Patient" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "phoneE164" TEXT NOT NULL,
  "languagePreference" TEXT,
  "dateOfBirth" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AvailabilityWindow" (
  "id" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startMinute" INTEGER NOT NULL,
  "endMinute" INTEGER NOT NULL,
  "slotDurationMinutes" INTEGER NOT NULL DEFAULT 30,
  "bufferMinutes" INTEGER NOT NULL DEFAULT 10,
  "effectiveFrom" TIMESTAMP(3),
  "effectiveTo" TIMESTAMP(3),
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AvailabilityWindow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Appointment" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "doctorId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "callSessionId" TEXT,
  "sourceAppointmentId" TEXT,
  "startAt" TIMESTAMP(3) NOT NULL,
  "endAt" TIMESTAMP(3) NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
  "reason" TEXT,
  "language" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "externalPmsId" TEXT,
  "pmsStatus" "PmsWritebackStatus" NOT NULL DEFAULT 'PENDING',
  "cancellationFeeMentioned" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CallSession" (
  "id" TEXT NOT NULL,
  "retellCallId" TEXT,
  "phoneE164" TEXT NOT NULL,
  "patientId" TEXT,
  "direction" "CallDirection" NOT NULL DEFAULT 'INBOUND',
  "status" "CallSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "language" TEXT,
  "intent" TEXT,
  "currentStep" TEXT,
  "lastCompletedStep" TEXT,
  "state" JSONB,
  "droppedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "callbackId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CallSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConversationMessage" (
  "id" TEXT NOT NULL,
  "callSessionId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "language" TEXT,
  "transcript" TEXT,
  "toolName" TEXT,
  "payload" JSONB,
  "latencyMs" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OutboundCallback" (
  "id" TEXT NOT NULL,
  "phoneE164" TEXT NOT NULL,
  "patientId" TEXT,
  "originalCallSessionId" TEXT,
  "status" "CallbackStatus" NOT NULL DEFAULT 'SCHEDULED',
  "reason" TEXT,
  "context" JSONB,
  "scheduledAt" TIMESTAMP(3),
  "missedAt" TIMESTAMP(3),
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OutboundCallback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PendingFollowup" (
  "id" TEXT NOT NULL,
  "patientId" TEXT,
  "callSessionId" TEXT,
  "reason" "FollowupReason" NOT NULL,
  "summary" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PendingFollowup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PmsWriteback" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" "PmsWritebackStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "payload" JSONB NOT NULL,
  "response" JSONB,
  "lastError" TEXT,
  "nextRetryAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PmsWriteback_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdempotencyRecord" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "scope" TEXT NOT NULL,
  "requestHash" TEXT NOT NULL,
  "response" JSONB,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorType" TEXT NOT NULL,
  "actorId" TEXT,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "requestId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Appointment_idempotencyKey_key" ON "Appointment"("idempotencyKey");
CREATE UNIQUE INDEX "CallSession_retellCallId_key" ON "CallSession"("retellCallId");
CREATE UNIQUE INDEX "PmsWriteback_idempotencyKey_key" ON "PmsWriteback"("idempotencyKey");
CREATE UNIQUE INDEX "IdempotencyRecord_key_key" ON "IdempotencyRecord"("key");

CREATE INDEX "Branch_clinicId_idx" ON "Branch"("clinicId");
CREATE INDEX "Branch_city_idx" ON "Branch"("city");
CREATE INDEX "Doctor_clinicId_specialty_idx" ON "Doctor"("clinicId", "specialty");
CREATE INDEX "Doctor_branchId_specialty_idx" ON "Doctor"("branchId", "specialty");
CREATE INDEX "Patient_phoneE164_idx" ON "Patient"("phoneE164");
CREATE INDEX "Patient_normalizedName_idx" ON "Patient"("normalizedName");
CREATE INDEX "AvailabilityWindow_doctorId_dayOfWeek_idx" ON "AvailabilityWindow"("doctorId", "dayOfWeek");
CREATE INDEX "AvailabilityWindow_branchId_dayOfWeek_idx" ON "AvailabilityWindow"("branchId", "dayOfWeek");
CREATE INDEX "Appointment_patientId_startAt_idx" ON "Appointment"("patientId", "startAt");
CREATE INDEX "Appointment_doctorId_startAt_idx" ON "Appointment"("doctorId", "startAt");
CREATE INDEX "Appointment_branchId_startAt_idx" ON "Appointment"("branchId", "startAt");
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");
CREATE INDEX "CallSession_phoneE164_status_idx" ON "CallSession"("phoneE164", "status");
CREATE INDEX "CallSession_updatedAt_idx" ON "CallSession"("updatedAt");
CREATE INDEX "ConversationMessage_callSessionId_createdAt_idx" ON "ConversationMessage"("callSessionId", "createdAt");
CREATE INDEX "OutboundCallback_phoneE164_status_idx" ON "OutboundCallback"("phoneE164", "status");
CREATE INDEX "PendingFollowup_status_reason_idx" ON "PendingFollowup"("status", "reason");
CREATE INDEX "PmsWriteback_status_nextRetryAt_idx" ON "PmsWriteback"("status", "nextRetryAt");
CREATE INDEX "IdempotencyRecord_scope_key_idx" ON "IdempotencyRecord"("scope", "key");
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

CREATE UNIQUE INDEX "appointment_active_doctor_slot_unique"
  ON "Appointment"("doctorId", "startAt", "endAt")
  WHERE "status" IN ('HELD', 'CONFIRMED');

ALTER TABLE "Branch" ADD CONSTRAINT "Branch_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Doctor" ADD CONSTRAINT "Doctor_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilityWindow" ADD CONSTRAINT "AvailabilityWindow_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilityWindow" ADD CONSTRAINT "AvailabilityWindow_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_callSessionId_fkey" FOREIGN KEY ("callSessionId") REFERENCES "CallSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_sourceAppointmentId_fkey" FOREIGN KEY ("sourceAppointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CallSession" ADD CONSTRAINT "CallSession_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CallSession" ADD CONSTRAINT "CallSession_callbackId_fkey" FOREIGN KEY ("callbackId") REFERENCES "OutboundCallback"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_callSessionId_fkey" FOREIGN KEY ("callSessionId") REFERENCES "CallSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OutboundCallback" ADD CONSTRAINT "OutboundCallback_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PendingFollowup" ADD CONSTRAINT "PendingFollowup_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PendingFollowup" ADD CONSTRAINT "PendingFollowup_callSessionId_fkey" FOREIGN KEY ("callSessionId") REFERENCES "CallSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PmsWriteback" ADD CONSTRAINT "PmsWriteback_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
