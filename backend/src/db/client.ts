import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.js';

// Get connection string from environment
const connectionString = process.env.DATABASE_URL;

// Validate connection string in production
if (!connectionString && process.env.NODE_ENV === 'production') {
	console.error('❌ DATABASE_URL environment variable is required in production');
	process.exit(1);
}

// Use environment variable or local default
const finalConnectionString = connectionString || 'postgres://medflow_user:medflow_secure_password@localhost:5432/medflow_db';

// Create connection pool with optimized settings
export const pool = new Pool({
	connectionString: finalConnectionString,
	idleTimeoutMillis: 30000,
	connectionTimeoutMillis: 2000,
	max: 20, // Maximum connections in pool
});

// Initialize Drizzle ORM with schema
export const db = drizzle(pool, { schema });

// Health check function
export async function checkConnection() {
	try {
		const result = await pool.query('SELECT NOW()');
		console.log('✅ Database connected successfully');
		return true;
	} catch (error) {
		console.error('❌ Database connection failed:', error);
		return false;
	}
}

export async function ensureSchema() {
	// Minimal bootstrap to create tables if they don't exist (for first run without migrations)
	// Prefer using drizzle-kit migrations (db:push) in production
	try {
		console.log('📦 Initializing database schema...');
		
		await pool.query(`
		CREATE EXTENSION IF NOT EXISTS pgcrypto;
		CREATE SEQUENCE IF NOT EXISTS patients_mrn_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
		CREATE TABLE IF NOT EXISTS users (
			id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
			email text UNIQUE NOT NULL,
			full_name text NOT NULL,
			password_hash text NOT NULL,
			created_at timestamptz NOT NULL DEFAULT now()
		);
		CREATE TABLE IF NOT EXISTS patients (
			id serial PRIMARY KEY,
			full_name text NOT NULL,
			mrn text UNIQUE NOT NULL,
			dob date NOT NULL,
			gender text NOT NULL,
			phone text NOT NULL,
			email text NOT NULL,
			address text NOT NULL,
			last_visit date
		);
		CREATE TABLE IF NOT EXISTS appointments (
			id serial PRIMARY KEY,
			patient_id integer NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			date date NOT NULL,
			time text NOT NULL,
			patient_name text NOT NULL,
			mrn text NOT NULL,
			type text NOT NULL,
			provider text NOT NULL,
			location text NOT NULL,
			status text NOT NULL,
			phone text NOT NULL
		);
		CREATE TABLE IF NOT EXISTS clinical_records (
			id serial PRIMARY KEY,
			patient_id integer NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			date date NOT NULL,
			type text NOT NULL,
			title text NOT NULL,
			content text NOT NULL,
			provider text NOT NULL
		);
		CREATE TABLE IF NOT EXISTS invoices (
			id serial PRIMARY KEY,
			user_id uuid NOT NULL REFERENCES users(id),
			patient_id integer NOT NULL REFERENCES patients(id),
			appointment_id integer REFERENCES appointments(id),
			invoice_number text NOT NULL,
			invoice_date date NOT NULL,
			due_date date NOT NULL,
			subtotal numeric NOT NULL,
			tax_amount numeric NOT NULL,
			discount_amount numeric NOT NULL,
			total_amount numeric NOT NULL,
			paid_amount numeric NOT NULL DEFAULT 0,
			balance_amount numeric NOT NULL,
			status text NOT NULL,
			notes text
		);
		CREATE TABLE IF NOT EXISTS invoice_items (
			id serial PRIMARY KEY,
			invoice_id integer NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
			description text NOT NULL,
			code text,
			quantity integer NOT NULL,
			unit_price numeric NOT NULL,
			total_price numeric NOT NULL
		);
		CREATE TABLE IF NOT EXISTS payments (
			id serial PRIMARY KEY,
			invoice_id integer NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
			patient_id integer NOT NULL REFERENCES patients(id),
			amount numeric NOT NULL,
			payment_method text NOT NULL,
			payment_date date NOT NULL,
			transaction_id text,
			notes text
		);
		CREATE TABLE IF NOT EXISTS insurance_providers (
			id serial PRIMARY KEY,
			name text NOT NULL,
			code text NOT NULL,
			phone text,
			email text,
			address text,
			website text,
			active integer NOT NULL DEFAULT 1
		);
		CREATE TABLE IF NOT EXISTS insurance_claims (
			id serial PRIMARY KEY,
			user_id uuid NOT NULL REFERENCES users(id),
			patient_id integer NOT NULL REFERENCES patients(id),
			invoice_id integer REFERENCES invoices(id),
			insurance_id integer NOT NULL REFERENCES insurance_providers(id),
			claim_number text NOT NULL,
			submission_date date NOT NULL,
			service_date date NOT NULL,
			claimed_amount numeric NOT NULL,
			approved_amount numeric,
			paid_amount numeric,
			status text NOT NULL,
			diagnosis_codes text,
			procedure_codes text,
			notes text,
			denial_reason text
		);
		CREATE TABLE IF NOT EXISTS vitals (
			id serial PRIMARY KEY,
			patient_id integer NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			record_date date NOT NULL,
			blood_pressure_systolic integer,
			blood_pressure_diastolic integer,
			pulse integer,
			temperature numeric,
			weight numeric,
			height numeric,
			bmi numeric,
			oxygen_saturation integer,
			respiratory_rate integer,
			notes text,
			recorded_by text NOT NULL,
			created_at timestamp DEFAULT now()
		);
		CREATE TABLE IF NOT EXISTS medications (
			id serial PRIMARY KEY,
			patient_id integer NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			name text NOT NULL,
			dosage text NOT NULL,
			frequency text NOT NULL,
			route text NOT NULL,
			prescribed_date date NOT NULL,
			prescribed_by text NOT NULL,
			start_date date,
			end_date date,
			status text NOT NULL DEFAULT 'active',
			instructions text,
			notes text,
			created_at timestamp DEFAULT now(),
			updated_at timestamp DEFAULT now()
		);
		CREATE TABLE IF NOT EXISTS lab_results (
			id serial PRIMARY KEY,
			patient_id integer NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			test_date date NOT NULL,
			test_name text NOT NULL,
			result text NOT NULL,
			unit text,
			reference_range text,
			status text NOT NULL,
			ordered_by text NOT NULL,
			performed_by text,
			notes text,
			created_at timestamp DEFAULT now()
		);
		CREATE TABLE IF NOT EXISTS allergies (
			id serial PRIMARY KEY,
			patient_id integer NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			allergen text NOT NULL,
			reaction text NOT NULL,
			severity text NOT NULL,
			notes text,
			recorded_date date NOT NULL,
			recorded_by text NOT NULL,
			created_at timestamp DEFAULT now()
		);
		CREATE TABLE IF NOT EXISTS conditions (
			id serial PRIMARY KEY,
			patient_id integer NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
			condition text NOT NULL,
			diagnosed_date date NOT NULL,
			status text NOT NULL DEFAULT 'active',
			diagnosed_by text NOT NULL,
			notes text,
			created_at timestamp DEFAULT now(),
			updated_at timestamp DEFAULT now()
		);
	`);
		console.log('✅ Database schema initialized successfully');
		return true;
	} catch (error) {
		console.error('❌ Schema initialization error:', error);
		return false;
	}
}

// Close pool connection gracefully
export async function closeConnection() {
	try {
		await pool.end();
		console.log('✅ Database connection closed');
	} catch (error) {
		console.error('❌ Error closing connection:', error);
	}
}


