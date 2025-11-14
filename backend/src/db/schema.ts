import { pgTable, text, uuid, timestamp, serial, integer, date, numeric, index } from "drizzle-orm/pg-core"

// ============================================
// CORE TABLES
// ============================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    fullName: text("full_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  }),
)

export const patients = pgTable(
  "patients",
  {
    id: serial("id").primaryKey(),
    fullName: text("full_name").notNull(),
    mrn: text("mrn").notNull().unique(),
    dob: date("dob").notNull(),
    gender: text("gender").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    address: text("address").notNull(),
    lastVisit: date("last_visit"),
  },
  (table) => ({
    mrnIdx: index("patients_mrn_idx").on(table.mrn),
    emailIdx: index("patients_email_idx").on(table.email),
    nameIdx: index("patients_name_idx").on(table.fullName),
  }),
)

export const appointments = pgTable(
  "appointments",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    time: text("time").notNull(),
    patientName: text("patient_name").notNull(),
    mrn: text("mrn").notNull(),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    location: text("location").notNull(),
    status: text("status").notNull(),
    phone: text("phone").notNull(),
  },
  (table) => ({
    patientIdIdx: index("appointments_patient_id_idx").on(table.patientId),
    dateIdx: index("appointments_date_idx").on(table.date),
  }),
)

export const clinicalRecords = pgTable(
  "clinical_records",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    provider: text("provider").notNull(),
  },
  (table) => ({
    patientIdIdx: index("clinical_records_patient_id_idx").on(table.patientId),
    dateIdx: index("clinical_records_date_idx").on(table.date),
  }),
)

// ============================================
// BILLING & INSURANCE TABLES
// ============================================

export const invoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id),
    appointmentId: integer("appointment_id").references(() => appointments.id),
    invoiceNumber: text("invoice_number").notNull(),
    invoiceDate: date("invoice_date").notNull(),
    dueDate: date("due_date").notNull(),
    subtotal: numeric("subtotal").notNull(),
    taxAmount: numeric("tax_amount").notNull(),
    discountAmount: numeric("discount_amount").notNull(),
    totalAmount: numeric("total_amount").notNull(),
    paidAmount: numeric("paid_amount").default("0").notNull(),
    balanceAmount: numeric("balance_amount").notNull(),
    status: text("status").notNull(),
    notes: text(),
  },
  (table) => ({
    patientIdIdx: index("invoices_patient_id_idx").on(table.patientId),
    userIdIdx: index("invoices_user_id_idx").on(table.userId),
    invoiceDateIdx: index("invoices_invoice_date_idx").on(table.invoiceDate),
    statusIdx: index("invoices_status_idx").on(table.status),
  }),
)

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    code: text("code"),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price").notNull(),
    totalPrice: numeric("total_price").notNull(),
  },
  (table) => ({
    invoiceIdIdx: index("invoice_items_invoice_id_idx").on(table.invoiceId),
  }),
)

export const payments = pgTable(
  "payments",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id),
    amount: numeric("amount").notNull(),
    paymentMethod: text("payment_method").notNull(),
    paymentDate: date("payment_date").notNull(),
    transactionId: text("transaction_id"),
    notes: text(),
  },
  (table) => ({
    invoiceIdIdx: index("payments_invoice_id_idx").on(table.invoiceId),
    patientIdIdx: index("payments_patient_id_idx").on(table.patientId),
    paymentDateIdx: index("payments_payment_date_idx").on(table.paymentDate),
  }),
)

export const insuranceProviders = pgTable(
  "insurance_providers",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    phone: text("phone"),
    email: text("email"),
    address: text("address"),
    website: text("website"),
    active: integer("active").notNull().default(1),
  },
  (table) => ({
    codeIdx: index("insurance_providers_code_idx").on(table.code),
  }),
)

export const insuranceClaims = pgTable(
  "insurance_claims",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id),
    invoiceId: integer("invoice_id").references(() => invoices.id),
    insuranceId: integer("insurance_id")
      .notNull()
      .references(() => insuranceProviders.id),
    claimNumber: text("claim_number").notNull(),
    submissionDate: date("submission_date").notNull(),
    serviceDate: date("service_date").notNull(),
    claimedAmount: numeric("claimed_amount").notNull(),
    approvedAmount: numeric("approved_amount"),
    paidAmount: numeric("paid_amount"),
    status: text("status").notNull(),
    diagnosisCodes: text("diagnosis_codes"),
    procedureCodes: text("procedure_codes"),
    notes: text(),
    denialReason: text(),
  },
  (table) => ({
    patientIdIdx: index("insurance_claims_patient_id_idx").on(table.patientId),
    statusIdx: index("insurance_claims_status_idx").on(table.status),
    submissionDateIdx: index("insurance_claims_submission_date_idx").on(table.submissionDate),
  }),
)

// ============================================
// MEDICAL RECORDS TABLES
// ============================================

export const vitals = pgTable(
  "vitals",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    recordDate: date("record_date").notNull(),
    bloodPressureSystolic: integer("blood_pressure_systolic"),
    bloodPressureDiastolic: integer("blood_pressure_diastolic"),
    pulse: integer("pulse"),
    temperature: numeric("temperature", { precision: 4, scale: 1 }),
    weight: numeric("weight", { precision: 5, scale: 1 }),
    height: numeric("height", { precision: 5, scale: 1 }),
    bmi: numeric("bmi", { precision: 4, scale: 1 }),
    oxygenSaturation: integer("oxygen_saturation"),
    respiratoryRate: integer("respiratory_rate"),
    notes: text(),
    recordedBy: text("recorded_by").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    patientIdIdx: index("vitals_patient_id_idx").on(table.patientId),
    recordDateIdx: index("vitals_record_date_idx").on(table.recordDate),
  }),
)

export const medications = pgTable(
  "medications",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    dosage: text("dosage").notNull(),
    frequency: text("frequency").notNull(),
    route: text("route").notNull(),
    prescribedDate: date("prescribed_date").notNull(),
    prescribedBy: text("prescribed_by").notNull(),
    startDate: date("start_date"),
    endDate: date("end_date"),
    status: text("status").notNull().default("active"),
    instructions: text("instructions"),
    notes: text(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    patientIdIdx: index("medications_patient_id_idx").on(table.patientId),
    statusIdx: index("medications_status_idx").on(table.status),
  }),
)

export const labResults = pgTable(
  "lab_results",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    testDate: date("test_date").notNull(),
    testName: text("test_name").notNull(),
    result: text("result").notNull(),
    unit: text("unit"),
    referenceRange: text("reference_range"),
    status: text("status").notNull(),
    orderedBy: text("ordered_by").notNull(),
    performedBy: text("performed_by"),
    notes: text(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    patientIdIdx: index("lab_results_patient_id_idx").on(table.patientId),
    testDateIdx: index("lab_results_test_date_idx").on(table.testDate),
  }),
)

export const allergies = pgTable(
  "allergies",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    allergen: text("allergen").notNull(),
    reaction: text("reaction").notNull(),
    severity: text("severity").notNull(),
    notes: text(),
    recordedDate: date("recorded_date").notNull(),
    recordedBy: text("recorded_by").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    patientIdIdx: index("allergies_patient_id_idx").on(table.patientId),
  }),
)

export const conditions = pgTable(
  "conditions",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    condition: text("condition").notNull(),
    diagnosedDate: date("diagnosed_date").notNull(),
    status: text("status").notNull().default("active"),
    diagnosedBy: text("diagnosed_by").notNull(),
    notes: text(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    patientIdIdx: index("conditions_patient_id_idx").on(table.patientId),
    statusIdx: index("conditions_status_idx").on(table.status),
  }),
)

export const documents = pgTable(
  "documents",
  {
    id: serial("id").primaryKey(),
    patientId: integer("patient_id")
      .notNull()
      .references(() => patients.id, { onDelete: "cascade" }),
    recordId: integer("record_id"),
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: integer("file_size").notNull(),
    fileUrl: text("file_url").notNull(),
    category: text("category").notNull(),
    uploadedBy: text("uploaded_by").notNull(),
    uploadedAt: timestamp("uploaded_at").defaultNow(),
    notes: text(),
  },
  (table) => ({
    patientIdIdx: index("documents_patient_id_idx").on(table.patientId),
  }),
)
