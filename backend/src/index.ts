import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { db, ensureSchema, pool } from './db/client.js';
import {
	appointments,
	clinicalRecords,
	insuranceClaims,
	insuranceProviders,
	invoices,
	invoiceItems,
	patients,
	payments,
	users,
	vitals,
	medications,
	labResults,
	allergies,
	conditions
} from './db/schema.js';
import { eq, desc, and, like, ilike } from 'drizzle-orm';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const jwtSecret = process.env.JWT_SECRET;

// Validate required environment variables in production
if (!jwtSecret && process.env.NODE_ENV === 'production') {
	console.error('❌ JWT_SECRET environment variable is required in production');
	process.exit(1);
}

const finalJwtSecret = jwtSecret || 'dev_secret_only_for_local_development';

// Configure CORS from environment
const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:8080'];
const corsOptions = {
	origin: corsOrigins,
	credentials: false,
};

// Rate limiting
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5, // Limit each IP to 5 requests per windowMs
	message: 'Too many login attempts, please try again later',
	standardHeaders: true,
	legacyHeaders: false,
});

const apiLimiter = rateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 100, // Limit each IP to 100 requests per minute
	standardHeaders: true,
	legacyHeaders: false,
});

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(apiLimiter);

// Logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
	next();
});

// ---------- TYPE DEFINITIONS ----------
interface AuthPayload {
	id: string;
	email: string;
}

interface AuthRequest extends Request {
	user?: AuthPayload;
}

// ---------- VALIDATION SCHEMAS ----------
const signupSchema = z.object({
	fullName: z.string().min(2, 'Full name must be at least 2 characters'),
	email: z.string().email('Invalid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters')
		.regex(/[A-Z]/, 'Password must contain uppercase letter')
		.regex(/[0-9]/, 'Password must contain number'),
});

const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(1, 'Password is required'),
});

const patientSchema = z.object({
	fullName: z.string().min(1, 'Full name is required'),
	dob: z.string().date('Invalid date format'),
	gender: z.enum(['Male', 'Female', 'Other']),
	phone: z.string().min(1, 'Phone is required'),
	email: z.string().email('Invalid email'),
	address: z.string().min(1, 'Address is required'),
	mrn: z.string().optional(),
});

const appointmentSchema = z.object({
	patientId: z.number().min(1),
	date: z.string().date(),
	time: z.string().regex(/^\d{2}:\d{2}$/),
	type: z.string().min(1),
	provider: z.string().min(1),
	location: z.string().min(1),
	status: z.enum(['scheduled', 'completed', 'cancelled']),
	notes: z.string().optional(),
});

const clinicalRecordSchema = z.object({
	patientId: z.number().min(1),
	date: z.string().date(),
	type: z.string().min(1),
	title: z.string().min(1),
	content: z.string().min(1),
	provider: z.string().min(1),
});

const vitalsSchema = z.object({
	patientId: z.number().min(1),
	recordDate: z.string().date(),
	bloodPressureSystolic: z.number().optional(),
	bloodPressureDiastolic: z.number().optional(),
	pulse: z.number().optional(),
	temperature: z.number().optional(),
	weight: z.number().optional(),
	height: z.number().optional(),
	oxygenSaturation: z.number().optional(),
	respiratoryRate: z.number().optional(),
	notes: z.string().optional(),
	recordedBy: z.string().min(1),
});

const medicationSchema = z.object({
	patientId: z.number().min(1),
	name: z.string().min(1),
	dosage: z.string().min(1),
	frequency: z.string().min(1),
	route: z.string().min(1),
	prescribedDate: z.string().date(),
	prescribedBy: z.string().min(1),
	status: z.enum(['active', 'inactive']).optional(),
	instructions: z.string().optional(),
	notes: z.string().optional(),
});

const labResultSchema = z.object({
	patientId: z.number().min(1),
	testDate: z.string().date(),
	testName: z.string().min(1),
	result: z.string().min(1),
	unit: z.string().optional(),
	referenceRange: z.string().optional(),
	status: z.string().min(1),
	orderedBy: z.string().min(1),
	performedBy: z.string().optional(),
	notes: z.string().optional(),
});

const allergySchema = z.object({
	patientId: z.number().min(1),
	allergen: z.string().min(1),
	reaction: z.string().min(1),
	severity: z.enum(['mild', 'moderate', 'severe']),
	notes: z.string().optional(),
	recordedDate: z.string().date(),
	recordedBy: z.string().min(1),
});

const conditionSchema = z.object({
	patientId: z.number().min(1),
	condition: z.string().min(1),
	diagnosedDate: z.string().date(),
	status: z.enum(['active', 'inactive']).optional(),
	diagnosedBy: z.string().min(1),
	notes: z.string().optional(),
});

const invoiceSchema = z.object({
	patientId: z.number().min(1),
	appointmentId: z.number().optional(),
	invoiceDate: z.string().date(),
	dueDate: z.string().date(),
	subtotal: z.number().min(0),
	taxAmount: z.number().min(0),
	discountAmount: z.number().min(0),
	notes: z.string().optional(),
});

const paymentSchema = z.object({
	invoiceId: z.number().min(1),
	patientId: z.number().min(1),
	amount: z.number().min(0),
	paymentMethod: z.enum(['cash', 'credit_card', 'debit_card', 'check', 'transfer']),
	paymentDate: z.string().date(),
	transactionId: z.string().optional(),
	notes: z.string().optional(),
});

const insuranceClaimSchema = z.object({
	patientId: z.number().min(1),
	invoiceId: z.number().optional(),
	insuranceId: z.number().min(1),
	claimNumber: z.string().min(1),
	submissionDate: z.string().date(),
	serviceDate: z.string().date(),
	claimedAmount: z.number().min(0),
	status: z.enum(['submitted', 'approved', 'rejected', 'pending']),
	diagnosisCodes: z.string().optional(),
	procedureCodes: z.string().optional(),
	notes: z.string().optional(),
});

// ---------- HELPER FUNCTIONS ----------
function signToken(payload: AuthPayload): string {
	return jwt.sign(payload, finalJwtSecret, { expiresIn: '7d' });
}

function validateRequestBody<T>(schema: z.ZodSchema<T>, data: unknown): { valid: boolean; data?: T; error?: string } {
	const result = schema.safeParse(data);
	if (!result.success) {
		const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
		return { valid: false, error: errors };
	}
	return { valid: true, data: result.data };
}

// ---------- AUTHENTICATION MIDDLEWARE ----------
function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void | Response {
	const authHeader = req.headers.authorization;
	if (!authHeader?.startsWith('Bearer ')) {
		return res.status(401).json({ message: 'Unauthorized' });
	}

	const token = authHeader.slice('Bearer '.length);

	try {
		const decoded = jwt.verify(token, finalJwtSecret) as AuthPayload;
		req.user = decoded;
		next();
	} catch {
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
}

// ---------- ERROR HANDLER MIDDLEWARE ----------
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
	console.error('❌ Error:', err);
	
	if (err instanceof z.ZodError) {
		return res.status(400).json({ 
			message: 'Validation error',
			errors: err.errors 
		});
	}

	res.status(err.status || 500).json({
		message: process.env.NODE_ENV === 'production' 
			? 'Internal server error' 
			: err.message
	});
});

// ================== AUTH ROUTES ==================
app.post('/api/auth/signup', loginLimiter, async (req: Request, res: Response) => {
	try {
		const validation = validateRequestBody(signupSchema, req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const { fullName, email, password } = validation.data!;

		const existing = await db.select().from(users).where(eq(users.email, email));
		if (existing.length > 0) {
			return res.status(409).json({ message: 'Email already in use' });
		}

		const passwordHash = await bcrypt.hash(password, 10);

		const [created] = await db
			.insert(users)
			.values({ fullName, email, passwordHash })
			.returning();

		const token = signToken({ id: created.id, email: created.email });

		return res.status(201).json({
			user: {
				id: created.id,
				email: created.email,
				fullName: created.fullName,
			},
			token,
		});
	} catch (error) {
		console.error('Signup error:', error);
		return res.status(500).json({ message: 'Failed to create account' });
	}
});

app.post('/api/auth/login', loginLimiter, async (req: Request, res: Response) => {
	try {
		const validation = validateRequestBody(loginSchema, req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const { email, password } = validation.data!;

		const [userRow] = await db.select().from(users).where(eq(users.email, email));
		if (!userRow) {
			return res.status(401).json({ message: 'Invalid credentials' });
		}

		const ok = await bcrypt.compare(password, userRow.passwordHash);
		if (!ok) {
			return res.status(401).json({ message: 'Invalid credentials' });
		}

		const token = signToken({ id: userRow.id, email: userRow.email });

		return res.json({
			user: {
				id: userRow.id,
				email: userRow.email,
				fullName: userRow.fullName,
			},
			token,
		});
	} catch (error) {
		console.error('Login error:', error);
		return res.status(500).json({ message: 'Login failed' });
	}
});

app.put('/api/auth/user', authMiddleware, async (req: AuthRequest, res: Response) => {
	try {
		const userId = req.user?.id;
		if (!userId) {
			return res.status(401).json({ message: 'Unauthorized' });
		}

		const { fullName, email } = req.body;

		const [updated] = await db
			.update(users)
			.set({
				fullName: fullName || undefined,
				email: email || undefined,
			})
			.where(eq(users.id, userId))
			.returning();

		return res.json({
			user: {
				id: updated.id,
				email: updated.email,
				fullName: updated.fullName,
			},
		});
	} catch (error) {
		console.error('Update user error:', error);
		return res.status(500).json({ message: 'Failed to update user' });
	}
});

// ================== PATIENTS CRUD ==================
app.get('/api/patients', async (req: Request, res: Response) => {
	try {
		const page = Math.max(1, Number(req.query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
		const offset = (page - 1) * limit;

		const [rows, [{ count }]] = await Promise.all([
			db.select().from(patients).orderBy(desc(patients.id)).limit(limit).offset(offset),
			db.select({ count: patients.id }).from(patients),
		]);

		return res.json({
			data: rows,
			pagination: {
				page,
				limit,
				total: count,
				pages: Math.ceil(count / limit),
			},
		});
	} catch (error) {
		console.error('Fetch patients error:', error);
		return res.status(500).json({ message: 'Failed to fetch patients' });
	}
});

app.get('/api/patients/search', async (req: Request, res: Response) => {
	try {
		const query = req.query.q?.toString() || '';
		if (!query || query.length < 2) {
			return res.status(400).json({ message: 'Search query must be at least 2 characters' });
		}

		const rows = await db
			.select()
			.from(patients)
			.where(
				ilike(patients.fullName, `%${query}%`)
			)
			.limit(20);

		return res.json(rows);
	} catch (error) {
		console.error('Search patients error:', error);
		return res.status(500).json({ message: 'Search failed' });
	}
});

app.get('/api/patients/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const [patient] = await db.select().from(patients).where(eq(patients.id, id));
		
		if (!patient) {
			return res.status(404).json({ message: 'Patient not found' });
		}

		return res.json(patient);
	} catch (error) {
		console.error('Fetch patient error:', error);
		return res.status(500).json({ message: 'Failed to fetch patient' });
	}
});

app.post('/api/patients', async (req: Request, res: Response) => {
	try {
		const validation = validateRequestBody(patientSchema, req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		let { mrn, ...data } = validation.data!;

		if (!mrn) {
			const result = await pool.query(`SELECT nextval('patients_mrn_seq') as seq`);
			const seq = Number(result.rows?.[0]?.seq ?? 1);
			mrn = `MRN-${String(seq).padStart(6, '0')}`;
		}

		const [created] = await db
			.insert(patients)
			.values({
				...data,
				mrn,
			})
			.returning();

		return res.status(201).json(created);
	} catch (error) {
		console.error('Create patient error:', error);
		return res.status(500).json({ message: 'Failed to create patient' });
	}
});

app.put('/api/patients/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const validation = validateRequestBody(patientSchema.partial(), req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [updated] = await db
			.update(patients)
			.set(validation.data!)
			.where(eq(patients.id, id))
			.returning();

		if (!updated) {
			return res.status(404).json({ message: 'Patient not found' });
		}

		return res.json(updated);
	} catch (error) {
		console.error('Update patient error:', error);
		return res.status(500).json({ message: 'Failed to update patient' });
	}
});

app.delete('/api/patients/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const result = await db.delete(patients).where(eq(patients.id, id));
		
		return res.status(204).send();
	} catch (error) {
		console.error('Delete patient error:', error);
		return res.status(500).json({ message: 'Failed to delete patient' });
	}
});

// ================== APPOINTMENTS CRUD ==================
app.get('/api/appointments', async (req: Request, res: Response) => {
	try {
		const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
		const page = Math.max(1, Number(req.query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
		const offset = (page - 1) * limit;

		let query = db.select().from(appointments);
		if (patientId) {
			query = query.where(eq(appointments.patientId, patientId));
		}

		const rows = await query.orderBy(desc(appointments.date)).limit(limit).offset(offset);
		return res.json(rows);
	} catch (error) {
		console.error('Fetch appointments error:', error);
		return res.status(500).json({ message: 'Failed to fetch appointments' });
	}
});

app.get('/api/appointments/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
		
		if (!appointment) {
			return res.status(404).json({ message: 'Appointment not found' });
		}

		return res.json(appointment);
	} catch (error) {
		console.error('Fetch appointment error:', error);
		return res.status(500).json({ message: 'Failed to fetch appointment' });
	}
});

app.post('/api/appointments', async (req: Request, res: Response) => {
	try {
		const validation = validateRequestBody(appointmentSchema, req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const { patientId, date, time, type, provider, location, status } = validation.data!;

		const [patient] = await db.select().from(patients).where(eq(patients.id, patientId));
		if (!patient) {
			return res.status(404).json({ message: 'Patient not found' });
		}

		const [created] = await db
			.insert(appointments)
			.values({
				patientId,
				date,
				time,
				patientName: patient.fullName,
				mrn: patient.mrn,
				type,
				provider,
				location,
				status,
				phone: patient.phone,
			})
			.returning();

		return res.status(201).json(created);
	} catch (error) {
		console.error('Create appointment error:', error);
		return res.status(500).json({ message: 'Failed to create appointment' });
	}
});

app.put('/api/appointments/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const validation = validateRequestBody(appointmentSchema.partial(), req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [updated] = await db
			.update(appointments)
			.set(validation.data!)
			.where(eq(appointments.id, id))
			.returning();

		if (!updated) {
			return res.status(404).json({ message: 'Appointment not found' });
		}

		return res.json(updated);
	} catch (error) {
		console.error('Update appointment error:', error);
		return res.status(500).json({ message: 'Failed to update appointment' });
	}
});

app.delete('/api/appointments/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		await db.delete(appointments).where(eq(appointments.id, id));
		return res.status(204).send();
	} catch (error) {
		console.error('Delete appointment error:', error);
		return res.status(500).json({ message: 'Failed to delete appointment' });
	}
});

// ================== CLINICAL RECORDS CRUD ==================
app.get('/api/clinical-records', async (req: Request, res: Response) => {
	try {
		const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
		const page = Math.max(1, Number(req.query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
		const offset = (page - 1) * limit;

		let query = db.select().from(clinicalRecords);
		if (patientId) {
			query = query.where(eq(clinicalRecords.patientId, patientId));
		}

		const rows = await query.orderBy(desc(clinicalRecords.date)).limit(limit).offset(offset);
		return res.json(rows);
	} catch (error) {
		console.error('Fetch clinical records error:', error);
		return res.status(500).json({ message: 'Failed to fetch clinical records' });
	}
});

app.get('/api/clinical-records/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const [record] = await db.select().from(clinicalRecords).where(eq(clinicalRecords.id, id));
		
		if (!record) {
			return res.status(404).json({ message: 'Clinical record not found' });
		}

		return res.json(record);
	} catch (error) {
		console.error('Fetch clinical record error:', error);
		return res.status(500).json({ message: 'Failed to fetch clinical record' });
	}
});

app.post('/api/clinical-records', async (req: Request, res: Response) => {
	try {
		const validation = validateRequestBody(clinicalRecordSchema, req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [created] = await db
			.insert(clinicalRecords)
			.values(validation.data!)
			.returning();

		return res.status(201).json(created);
	} catch (error) {
		console.error('Create clinical record error:', error);
		return res.status(500).json({ message: 'Failed to create clinical record' });
	}
});

app.put('/api/clinical-records/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const validation = validateRequestBody(clinicalRecordSchema.partial(), req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [updated] = await db
			.update(clinicalRecords)
			.set(validation.data!)
			.where(eq(clinicalRecords.id, id))
			.returning();

		if (!updated) {
			return res.status(404).json({ message: 'Clinical record not found' });
		}

		return res.json(updated);
	} catch (error) {
		console.error('Update clinical record error:', error);
		return res.status(500).json({ message: 'Failed to update clinical record' });
	}
});

app.delete('/api/clinical-records/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		await db.delete(clinicalRecords).where(eq(clinicalRecords.id, id));
		return res.status(204).send();
	} catch (error) {
		console.error('Delete clinical record error:', error);
		return res.status(500).json({ message: 'Failed to delete clinical record' });
	}
});

// ================== VITALS CRUD ==================
app.get('/api/vitals', async (req: Request, res: Response) => {
	try {
		const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
		if (patientId) {
			const rows = await db.select().from(vitals).where(eq(vitals.patientId, patientId)).orderBy(desc(vitals.recordDate));
			return res.json(rows);
		}
		const rows = await db.select().from(vitals).orderBy(desc(vitals.recordDate)).limit(100);
		return res.json(rows);
	} catch (error) {
		console.error('Fetch vitals error:', error);
		return res.status(500).json({ message: 'Failed to fetch vitals' });
	}
});

app.post('/api/vitals', async (req: Request, res: Response) => {
	try {
		const validation = validateRequestBody(vitalsSchema, req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [created] = await db
			.insert(vitals)
			.values(validation.data!)
			.returning();

		return res.status(201).json(created);
	} catch (error) {
		console.error('Create vitals error:', error);
		return res.status(500).json({ message: 'Failed to record vitals' });
	}
});

app.put('/api/vitals/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const validation = validateRequestBody(vitalsSchema.partial(), req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [updated] = await db
			.update(vitals)
			.set(validation.data!)
			.where(eq(vitals.id, id))
			.returning();

		if (!updated) {
			return res.status(404).json({ message: 'Vital record not found' });
		}

		return res.json(updated);
	} catch (error) {
		console.error('Update vitals error:', error);
		return res.status(500).json({ message: 'Failed to update vitals' });
	}
});

app.delete('/api/vitals/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		await db.delete(vitals).where(eq(vitals.id, id));
		return res.status(204).send();
	} catch (error) {
		console.error('Delete vitals error:', error);
		return res.status(500).json({ message: 'Failed to delete vitals' });
	}
});

// ================== MEDICATIONS CRUD ==================
app.get('/api/medications', async (req: Request, res: Response) => {
	try {
		const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
		if (patientId) {
			const rows = await db.select().from(medications).where(eq(medications.patientId, patientId)).orderBy(desc(medications.prescribedDate));
			return res.json(rows);
		}
		const rows = await db.select().from(medications).orderBy(desc(medications.prescribedDate)).limit(100);
		return res.json(rows);
	} catch (error) {
		console.error('Fetch medications error:', error);
		return res.status(500).json({ message: 'Failed to fetch medications' });
	}
});

app.post('/api/medications', async (req: Request, res: Response) => {
	try {
		const validation = validateRequestBody(medicationSchema, req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [created] = await db
			.insert(medications)
			.values(validation.data!)
			.returning();

		return res.status(201).json(created);
	} catch (error) {
		console.error('Create medication error:', error);
		return res.status(500).json({ message: 'Failed to add medication' });
	}
});

app.put('/api/medications/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const validation = validateRequestBody(medicationSchema.partial(), req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [updated] = await db
			.update(medications)
			.set(validation.data!)
			.where(eq(medications.id, id))
			.returning();

		if (!updated) {
			return res.status(404).json({ message: 'Medication not found' });
		}

		return res.json(updated);
	} catch (error) {
		console.error('Update medication error:', error);
		return res.status(500).json({ message: 'Failed to update medication' });
	}
});

app.delete('/api/medications/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		await db.delete(medications).where(eq(medications.id, id));
		return res.status(204).send();
	} catch (error) {
		console.error('Delete medication error:', error);
		return res.status(500).json({ message: 'Failed to delete medication' });
	}
});

// ================== LAB RESULTS CRUD ==================
app.get('/api/lab-results', async (req: Request, res: Response) => {
	try {
		const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
		if (patientId) {
			const rows = await db.select().from(labResults).where(eq(labResults.patientId, patientId)).orderBy(desc(labResults.testDate));
			return res.json(rows);
		}
		const rows = await db.select().from(labResults).orderBy(desc(labResults.testDate)).limit(100);
		return res.json(rows);
	} catch (error) {
		console.error('Fetch lab results error:', error);
		return res.status(500).json({ message: 'Failed to fetch lab results' });
	}
});

app.post('/api/lab-results', async (req: Request, res: Response) => {
	try {
		const validation = validateRequestBody(labResultSchema, req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [created] = await db
			.insert(labResults)
			.values(validation.data!)
			.returning();

		return res.status(201).json(created);
	} catch (error) {
		console.error('Create lab result error:', error);
		return res.status(500).json({ message: 'Failed to add lab result' });
	}
});

app.put('/api/lab-results/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const validation = validateRequestBody(labResultSchema.partial(), req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [updated] = await db
			.update(labResults)
			.set(validation.data!)
			.where(eq(labResults.id, id))
			.returning();

		if (!updated) {
			return res.status(404).json({ message: 'Lab result not found' });
		}

		return res.json(updated);
	} catch (error) {
		console.error('Update lab result error:', error);
		return res.status(500).json({ message: 'Failed to update lab result' });
	}
});

app.delete('/api/lab-results/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		await db.delete(labResults).where(eq(labResults.id, id));
		return res.status(204).send();
	} catch (error) {
		console.error('Delete lab result error:', error);
		return res.status(500).json({ message: 'Failed to delete lab result' });
	}
});

// ================== ALLERGIES CRUD ==================
app.get('/api/allergies', async (req: Request, res: Response) => {
	try {
		const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
		if (patientId) {
			const rows = await db.select().from(allergies).where(eq(allergies.patientId, patientId));
			return res.json(rows);
		}
		const rows = await db.select().from(allergies).limit(100);
		return res.json(rows);
	} catch (error) {
		console.error('Fetch allergies error:', error);
		return res.status(500).json({ message: 'Failed to fetch allergies' });
	}
});

app.post('/api/allergies', async (req: Request, res: Response) => {
	try {
		const validation = validateRequestBody(allergySchema, req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [created] = await db
			.insert(allergies)
			.values(validation.data!)
			.returning();

		return res.status(201).json(created);
	} catch (error) {
		console.error('Create allergy error:', error);
		return res.status(500).json({ message: 'Failed to add allergy' });
	}
});

app.put('/api/allergies/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const validation = validateRequestBody(allergySchema.partial(), req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [updated] = await db
			.update(allergies)
			.set(validation.data!)
			.where(eq(allergies.id, id))
			.returning();

		if (!updated) {
			return res.status(404).json({ message: 'Allergy not found' });
		}

		return res.json(updated);
	} catch (error) {
		console.error('Update allergy error:', error);
		return res.status(500).json({ message: 'Failed to update allergy' });
	}
});

app.delete('/api/allergies/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		await db.delete(allergies).where(eq(allergies.id, id));
		return res.status(204).send();
	} catch (error) {
		console.error('Delete allergy error:', error);
		return res.status(500).json({ message: 'Failed to delete allergy' });
	}
});

// ================== CONDITIONS CRUD ==================
app.get('/api/conditions', async (req: Request, res: Response) => {
	try {
		const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
		if (patientId) {
			const rows = await db.select().from(conditions).where(eq(conditions.patientId, patientId));
			return res.json(rows);
		}
		const rows = await db.select().from(conditions).limit(100);
		return res.json(rows);
	} catch (error) {
		console.error('Fetch conditions error:', error);
		return res.status(500).json({ message: 'Failed to fetch conditions' });
	}
});

app.post('/api/conditions', async (req: Request, res: Response) => {
	try {
		const validation = validateRequestBody(conditionSchema, req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [created] = await db
			.insert(conditions)
			.values(validation.data!)
			.returning();

		return res.status(201).json(created);
	} catch (error) {
		console.error('Create condition error:', error);
		return res.status(500).json({ message: 'Failed to add condition' });
	}
});

app.put('/api/conditions/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const validation = validateRequestBody(conditionSchema.partial(), req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [updated] = await db
			.update(conditions)
			.set(validation.data!)
			.where(eq(conditions.id, id))
			.returning();

		if (!updated) {
			return res.status(404).json({ message: 'Condition not found' });
		}

		return res.json(updated);
	} catch (error) {
		console.error('Update condition error:', error);
		return res.status(500).json({ message: 'Failed to update condition' });
	}
});

app.delete('/api/conditions/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		await db.delete(conditions).where(eq(conditions.id, id));
		return res.status(204).send();
	} catch (error) {
		console.error('Delete condition error:', error);
		return res.status(500).json({ message: 'Failed to delete condition' });
	}
});

// ================== BILLING & INVOICES CRUD ==================
app.get('/api/invoices', async (req: Request, res: Response) => {
	try {
		const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
		const page = Math.max(1, Number(req.query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
		const offset = (page - 1) * limit;

		let query = db.select().from(invoices);
		if (patientId) {
			query = query.where(eq(invoices.patientId, patientId));
		}

		const rows = await query.orderBy(desc(invoices.invoiceDate)).limit(limit).offset(offset);
		return res.json(rows);
	} catch (error) {
		console.error('Fetch invoices error:', error);
		return res.status(500).json({ message: 'Failed to fetch invoices' });
	}
});

app.get('/api/invoices/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
		
		if (!invoice) {
			return res.status(404).json({ message: 'Invoice not found' });
		}

		const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
		return res.json({ ...invoice, items });
	} catch (error) {
		console.error('Fetch invoice error:', error);
		return res.status(500).json({ message: 'Failed to fetch invoice' });
	}
});

app.post('/api/invoices', async (req: Request, res: Response) => {
	try {
		const validation = validateRequestBody(invoiceSchema, req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const { patientId, appointmentId, invoiceDate, dueDate, subtotal, taxAmount, discountAmount, notes } = validation.data!;

		const totalAmount = subtotal + taxAmount - discountAmount;
		const invoiceNumber = `INV-${Date.now()}`;

		const [created] = await db
			.insert(invoices)
			.values({
				userId: '',
				patientId,
				appointmentId,
				invoiceNumber,
				invoiceDate,
				dueDate,
				subtotal,
				taxAmount,
				discountAmount,
				totalAmount,
				paidAmount: 0,
				balanceAmount: totalAmount,
				status: 'draft',
				notes,
			})
			.returning();

		return res.status(201).json(created);
	} catch (error) {
		console.error('Create invoice error:', error);
		return res.status(500).json({ message: 'Failed to create invoice' });
	}
});

app.put('/api/invoices/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const validation = validateRequestBody(invoiceSchema.partial(), req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [updated] = await db
			.update(invoices)
			.set(validation.data!)
			.where(eq(invoices.id, id))
			.returning();

		if (!updated) {
			return res.status(404).json({ message: 'Invoice not found' });
		}

		return res.json(updated);
	} catch (error) {
		console.error('Update invoice error:', error);
		return res.status(500).json({ message: 'Failed to update invoice' });
	}
});

app.delete('/api/invoices/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		await db.delete(invoices).where(eq(invoices.id, id));
		return res.status(204).send();
	} catch (error) {
		console.error('Delete invoice error:', error);
		return res.status(500).json({ message: 'Failed to delete invoice' });
	}
});

// ================== PAYMENTS CRUD ==================
app.get('/api/payments', async (req: Request, res: Response) => {
	try {
		const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
		const page = Math.max(1, Number(req.query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
		const offset = (page - 1) * limit;

		let query = db.select().from(payments);
		if (patientId) {
			query = query.where(eq(payments.patientId, patientId));
		}

		const rows = await query.orderBy(desc(payments.paymentDate)).limit(limit).offset(offset);
		return res.json(rows);
	} catch (error) {
		console.error('Fetch payments error:', error);
		return res.status(500).json({ message: 'Failed to fetch payments' });
	}
});

app.post('/api/payments', async (req: Request, res: Response) => {
	try {
		const validation = validateRequestBody(paymentSchema, req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const { invoiceId, patientId, amount, paymentMethod, paymentDate, transactionId, notes } = validation.data!;

		const [created] = await db
			.insert(payments)
			.values({
				invoiceId,
				patientId,
				amount,
				paymentMethod,
				paymentDate,
				transactionId,
				notes,
			})
			.returning();

		return res.status(201).json(created);
	} catch (error) {
		console.error('Create payment error:', error);
		return res.status(500).json({ message: 'Failed to record payment' });
	}
});

// ================== INSURANCE PROVIDERS & CLAIMS ==================
app.get('/api/insurance-providers', async (req: Request, res: Response) => {
	try {
		const rows = await db.select().from(insuranceProviders).orderBy(insuranceProviders.name);
		return res.json(rows);
	} catch (error) {
		console.error('Fetch insurance providers error:', error);
		return res.status(500).json({ message: 'Failed to fetch insurance providers' });
	}
});

app.get('/api/insurance-claims', async (req: Request, res: Response) => {
	try {
		const patientId = req.query.patientId ? Number(req.query.patientId) : undefined;
		const page = Math.max(1, Number(req.query.page) || 1);
		const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
		const offset = (page - 1) * limit;

		let query = db.select().from(insuranceClaims);
		if (patientId) {
			query = query.where(eq(insuranceClaims.patientId, patientId));
		}

		const rows = await query.orderBy(desc(insuranceClaims.submissionDate)).limit(limit).offset(offset);
		return res.json(rows);
	} catch (error) {
		console.error('Fetch insurance claims error:', error);
		return res.status(500).json({ message: 'Failed to fetch insurance claims' });
	}
});

app.post('/api/insurance-claims', async (req: Request, res: Response) => {
	try {
		const validation = validateRequestBody(insuranceClaimSchema, req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const { patientId, invoiceId, insuranceId, claimNumber, submissionDate, serviceDate, claimedAmount, status, diagnosisCodes, procedureCodes, notes } = validation.data!;

		const [created] = await db
			.insert(insuranceClaims)
			.values({
				userId: '',
				patientId,
				invoiceId,
				insuranceId,
				claimNumber,
				submissionDate,
				serviceDate,
				claimedAmount,
				status,
				diagnosisCodes,
				procedureCodes,
				notes,
			})
			.returning();

		return res.status(201).json(created);
	} catch (error) {
		console.error('Create insurance claim error:', error);
		return res.status(500).json({ message: 'Failed to create insurance claim' });
	}
});

app.put('/api/insurance-claims/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		const validation = validateRequestBody(insuranceClaimSchema.partial(), req.body);
		if (!validation.valid) {
			return res.status(400).json({ message: validation.error });
		}

		const [updated] = await db
			.update(insuranceClaims)
			.set(validation.data!)
			.where(eq(insuranceClaims.id, id))
			.returning();

		if (!updated) {
			return res.status(404).json({ message: 'Insurance claim not found' });
		}

		return res.json(updated);
	} catch (error) {
		console.error('Update insurance claim error:', error);
		return res.status(500).json({ message: 'Failed to update insurance claim' });
	}
});

app.delete('/api/insurance-claims/:id', async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);
		await db.delete(insuranceClaims).where(eq(insuranceClaims.id, id));
		return res.status(204).send();
	} catch (error) {
		console.error('Delete insurance claim error:', error);
		return res.status(500).json({ message: 'Failed to delete insurance claim' });
	}
});

// ================== HEALTH CHECK ==================
app.get('/api/health', async (_req: Request, res: Response) => {
	try {
		await pool.query('SELECT NOW()');
		return res.json({ ok: true, timestamp: new Date().toISOString() });
	} catch (error) {
		return res.status(503).json({ ok: false, message: 'Database unavailable' });
	}
});

// ================== START SERVER ==================
async function start() {
	await ensureSchema();
	app.listen(port, () => {
		console.log(`✅ API Server running at http://localhost:${port}`);
		console.log(`📊 Database: ${process.env.DATABASE_URL?.split('@')[1] || 'localhost'}`);
		console.log(`🔐 JWT Secret: ${jwtSecret ? '✓ configured' : '⚠️  using default'}`);
		console.log(`🛡️  Rate Limiting: ✓ enabled`);
		console.log(`📝 Validation: ✓ enabled`);
	});
}

start().catch((err) => {
	console.error('❌ Failed to start server:', err);
	process.exit(1);
});
