-- MedFlow Complete Database Schema
-- Merged from all migration files
-- Last Updated: November 13, 2025

-- ============================================
-- MIGRATION 1: Core Tables
-- ============================================

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"mrn" text NOT NULL,
	"dob" date NOT NULL,
	"gender" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"address" text NOT NULL,
	"last_visit" date,
	CONSTRAINT "patients_mrn_unique" UNIQUE("mrn")
);

CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
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

CREATE TABLE "clinical_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"date" date NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"provider" text NOT NULL
);

CREATE TABLE "insurance_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"phone" text,
	"email" text,
	"address" text,
	"website" text,
	"active" integer DEFAULT 1 NOT NULL
);

CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"patient_id" integer NOT NULL,
	"appointment_id" integer,
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

CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"description" text NOT NULL,
	"code" text,
	"quantity" integer NOT NULL,
	"unit_price" numeric NOT NULL,
	"total_price" numeric NOT NULL
);

CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"patient_id" integer NOT NULL,
	"amount" numeric NOT NULL,
	"payment_method" text NOT NULL,
	"payment_date" date NOT NULL,
	"transaction_id" text,
	"notes" text
);

CREATE TABLE "insurance_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"patient_id" integer NOT NULL,
	"invoice_id" integer,
	"insurance_id" integer NOT NULL,
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
-- MIGRATION 2: Medical Records Tables
-- ============================================

CREATE TABLE "vitals" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
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

CREATE TABLE "medications" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
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

CREATE TABLE "lab_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
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

CREATE TABLE "allergies" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"allergen" text NOT NULL,
	"reaction" text NOT NULL,
	"severity" text NOT NULL,
	"notes" text,
	"recorded_date" date NOT NULL,
	"recorded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE "conditions" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
	"condition" text NOT NULL,
	"diagnosed_date" date NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"diagnosed_by" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_id" integer NOT NULL,
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
-- FOREIGN KEY CONSTRAINTS
-- ============================================

ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_patients_id_fk" 
	FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade;

ALTER TABLE "clinical_records" ADD CONSTRAINT "clinical_records_patient_id_patients_id_fk" 
	FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_user_id_users_id_fk" 
	FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_patients_id_fk" 
	FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_appointment_id_appointments_id_fk" 
	FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action;

ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" 
	FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade;

ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" 
	FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade;

ALTER TABLE "payments" ADD CONSTRAINT "payments_patient_id_patients_id_fk" 
	FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action;

ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_user_id_users_id_fk" 
	FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action;

ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_patient_id_patients_id_fk" 
	FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action;

ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_invoice_id_invoices_id_fk" 
	FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action;

ALTER TABLE "insurance_claims" ADD CONSTRAINT "insurance_claims_insurance_id_insurance_providers_id_fk" 
	FOREIGN KEY ("insurance_id") REFERENCES "public"."insurance_providers"("id") ON DELETE no action;

ALTER TABLE "vitals" ADD CONSTRAINT "vitals_patient_id_patients_id_fk" 
	FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade;

ALTER TABLE "medications" ADD CONSTRAINT "medications_patient_id_patients_id_fk" 
	FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade;

ALTER TABLE "lab_results" ADD CONSTRAINT "lab_results_patient_id_patients_id_fk" 
	FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade;

ALTER TABLE "allergies" ADD CONSTRAINT "allergies_patient_id_patients_id_fk" 
	FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade;

ALTER TABLE "conditions" ADD CONSTRAINT "conditions_patient_id_patients_id_fk" 
	FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade;

ALTER TABLE "documents" ADD CONSTRAINT "documents_patient_id_patients_id_fk" 
	FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade;

-- ============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================

CREATE INDEX "idx_appointments_patient" ON "appointments"("patient_id");
CREATE INDEX "idx_clinical_records_patient" ON "clinical_records"("patient_id");
CREATE INDEX "idx_invoices_patient" ON "invoices"("patient_id");
CREATE INDEX "idx_invoices_user" ON "invoices"("user_id");
CREATE INDEX "idx_payments_invoice" ON "payments"("invoice_id");
CREATE INDEX "idx_payments_patient" ON "payments"("patient_id");
CREATE INDEX "idx_insurance_claims_patient" ON "insurance_claims"("patient_id");
CREATE INDEX "idx_insurance_claims_invoice" ON "insurance_claims"("invoice_id");
CREATE INDEX "idx_vitals_patient" ON "vitals"("patient_id");
CREATE INDEX "idx_vitals_date" ON "vitals"("record_date");
CREATE INDEX "idx_medications_patient" ON "medications"("patient_id");
CREATE INDEX "idx_medications_status" ON "medications"("status");
CREATE INDEX "idx_lab_results_patient" ON "lab_results"("patient_id");
CREATE INDEX "idx_lab_results_date" ON "lab_results"("test_date");
CREATE INDEX "idx_allergies_patient" ON "allergies"("patient_id");
CREATE INDEX "idx_conditions_patient" ON "conditions"("patient_id");
CREATE INDEX "idx_conditions_status" ON "conditions"("status");
CREATE INDEX "idx_documents_patient" ON "documents"("patient_id");

-- ============================================
-- SEQUENCES FOR AUTO-INCREMENT
-- ============================================

CREATE SEQUENCE IF NOT EXISTS "patients_mrn_seq" START WITH 1 INCREMENT BY 1 MINVALUE 1;

-- ============================================
-- SUMMARY: 18 Tables Total
-- ============================================
-- Core: users, patients, appointments, clinical_records
-- Billing: invoices, invoice_items, payments, insurance_providers, insurance_claims
-- Medical: vitals, medications, lab_results, allergies, conditions
-- Files: documents
-- ============================================
