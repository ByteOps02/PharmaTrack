# MedFlow - Healthcare Management System

A modern, full-stack healthcare management system built with React, TypeScript, and Node.js. MedFlow provides comprehensive tools for patient management, medical records, appointments, billing, and insurance claims processing.

## Features

- **Patient Management**: Create, view, and manage patient records with comprehensive medical history
- **Appointments**: Schedule and manage patient appointments with real-time status updates
- **Medical Records**: Store and retrieve clinical records, vitals, lab results, medications, and allergies
- **Billing & Invoicing**: Generate invoices, track payments, and manage billing records
- **Insurance Claims**: Submit and track insurance claims with status management
- **Authentication**: Secure JWT-based authentication system
- **Responsive UI**: Modern, responsive design built with React and Tailwind CSS
- **Database**: Robust PostgreSQL database with Drizzle ORM

## Project Structure

```
MedFlow/
├── vite-project/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # Utility functions
│   │   ├── App.tsx            # Main App component
│   │   └── main.tsx           # Entry point
│   ├── index.html             # HTML template
│   └── package.json           # Frontend dependencies
│
└── backend/                   # Backend (Express + Node.js)
    ├── src/
    │   ├── index.ts           # Server entry point
    │   ├── db/
    │   │   ├── schema.ts      # Database schema
    │   │   └── client.ts      # Database client
    │   └── [routes]           # API route handlers
    ├── package.json           # Backend dependencies
    └── tsconfig.json          # TypeScript configuration
```

## Prerequisites

- **Node.js**: v18 or higher
- **npm** or **yarn**: Package manager
- **PostgreSQL**: v12 or higher
- **Git**: Version control

## Getting Started

### Prerequisites Setup

**1. Install PostgreSQL**
- Download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
- Note the username, password, and port (default: 5432)
- Verify installation: `psql --version`

**2. Install Node.js**
- Download and install Node.js v18+ from [nodejs.org](https://nodejs.org/)
- Verify installation: `node --version` and `npm --version`

**3. Clone the Repository**

```bash
git clone https://github.com/ByteOps02/MedFlow.git
cd MedFlow/vite-project
```

## How to Run the Project

### Step 1: Setup Database

```bash
# Open PostgreSQL command line
psql -U postgres

# Create database and user
CREATE DATABASE medflow_db;
CREATE USER medflow_user WITH PASSWORD 'medflow_secure_password';
ALTER ROLE medflow_user SET client_encoding TO 'utf8';
ALTER ROLE medflow_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE medflow_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE medflow_db TO medflow_user;

# Type \q to exit psql
\q
```

### Step 2: Setup Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file and set your database connection
# (Use your PostgreSQL credentials)
# Example:
# DATABASE_URL=postgres://medflow_user:medflow_secure_password@localhost:5432/medflow_db
# JWT_SECRET=your_secure_key_here_change_in_production
```

**Push database schema:**
```bash
# Generate and apply database migrations
npm run db:push
```

**Start backend server:**
```bash
npm run dev
```

✅ Backend running at: `http://localhost:3001`

### Step 3: Setup Frontend (in new terminal)

```bash
# Navigate back to project root
cd ..

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server
npm run dev
```

✅ Frontend running at: `http://localhost:5173`

### Step 4: Access the Application

1. Open your browser and go to: `http://localhost:5173`
2. Create an account or log in
3. Start managing patients and appointments!

### Quick Start Script (Windows PowerShell)

Create a `start.ps1` file in project root:

```powershell
# Start Backend
Write-Host "Starting Backend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command cd backend; npm run dev"

# Wait for backend to start
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "Starting Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command npm run dev"

Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
```

Run with: `.\start.ps1`

### Quick Start Script (Linux/Mac)

Create a `start.sh` file in project root:

```bash
#!/bin/bash

# Start Backend
echo "Starting Backend..."
cd backend
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start Frontend
cd ..
echo "Starting Frontend..."
npm run dev &
FRONTEND_PID=$!

echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:5173"

# Keep processes running
wait
```

Run with: `chmod +x start.sh && ./start.sh`

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3001
```

### Backend (.env)
```
DATABASE_URL=postgres://medflow_user:medflow_secure_password@localhost:5432/medflow_db
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=http://localhost:5173,http://localhost:8080
```

### Important Security Notes
- **Never commit `.env` files to version control**
- Change `JWT_SECRET` to a strong random string in production
- Use strong, unique database password
- Set `NODE_ENV=production` when deploying
- Update `CORS_ORIGIN` for your production domain

## Troubleshooting Initial Setup

### PostgreSQL Connection Issues
```bash
# Test PostgreSQL connection
psql -U medflow_user -d medflow_db -h localhost

# If connection fails:
# 1. Ensure PostgreSQL is running: sudo service postgresql status (Linux)
# 2. Check if user exists: psql -U postgres -c "\du"
# 3. Verify database: psql -U postgres -c "\l"
```

### Backend Won't Start
```bash
# Check if port 3001 is in use
# Windows: netstat -ano | findstr :3001
# Linux: lsof -i :3001
# Mac: lsof -i :3001

# If port is in use, either:
# - Stop the process using the port
# - Change PORT in .env file
```

### Frontend Won't Start
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Database Schema Not Applied
```bash
cd backend

# Regenerate migrations
npm run db:generate

# Push to database
npm run db:push

# View database in studio
npm run db:studio
```

## Available Scripts

### Frontend
- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start development server with watch mode
- `npm run build` - Compile TypeScript
- `npm start` - Run compiled JavaScript
- `npm run db:generate` - Generate database migrations
- `npm run db:push` - Apply migrations to database
- `npm run db:studio` - Open Drizzle Studio

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `PUT /api/auth/user` - Update user profile

### Patients
- `GET /api/patients` - List all patients
- `GET /api/patients/:id` - Get patient details
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient
- `GET /api/patients/search?q=name` - Search patients

### Appointments
- `GET /api/appointments` - List appointments
- `GET /api/appointments/:id` - Get appointment details
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Clinical Records & Medical Data
- `GET /api/clinical-records` - List clinical records
- `POST /api/clinical-records` - Create clinical record
- `GET /api/vitals` - Get patient vitals
- `POST /api/vitals` - Record vitals
- `GET /api/medications` - List medications
- `POST /api/medications` - Add medication
- `GET /api/lab-results` - Get lab results
- `POST /api/lab-results` - Add lab result
- `GET /api/allergies` - Get allergies
- `POST /api/allergies` - Add allergy
- `GET /api/conditions` - Get conditions
- `POST /api/conditions` - Add condition

### Billing & Insurance
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/payments` - List payments
- `POST /api/payments` - Record payment
- `GET /api/insurance-claims` - List claims
- `POST /api/insurance-claims` - Submit claim
- `GET /api/insurance-providers` - List insurance providers

## Technology Stack

### Frontend
- **React 19**: Modern UI library
- **Vite**: Fast build tool
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **React Query**: Server state management
- **React Hook Form**: Form state management
- **Zod**: TypeScript-first schema validation
- **Shadcn/ui**: Component library
- **Lucide React**: Icon library

### Backend
- **Express.js**: Web framework
- **Node.js**: Runtime environment
- **TypeScript**: Type-safe backend
- **PostgreSQL**: Relational database
- **Drizzle ORM**: Type-safe ORM
- **JWT**: Authentication
- **Zod**: Schema validation
- **bcryptjs**: Password hashing
- **express-rate-limit**: Rate limiting

## Development

### Code Style
- ESLint configuration for consistent code style
- TypeScript strict mode enabled
- Unused variables/parameters detection enabled

### Authentication Flow
1. User registers or logs in
2. Backend validates credentials and generates JWT token
3. Token stored in localStorage
4. Token sent with each request in Authorization header
5. Protected routes verify token and redirect to login if invalid

## Deployment

### Docker

```bash
# Build Docker image
docker build -t medflow-backend ./backend

# Run Docker container
docker run -e DATABASE_URL=... -p 3001:3001 medflow-backend
```

### Environment Setup for Production
- Set `NODE_ENV=production`
- Configure strong `JWT_SECRET`
- Use production database URL
- Set proper CORS origins
- Enable HTTPS in frontend

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify DATABASE_URL in .env
- Check user permissions

### API Connection Issues
- Verify backend is running on port 3001
- Check VITE_API_URL in frontend .env
- Verify CORS settings

### Authentication Issues
- Clear browser localStorage
- Verify JWT_SECRET is set
- Check token expiration time

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit changes (`git commit -m 'Add AmazingFeature'`)
3. Push to branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## License

This project is private and proprietary to ByteOps02.

## Support

For issues and questions:
- Open an issue on GitHub
- Contact the development team
