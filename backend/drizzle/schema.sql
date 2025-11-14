-- MedFlow Complete Database Schema
-- Single unified migration file
-- All tables, constraints, and indexes in one place

-- ============================================
-- CORE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL UNIQUE,
	"full_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"mrn" text NOT NULL UNIQUE,
	"dob" date NOT NULL,
	"gender" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"address" text NOT NULL,
	"last_visit" date
);

CREATE TABLE IF NOT EXISTS "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
	"date" date NOT NULL,
	"time" text NOT NULL,
	"patient_name" text NOT NULL,
	"mrn" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"location" text NOT NULL,
	"status" text NOT NULL,
	"phone" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "clinical_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
	"date" date NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"provider" text NOT NULL
);

-- ============================================
-- BILLING & INSURANCE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS "insurance_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"website" text,
	"active" integer DEFAULT 1 NOT NULL
);

CREATE TABLE IF NOT EXISTS "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"patient_id" integer NOT NULL REFERENCES "patients"("id"),
	"appointment_id" integer REFERENCES "appointments"("id"),
	"invoice_number" text NOT NULL,
	"invoice_date" date NOT NULL,
	"due_date" date NOT NULL,
	"subtotal" numeric NOT NULL,
	"tax_amount" numeric NOT NULL,
	"discount_amount" numeric NOT NULL,
	"total_amount" numeric NOT NULL,
	"paid_amount" numeric DEFAULT '0' NOT NULL,
	"balance_amount" numeric NOT NULL,
	"status" text NOT NULL,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
	"description" text NOT NULL,
	"code" text,
	"quantity" integer NOT NULL,
	"unit_price" numeric NOT NULL,
	"total_price" numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
	"patient_id" integer NOT NULL REFERENCES "patients"("id"),
	"amount" numeric NOT NULL,
	"payment_method" text NOT NULL,
	"payment_date" date NOT NULL,
	"transaction_id" text,
	"notes" text
);

CREATE TABLE IF NOT EXISTS "insurance_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id"),
	"patient_id" integer NOT NULL REFERENCES "patients"("id"),
	"invoice_id" integer REFERENCES "invoices"("id"),
	"insurance_id" integer NOT NULL REFERENCES "insurance_providers"("id"),
	"claim_number" text NOT NULL,
	"submission_date" date NOT NULL,
	"service_date" date NOT NULL,
	"claimed_amount" numeric NOT NULL,
	"approved_amount" numeric,
	"paid_amount" numeric,
	"status" text NOT NULL,
	"diagnosis_codes" text,
	"procedure_codes" text,
	"notes" text,
	"denial_reason" text
);

-- ============================================
-- MEDICAL RECORDS TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS "vitals" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
	"record_date" date NOT NULL,
	"blood_pressure_systolic" integer,
	"blood_pressure_diastolic" integer,
	"pulse" integer,
	"temperature" numeric(4, 1),
	"weight" numeric(5, 1),
	"height" numeric(5, 1),
	"bmi" numeric(4, 1),
	"oxygen_saturation" integer,
	"respiratory_rate" integer,
	"notes" text,
	"recorded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "medications" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
	"name" text NOT NULL,
	"dosage" text NOT NULL,
	"frequency" text NOT NULL,
	"route" text NOT NULL,
	"prescribed_date" date NOT NULL,
	"prescribed_by" text NOT NULL,
	"start_date" date,
	"end_date" date,
	"status" text DEFAULT 'active' NOT NULL,
	"instructions" text,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "lab_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
	"test_date" date NOT NULL,
	"test_name" text NOT NULL,
	"result" text NOT NULL,
	"unit" text,
	"reference_range" text,
	"status" text NOT NULL,
	"ordered_by" text NOT NULL,
	"performed_by" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "allergies" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
	"allergen" text NOT NULL,
	"reaction" text NOT NULL,
	"severity" text NOT NULL,
	"notes" text,
	"recorded_date" date NOT NULL,
	"recorded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "conditions" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
	"condition" text NOT NULL,
	"diagnosed_date" date NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"diagnosed_by" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
	"record_id" integer,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_url" text NOT NULL,
	"category" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now(),
	"notes" text
);

-- ============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================

CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_patients_mrn" ON "patients"("mrn");
CREATE INDEX IF NOT EXISTS "idx_patients_email" ON "patients"("email");
CREATE INDEX IF NOT EXISTS "idx_patients_name" ON "patients"("full_name");
CREATE INDEX IF NOT EXISTS "idx_appointments_patient_id" ON "appointments"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_appointments_date" ON "appointments"("date");
CREATE INDEX IF NOT EXISTS "idx_clinical_records_patient_id" ON "clinical_records"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_clinical_records_date" ON "clinical_records"("date");
CREATE INDEX IF NOT EXISTS "idx_invoices_patient_id" ON "invoices"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_user_id" ON "invoices"("user_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_date" ON "invoices"("invoice_date");
CREATE INDEX IF NOT EXISTS "idx_invoices_status" ON "invoices"("status");
CREATE INDEX IF NOT EXISTS "idx_invoice_items_invoice_id" ON "invoice_items"("invoice_id");
CREATE INDEX IF NOT EXISTS "idx_payments_invoice_id" ON "payments"("invoice_id");
CREATE INDEX IF NOT EXISTS "idx_payments_patient_id" ON "payments"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_payments_date" ON "payments"("payment_date");
CREATE INDEX IF NOT EXISTS "idx_insurance_claims_patient_id" ON "insurance_claims"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_claims_invoice_id" ON "insurance_claims"("invoice_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_claims_status" ON "insurance_claims"("status");
CREATE INDEX IF NOT EXISTS "idx_insurance_claims_date" ON "insurance_claims"("submission_date");
CREATE INDEX IF NOT EXISTS "idx_vitals_patient_id" ON "vitals"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_vitals_date" ON "vitals"("record_date");
CREATE INDEX IF NOT EXISTS "idx_medications_patient_id" ON "medications"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_medications_status" ON "medications"("status");
CREATE INDEX IF NOT EXISTS "idx_lab_results_patient_id" ON "lab_results"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_lab_results_date" ON "lab_results"("test_date");
CREATE INDEX IF NOT EXISTS "idx_allergies_patient_id" ON "allergies"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_conditions_patient_id" ON "conditions"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_conditions_status" ON "conditions"("status");
CREATE INDEX IF NOT EXISTS "idx_documents_patient_id" ON "documents"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_insurance_providers_code" ON "insurance_providers"("code");

-- ============================================
-- SEQUENCES FOR AUTO-INCREMENT
-- ============================================

CREATE SEQUENCE IF NOT EXISTS "patients_mrn_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1;

-- ============================================
-- END OF SCHEMA
-- ============================================
