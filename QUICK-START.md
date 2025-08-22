# Quick Start - Supabase Setup

> 🚀 **Get Flynn.ai running in 10 minutes**

## Step-by-Step Checklist

### ✅ 1. Create Supabase Project (5 minutes)
1. Go to [supabase.com](https://supabase.com) → "Start your project"
2. Sign up with GitHub or email
3. Click "New Project"
4. Fill in:
   - **Name**: `flynn-ai`
   - **Password**: `[Generate strong password - SAVE THIS!]`
   - **Region**: Choose closest to you
5. Wait ~2 minutes for setup

### ✅ 2. Get Database URL (1 minute)
1. In Supabase dashboard: **Settings** → **Database**
2. Copy the **URI** connection string
3. Should look like: `postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres`

### ✅ 3. Setup Environment (2 minutes)
1. Copy environment file:
   ```bash
   cp .env.example .env
   ```

2. Generate auth secret:
   ```bash
   openssl rand -base64 32
   ```

3. Edit `.env` file:
   ```env
   DATABASE_URL="[YOUR-SUPABASE-CONNECTION-STRING]"
   NEXTAUTH_SECRET="[YOUR-GENERATED-SECRET]"
   NEXTAUTH_URL="http://localhost:3000"
   ```

### ✅ 4. Install & Run (2 minutes)
```bash
# Install dependencies
npm install

# Setup database
npm run db:generate
npm run db:push

# Start the app
npm run dev
```

### ✅ 5. Test Everything
1. Visit [http://localhost:3000](http://localhost:3000)
2. Create account at `/auth/signup`
3. Test voice (Chrome/Edge): Click mic → "Show my appointments"
4. Check Supabase dashboard for new data

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Can't connect to database" | Check DATABASE_URL and Supabase project status |
| "JWT error" | Regenerate NEXTAUTH_SECRET |
| Voice not working | Use Chrome/Edge, allow microphone |
| "P1001 error" | Verify DATABASE_URL format is correct |

## What You Get

✨ **Working voice-first business management platform**
- Voice commands: "Schedule John for Tuesday at 2pm"
- Real-time dashboard with appointments, clients, invoices
- Mobile-responsive design
- Secure authentication
- Supabase database with automatic scaling

---

**Need more details?** See [SETUP-SUPABASE.md](./SETUP-SUPABASE.md) for complete instructions.