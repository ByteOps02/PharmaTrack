# MedFlow

MedFlow is a modern web application built with React, Vite, and Tailwind CSS, designed to streamline pharmaceutical inventory management. It integrates with Supabase for robust backend services, including authentication and database management.

## Features

-   **Dashboard:** Overview of key metrics and recent activities.
-   **Inventory Management:** Track products, batches, and suppliers.
-   **Order Management:** Handle purchase and sales orders.
-   **Quality Control:** Manage quality checks for products.
-   **User and Role Management:** Administer users and their permissions.
-   **Authentication:** Secure user login and registration powered by Supabase Auth.

## Technologies Used

-   **Frontend:** React, TypeScript, Vite, Tailwind CSS
-   **Backend/Database:** Supabase
-   **UI Components:** Shadcn/ui

## Installation

Follow these steps to set up MedFlow locally:

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd MedFlow
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set up Supabase

MedFlow uses Supabase for its backend. You'll need to set up a Supabase project and configure your environment variables.

#### a. Create a Supabase Project

1.  Go to [Supabase](https://supabase.com/) and create a new project.
2.  Note down your Project URL and `anon` public key from the Project Settings -> API section.

#### b. Configure Environment Variables

Create a `.env` file in the root of your project and add the following:

```
VITE_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
```

Replace `"YOUR_SUPABASE_PROJECT_URL"` and `"YOUR_SUPABASE_ANON_KEY"` with your actual Supabase project URL and public key.

#### c. Run Supabase Migrations (Optional, for local development)

If you are running Supabase locally, you can apply the schema from `supabase/migrations/20251114_PharmaTrack_schema.sql`.

```bash
# Ensure Supabase CLI is installed: npm install -g supabase-cli
supabase start
supabase db reset
```

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Project Structure

-   `src/`: Main application source code.
    -   `components/`: Reusable React components.
    -   `hooks/`: Custom React hooks.
    -   `integrations/supabase/`: Supabase client setup.
    -   `lib/`: Utility functions.
    -   `pages/`: Page-level components (routes).
-   `public/`: Static assets.
-   `supabase/`: Supabase configuration and migrations.

## Contributing

Feel free to contribute to MedFlow. Please ensure your code adheres to the project's coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License.
