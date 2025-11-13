# MedFlow - Medical Records Management System

A comprehensive medical records management system built with React, TypeScript, Vite, Express, and PostgreSQL.

## Overview

MedFlow is a full-stack healthcare application designed to manage patient records, appointments, clinical data, billing, insurance claims, and more. The system features a modern React frontend with Vite and a robust Express backend with PostgreSQL database.

## Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Query** - Data fetching and caching
- **React Router** - Routing
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Radix UI** - Component primitives
- **Chart.js & Recharts** - Data visualization

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin requests

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **PostgreSQL** - Database

## Project Structure

```
medflow/
├── frontend (Vite + React)
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── package.json
├── backend (Express)
│   ├── src/
│   │   ├── db/             # Database config & schema
│   │   └── index.ts        # Main server file
│   ├── drizzle/            # Migrations
│   ├── Dockerfile
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml
├── .env.local              # Frontend environment
└── backend/.env.local      # Backend environment
```

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (if running locally without Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd medflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

### Running with Docker (Recommended)

1. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

2. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Database: localhost:5432

### Running Locally

#### Start the Backend

```bash
cd backend
# Set up environment variables
cp .env.local .env.local  # Edit as needed

# Install and run
npm install
npm run dev
```

Backend runs on http://localhost:3001

#### Start the Frontend

```bash
# In the root directory
npm install
npm run dev
```

Frontend runs on http://localhost:5173

### Database Setup

The database schema is automatically created on the first backend startup. To run migrations:

```bash
cd backend
npm run drizzle:generate  # Generate new migrations
npm run drizzle:push     # Push migrations to database
npm run drizzle:studio   # Open Drizzle Studio for visual management
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `PUT /api/auth/user` - Update user profile

### Patients
- `GET /api/patients` - List all patients
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Clinical Records
- `GET /api/clinical-records` - List clinical records
- `POST /api/clinical-records` - Create record
- `PUT /api/clinical-records/:id` - Update record
- `DELETE /api/clinical-records/:id` - Delete record

### Vitals
- `GET /api/vitals` - List vital signs
- `POST /api/vitals` - Record vitals
- `PUT /api/vitals/:id` - Update vitals
- `DELETE /api/vitals/:id` - Delete vitals

### Medications
- `GET /api/medications` - List medications
- `POST /api/medications` - Add medication
- `PUT /api/medications/:id` - Update medication
- `DELETE /api/medications/:id` - Delete medication

### Lab Results
- `GET /api/lab-results` - List lab results
- `POST /api/lab-results` - Add lab result
- `PUT /api/lab-results/:id` - Update lab result
- `DELETE /api/lab-results/:id` - Delete lab result

### Allergies
- `GET /api/allergies` - List allergies
- `POST /api/allergies` - Add allergy
- `DELETE /api/allergies/:id` - Delete allergy

### Conditions
- `GET /api/conditions` - List conditions
- `POST /api/conditions` - Add condition
- `PUT /api/conditions/:id` - Update condition
- `DELETE /api/conditions/:id` - Delete condition

### Billing & Insurance
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment
- `GET /api/insurance-providers` - List insurance providers
- `GET /api/insurance-claims` - List insurance claims
- `POST /api/insurance-claims` - Create claim
- `PUT /api/insurance-claims/:id` - Update claim

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3001
VITE_ENV=development
```

### Backend (backend/.env.local)
```
DATABASE_URL=postgres://user:password@localhost:5432/medflow_db
NODE_ENV=development
PORT=3001
JWT_SECRET=your_secret_key_here
CORS_ORIGIN=http://localhost:5173,http://localhost:8080
```

## Features

- ✅ User authentication with JWT
- ✅ Patient management
- ✅ Appointment scheduling
- ✅ Clinical records management
- ✅ Vital signs tracking
- ✅ Medication management
- ✅ Lab results tracking
- ✅ Allergies and conditions management
- ✅ Billing and invoicing
- ✅ Insurance claims processing
- ✅ Analytics dashboard
- ✅ Responsive UI design
- ✅ Role-based access control (ready)

## Development

### Available Scripts

```bash
# Frontend
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Backend
npm run backend:dev      # Start backend in dev mode
npm run backend:build    # Build backend
npm run backend:start    # Start backend

# Docker
npm run docker:up        # Start all services
npm run docker:down      # Stop all services
npm run docker:build     # Rebuild Docker images
```

## Database Schema

The system uses PostgreSQL with 18 tables organized by functionality:

**Complete schema is available in**: `backend/drizzle/schema_complete.sql`

### Core Tables
- **users** - User accounts and authentication
- **patients** - Patient information
- **appointments** - Appointment records
- **clinical_records** - Clinical notes and records

### Medical Records
- **vitals** - Vital signs measurements
- **medications** - Medication prescriptions
- **lab_results** - Laboratory test results
- **allergies** - Patient allergies
- **conditions** - Chronic conditions

### Billing & Insurance
- **invoices** - Billing invoices
- **invoice_items** - Invoice line items
- **payments** - Payment records
- **insurance_providers** - Insurance company information
- **insurance_claims** - Insurance claim records

### Documents
- **documents** - File attachments and documents

All tables include proper relationships, indexes for performance, and cascade delete rules.

## Security Considerations

- Passwords are hashed using bcryptjs
- JWT tokens expire after 7 days
- CORS is configured for specific origins
- Database credentials should be changed in production
- Use environment variables for sensitive data
- Enable HTTPS in production

## Testing

Currently no automated tests are configured. To add:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

## Troubleshooting

### Database connection refused
- Ensure PostgreSQL is running
- Check `DATABASE_URL` environment variable
- For Docker: ensure `postgres` service is healthy

### Frontend can't reach backend
- Check `VITE_API_URL` environment variable
- Ensure backend is running on port 3001
- Check CORS settings in backend

### Port already in use
- Frontend: `PORT=5174 npm run dev`
- Backend: `PORT=3002 npm start`

## Contributing

1. Create a feature branch
2. Commit changes
3. Push to the branch
4. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository.
