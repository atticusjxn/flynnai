# Supabase Setup Guide for Flynn.ai

This guide will walk you through setting up Supabase as your database for Flynn.ai.

## Step 1: Create Supabase Project

1. **Visit Supabase**
   - Go to [supabase.com](https://supabase.com)
   - Click "Start your project" or "Sign In"

2. **Sign Up/Login**
   - Use GitHub (recommended) or email
   - Verify your email if needed

3. **Create New Project**
   - Click "New Project"
   - Choose or create an organization
   - Fill in project details:
     - **Name**: `flynn-ai` (or your preferred name)
     - **Database Password**: Generate a strong password (SAVE THIS!)
     - **Region**: Choose closest to your location
     - **Pricing**: Free tier is perfect for development

4. **Wait for Setup**
   - Project creation takes ~2 minutes
   - You'll see a progress indicator

## Step 2: Get Your Database Connection

1. **Navigate to Database Settings**
   - In your Supabase dashboard, go to **Settings** (gear icon in sidebar)
   - Click **Database**

2. **Find Connection String**
   - Scroll down to **Connection string** section
   - Copy the **URI** format (not the other formats)
   - It looks like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.abcdefghijklmnop.supabase.co:5432/postgres
     ```

3. **Note Your Details**
   - **Project Reference**: The part after `db.` and before `.supabase.co`
   - **Password**: The password you set when creating the project

## Step 3: Configure Environment Variables

1. **Copy Environment File**
   ```bash
   cp .env.example .env
   ```

2. **Edit .env File**
   Open `.env` and update:

   ```env
   # Replace with your actual Supabase connection string
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

   # Generate a secure secret (see below)
   NEXTAUTH_SECRET="your-generated-secret-here"

   # Keep as is for development
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Generate NextAuth Secret**
   Run one of these commands:

   ```bash
   # Option 1: Using OpenSSL (recommended)
   openssl rand -base64 32

   # Option 2: Using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

   # Option 3: Online generator
   # Visit: https://generate-secret.vercel.app/32
   ```

   Copy the output and paste it as your `NEXTAUTH_SECRET`.

## Step 4: Install and Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Generate Prisma Client**
   ```bash
   npm run db:generate
   ```

3. **Create Database Tables**
   ```bash
   npm run db:push
   ```
   
   This command will:
   - Connect to your Supabase database
   - Create all necessary tables (users, clients, appointments, invoices)
   - Set up the schema defined in `prisma/schema.prisma`

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Step 5: Verify Setup

1. **Check Your App**
   - Visit [http://localhost:3000](http://localhost:3000)
   - You should see the Flynn.ai homepage

2. **Check Supabase Dashboard**
   - Go back to your Supabase project
   - Click **Table Editor** in the sidebar
   - You should see tables: `users`, `clients`, `appointments`, `invoices`, `invoice_items`

3. **Test User Registration**
   - Visit [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup)
   - Create a test account
   - Check the `users` table in Supabase to see your new user

4. **Test Voice Interface**
   - Use Chrome or Edge browser (best voice support)
   - Grant microphone permissions when prompted
   - Click the microphone button and try: "Show my appointments"

## Common Issues & Solutions

### Database Connection Errors
- **Issue**: `Cannot connect to database`
- **Solution**: 
  - Double-check your DATABASE_URL
  - Ensure the password is correct
  - Verify your Supabase project is running (green status in dashboard)

### NextAuth Errors
- **Issue**: `[next-auth][error][JWT_SESSION_ERROR]`
- **Solution**: Regenerate your NEXTAUTH_SECRET

### Voice Not Working
- **Issue**: Microphone button doesn't respond
- **Solution**: 
  - Use Chrome or Edge browser
  - Allow microphone permissions
  - Ensure you're on `https://` or `localhost`

### Prisma Push Fails
- **Issue**: `Error: P1001: Can't reach database server`
- **Solution**:
  - Check DATABASE_URL format
  - Ensure Supabase project is active
  - Try again after a few minutes

## Next Steps

Once everything is working:

1. **Explore Supabase Features**
   - **Table Editor**: Visual database management
   - **SQL Editor**: Run custom queries
   - **Auth**: Optional replacement for NextAuth
   - **Storage**: File uploads for invoices
   - **Realtime**: Live updates

2. **Production Deployment**
   - Update NEXTAUTH_URL to your production domain
   - Consider upgrading to Supabase Pro for backups
   - Enable Row Level Security (RLS) for enhanced security

3. **Monitor Usage**
   - Check Supabase dashboard for usage stats
   - Free tier includes 500MB database and 2GB bandwidth
   - Upgrade when needed

## Support

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Flynn.ai Issues**: Check the main README.md
- **Community**: Supabase Discord or GitHub discussions