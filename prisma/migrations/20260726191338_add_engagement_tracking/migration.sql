-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "areaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Machine_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "areaId" TEXT NOT NULL,
    "machineId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "auditTypeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Audit_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Audit_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Audit_auditTypeId_fkey" FOREIGN KEY ("auditTypeId") REFERENCES "AuditType" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "aiSuggestion" TEXT,
    "photoUrl" TEXT,
    "severity" TEXT DEFAULT 'MODERATE',
    "dueDate" DATETIME,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "fixPhotoUrl" TEXT,
    "fixedBy" TEXT,
    "fixedAt" DATETIME,
    "operatorComment" TEXT,
    "assignedToId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Observation_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Observation_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ObservationExtension" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "observationId" TEXT NOT NULL,
    "previousDueDate" DATETIME,
    "newDueDate" DATETIME NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ObservationExtension_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "Observation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "areaId" TEXT,
    "machineId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Kaizen" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "benefits" TEXT,
    "submittedBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "committeeNote" TEXT,
    "photoUrl" TEXT,
    "pointsAwarded" INTEGER DEFAULT 0,
    "pointsCategory" TEXT,
    "isPaidOut" BOOLEAN NOT NULL DEFAULT false,
    "paidOutAt" DATETIME,
    "payoutDocNum" TEXT,
    "areaId" TEXT,
    "machineId" TEXT,
    "assignedToId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kaizen_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Kaizen_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Kaizen_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KaizenPayoutRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "docNumber" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userLogin" TEXT,
    "bankAccount" TEXT,
    "kaizenIds" TEXT NOT NULL,
    "kaizenTitles" TEXT,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "rewardType" TEXT NOT NULL DEFAULT 'Premia finansowa z programu Kaizen',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "canCreateAudit" BOOLEAN NOT NULL DEFAULT false,
    "canCompleteAudit" BOOLEAN NOT NULL DEFAULT false,
    "canDeleteAudit" BOOLEAN NOT NULL DEFAULT false,
    "canManageStructure" BOOLEAN NOT NULL DEFAULT false,
    "canManageUsers" BOOLEAN NOT NULL DEFAULT false,
    "canManageTypes" BOOLEAN NOT NULL DEFAULT false,
    "canManageKaizen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "login" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OPERATOR',
    "roleId" TEXT,
    "responsibleAreaId" TEXT,
    "notifyBhp" BOOLEAN NOT NULL DEFAULT false,
    "notifyQuality" BOOLEAN NOT NULL DEFAULT false,
    "notifyFaults" BOOLEAN NOT NULL DEFAULT false,
    "notifyKaizen" BOOLEAN NOT NULL DEFAULT false,
    "notifyAudits" BOOLEAN NOT NULL DEFAULT false,
    "isKaizenCommittee" BOOLEAN NOT NULL DEFAULT false,
    "bhpTrainingDueDate" DATETIME,
    "dismissedBhpNoticeThreshold" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_responsibleAreaId_fkey" FOREIGN KEY ("responsibleAreaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ObservationSeverity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'red',
    "isPositive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FaultReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MODERATE',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reportedBy" TEXT NOT NULL,
    "photoUrl" TEXT,
    "fixPhotoUrl" TEXT,
    "fixedBy" TEXT,
    "fixedAt" DATETIME,
    "operatorComment" TEXT,
    "notifyEmails" TEXT,
    "dueDate" DATETIME,
    "areaId" TEXT,
    "machineId" TEXT,
    "assignedToId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FaultReport_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FaultReport_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FaultReport_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditTypeQuestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditTypeId" TEXT NOT NULL,
    "chapter" TEXT NOT NULL DEFAULT 'Ogólne',
    "code" TEXT,
    "questionText" TEXT NOT NULL,
    "guidance" TEXT,
    "isKnockOut" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuditTypeQuestion_auditTypeId_fkey" FOREIGN KEY ("auditTypeId") REFERENCES "AuditType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditQuestionAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "auditId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "severity" TEXT,
    "comment" TEXT,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AuditQuestionAnswer_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "Audit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AuditQuestionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AuditTypeQuestion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userLogin" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityTitle" TEXT NOT NULL,
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "actionCount" INTEGER NOT NULL DEFAULT 0,
    "actionTypes" TEXT NOT NULL DEFAULT '',
    "engagementLevel" TEXT NOT NULL DEFAULT 'SKIMMED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "KaizenScoringCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minPoints" INTEGER NOT NULL DEFAULT 10,
    "maxPoints" INTEGER NOT NULL DEFAULT 100,
    "icon" TEXT NOT NULL DEFAULT '⚡',
    "color" TEXT NOT NULL DEFAULT 'amber',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "KaizenGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "targetPoints" INTEGER NOT NULL DEFAULT 500,
    "period" TEXT NOT NULL DEFAULT 'MONTHLY',
    "rewardInfo" TEXT,
    "isScoringEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BhpHazardReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'NEAR_MISS',
    "severity" TEXT NOT NULL DEFAULT 'CRITICAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reportedBy" TEXT NOT NULL,
    "photoUrl" TEXT,
    "fixPhotoUrl" TEXT,
    "fixedBy" TEXT,
    "fixedAt" DATETIME,
    "actionTaken" TEXT,
    "notifyEmails" TEXT,
    "dueDate" DATETIME,
    "hazardCategory" TEXT,
    "probability" INTEGER,
    "injurySeverity" INTEGER,
    "riskScore" INTEGER,
    "riskLevel" TEXT,
    "areaId" TEXT,
    "machineId" TEXT,
    "assignedToId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BhpHazardReport_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BhpHazardReport_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BhpHazardReport_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualityReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'PRODUCT_DEFECT',
    "severity" TEXT NOT NULL DEFAULT 'CRITICAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reportedBy" TEXT NOT NULL,
    "batchNumber" TEXT,
    "quantityAffected" TEXT,
    "photoUrl" TEXT,
    "fixPhotoUrl" TEXT,
    "fixedBy" TEXT,
    "fixedAt" DATETIME,
    "actionTaken" TEXT,
    "notifyEmails" TEXT,
    "dueDate" DATETIME,
    "areaId" TEXT,
    "machineId" TEXT,
    "assignedToId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QualityReport_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QualityReport_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QualityReport_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserTrainingType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserTraining" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "trainingTypeId" TEXT NOT NULL,
    "dueDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserTraining_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserTraining_trainingTypeId_fkey" FOREIGN KEY ("trainingTypeId") REFERENCES "UserTrainingType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'BUG',
    "pageUrl" TEXT,
    "pageName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "photoUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "unreadForUser" BOOLEAN NOT NULL DEFAULT false,
    "unreadForAdmin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BugReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BugReportMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bugReportId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BugReportMessage_bugReportId_fkey" FOREIGN KEY ("bugReportId") REFERENCES "BugReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BugReportMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Machine_areaId_idx" ON "Machine"("areaId");

-- CreateIndex
CREATE INDEX "Audit_status_idx" ON "Audit"("status");

-- CreateIndex
CREATE INDEX "Audit_areaId_idx" ON "Audit"("areaId");

-- CreateIndex
CREATE INDEX "Audit_auditTypeId_idx" ON "Audit"("auditTypeId");

-- CreateIndex
CREATE INDEX "Audit_createdAt_idx" ON "Audit"("createdAt");

-- CreateIndex
CREATE INDEX "Observation_auditId_idx" ON "Observation"("auditId");

-- CreateIndex
CREATE INDEX "Observation_assignedToId_idx" ON "Observation"("assignedToId");

-- CreateIndex
CREATE INDEX "Observation_isFixed_idx" ON "Observation"("isFixed");

-- CreateIndex
CREATE INDEX "Observation_createdAt_idx" ON "Observation"("createdAt");

-- CreateIndex
CREATE INDEX "ObservationExtension_observationId_idx" ON "ObservationExtension"("observationId");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- CreateIndex
CREATE INDEX "Document_areaId_idx" ON "Document"("areaId");

-- CreateIndex
CREATE INDEX "Kaizen_status_idx" ON "Kaizen"("status");

-- CreateIndex
CREATE INDEX "Kaizen_areaId_idx" ON "Kaizen"("areaId");

-- CreateIndex
CREATE INDEX "Kaizen_submittedBy_idx" ON "Kaizen"("submittedBy");

-- CreateIndex
CREATE INDEX "Kaizen_isPaidOut_idx" ON "Kaizen"("isPaidOut");

-- CreateIndex
CREATE INDEX "Kaizen_createdAt_idx" ON "Kaizen"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KaizenPayoutRequest_docNumber_key" ON "KaizenPayoutRequest"("docNumber");

-- CreateIndex
CREATE INDEX "KaizenPayoutRequest_status_idx" ON "KaizenPayoutRequest"("status");

-- CreateIndex
CREATE INDEX "KaizenPayoutRequest_userLogin_idx" ON "KaizenPayoutRequest"("userLogin");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_responsibleAreaId_idx" ON "User"("responsibleAreaId");

-- CreateIndex
CREATE INDEX "FaultReport_status_idx" ON "FaultReport"("status");

-- CreateIndex
CREATE INDEX "FaultReport_areaId_idx" ON "FaultReport"("areaId");

-- CreateIndex
CREATE INDEX "FaultReport_machineId_idx" ON "FaultReport"("machineId");

-- CreateIndex
CREATE INDEX "FaultReport_assignedToId_idx" ON "FaultReport"("assignedToId");

-- CreateIndex
CREATE INDEX "FaultReport_createdAt_idx" ON "FaultReport"("createdAt");

-- CreateIndex
CREATE INDEX "AuditTypeQuestion_auditTypeId_idx" ON "AuditTypeQuestion"("auditTypeId");

-- CreateIndex
CREATE INDEX "AuditQuestionAnswer_auditId_idx" ON "AuditQuestionAnswer"("auditId");

-- CreateIndex
CREATE INDEX "AuditQuestionAnswer_status_idx" ON "AuditQuestionAnswer"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AuditQuestionAnswer_auditId_questionId_key" ON "AuditQuestionAnswer"("auditId", "questionId");

-- CreateIndex
CREATE INDEX "AccessLog_entityType_entityId_idx" ON "AccessLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AccessLog_userLogin_idx" ON "AccessLog"("userLogin");

-- CreateIndex
CREATE INDEX "BhpHazardReport_status_idx" ON "BhpHazardReport"("status");

-- CreateIndex
CREATE INDEX "BhpHazardReport_areaId_idx" ON "BhpHazardReport"("areaId");

-- CreateIndex
CREATE INDEX "BhpHazardReport_assignedToId_idx" ON "BhpHazardReport"("assignedToId");

-- CreateIndex
CREATE INDEX "BhpHazardReport_createdAt_idx" ON "BhpHazardReport"("createdAt");

-- CreateIndex
CREATE INDEX "QualityReport_status_idx" ON "QualityReport"("status");

-- CreateIndex
CREATE INDEX "QualityReport_areaId_idx" ON "QualityReport"("areaId");

-- CreateIndex
CREATE INDEX "QualityReport_assignedToId_idx" ON "QualityReport"("assignedToId");

-- CreateIndex
CREATE INDEX "QualityReport_createdAt_idx" ON "QualityReport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserTrainingType_name_key" ON "UserTrainingType"("name");

-- CreateIndex
CREATE INDEX "UserTraining_userId_idx" ON "UserTraining"("userId");

-- CreateIndex
CREATE INDEX "UserTraining_dueDate_idx" ON "UserTraining"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "UserTraining_userId_trainingTypeId_key" ON "UserTraining"("userId", "trainingTypeId");

-- CreateIndex
CREATE INDEX "BugReport_createdById_idx" ON "BugReport"("createdById");

-- CreateIndex
CREATE INDEX "BugReport_status_idx" ON "BugReport"("status");

-- CreateIndex
CREATE INDEX "BugReport_createdAt_idx" ON "BugReport"("createdAt");

-- CreateIndex
CREATE INDEX "BugReportMessage_bugReportId_idx" ON "BugReportMessage"("bugReportId");

-- CreateIndex
CREATE INDEX "BugReportMessage_senderId_idx" ON "BugReportMessage"("senderId");
