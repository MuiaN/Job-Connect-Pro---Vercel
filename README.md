# JobConnect Pro

Welcome to JobConnect Pro! This is a modern, full-stack web application designed to be the premier platform connecting talented job seekers with innovative companies. It facilitates direct communication, seamless interview scheduling, and intelligent job matching.

## ✨ Overview

JobConnect Pro is built with a modern tech stack, focusing on developer experience, performance, and scalability. It features a dual-dashboard system for both **Job Seekers** and **Companies**, providing tailored tools for each user type.

*   **For Job Seekers**: Build a professional profile, showcase skills and experience, browse jobs, and apply directly to companies.
*   **For Companies**: Create a company profile, post job listings, search for qualified candidates, and manage the hiring pipeline.

### Core Features

*   **Dual-Role System**: Separate, tailored dashboards for Job Seekers and Companies.
*   **AI-Powered Search**: Intelligent, natural language search for both jobs and candidates.
*   **Direct Messaging**: Integrated chat system for seamless communication.
*   **Interview Scheduling**: Companies can schedule and manage interviews directly on the platform.
*   **Comprehensive Profiles**: Rich profiles for both candidates (skills, experience, education) and companies (description, size, industry).
*   **Notification System**: Users receive timely notifications for key events:
    *   New job applications
    *   Application status updates
    *   New messages and interview invitations

## 🚀 Tech Stack

*   **Framework**: [Next.js](https://nextjs.org/) 13+ (with App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Database ORM**: [Prisma](https://www.prisma.io/)
*   **Database**: [PostgreSQL](https://www.postgresql.org/)
*   **Authentication**: [NextAuth.js](https://next-auth.js.org/) (with Google & Credentials providers)
*   **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)

## 🏁 Getting Started

Follow these steps to get your local development environment set up and running.

### Prerequisites

Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/en/) (v18.17 or later recommended)
*   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/)
*   [PostgreSQL](https://www.postgresql.org/download/) (See Database Setup section for details)

### 1. Clone the Repository

First, clone the project to your local machine.

```bash
git clone <your-repository-url>
cd Job-Connect-Pro
```

### 2. Install Dependencies

Install the project dependencies using your preferred package manager.

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Database Setup (PostgreSQL)

You need a running PostgreSQL database. You can either install it directly on your machine or use Docker.

#### Option A: Local PostgreSQL Installation (Recommended if Docker is an issue)

1.  **Install PostgreSQL**: Follow the official instructions for your operating system from the [PostgreSQL website](https://www.postgresql.org/download/).
2.  **Create a database and user**: Once installed, open the PostgreSQL terminal (`psql`) and run the following commands to create a user and a database for this project.

    ```sql
    -- Create a new user with a password (replace 'mypassword' with a secure password)
    CREATE USER myuser WITH PASSWORD 'mypassword';

    -- Create the database
    CREATE DATABASE jobconnectpro;

    -- Grant all privileges on the new database to the new user
    GRANT ALL PRIVILEGES ON DATABASE jobconnectpro TO myuser;
    ```

Your database is now ready to be connected to the application.

#### Option B: Using Docker

If you have Docker installed, you can start a PostgreSQL database with a single command from the project root.

```bash
# This will start a PostgreSQL container in the background
docker-compose up -d
```

### 4. Set Up Environment Variables

The application requires several environment variables to run. Create a new file named `.env` in the root of the project by copying the example file.

```bash
cp .env.example .env
```

Now, open the `.env` file and fill in the required values.

```env
# .env

# 1. Database Connection URL
# This URL tells Prisma how to connect to your PostgreSQL database.
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/jobconnectpro"

# 2. NextAuth.js Configuration
# A secret key for signing JWTs.
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# 3. Google OAuth Credentials
# Get these from the Google Cloud Console: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# 4. Cron Job Secret
# A secret key to secure the cron job endpoint that handles automatic job expiration.
CRON_SECRET="your-cron-secret-here"
```

**How to get Google OAuth Credentials:**
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2.  Create a new project or select an existing one.
3.  Go to **Credentials**, click **Create Credentials**, and select **OAuth client ID**.
4.  Choose **Web application** as the application type.
5.  Add `http://localhost:3000` to **Authorized JavaScript origins**.
6.  Add `http://localhost:3000/api/auth/callback/google` to **Authorized redirect URIs**.
7.  Click **Create**, and copy your Client ID and Client Secret into the `.env` file.

### 5. Run Database Migrations

With the database running and environment variables set, apply the database schema using Prisma. This command will create all the tables defined in `prisma/schema.prisma`.

```bash

npx prisma migrate dev --name init
```

For any updates on the schema.prisma file, run these commands to update the db nd generate a new Prisma Client

```bash
npx prisma db push
npx prisma generate
```

This will also generate the Prisma Client, which is used to interact with the database.

### 6. Run the Development Server

You're all set! Start the Next.js development server.

```bash
npm run dev
```

Open http://localhost:3000 in your browser to see the application.

## 📂 Project Structure

```
/
├── app/                # Next.js App Router: contains all pages and API routes
├── components/         # Shared React components (UI, Navigation, etc.)
├── lib/                # Helper functions, utilities, and core configurations (Prisma, Auth)
├── prisma/             # Prisma schema, migrations, and seed scripts
│   ├── migrations/     # Database migration history
│   └── schema.prisma   # The heart of your database schema
├── public/             # Static assets (images, fonts)
├── styles/             # Global CSS styles
└── types/              # TypeScript type definitions
```

## 📜 Available Scripts

*   `npm run dev`: Starts the development server.
*   `npm run build`: Creates a production-ready build.
*   `npm run start`: Starts the production server.
*   `npm run lint`: Lints the codebase for errors.
*   `npx prisma studio`: Opens a web-based GUI to view and edit your database.

```

### 2. New `.env.example`

This file serves as a template for the required environment variables, making it easier for new developers to get started.

```diff
--- /dev/null
# =================================================================
# == Environment Variables for JobConnect Pro
# =================================================================
#
# Copy this file to .env and fill in the values.

# 1. Database Connection URL
# This URL tells Prisma how to connect to your PostgreSQL database.
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/jobconnectpro"

# 2. NextAuth.js Configuration
NEXTAUTH_SECRET=
NEXTAUTH_URL="http://localhost:3000"

# 3. Google OAuth Credentials
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

CRON_SECRET=
```
