# Flynn.ai - Voice-First Business Management Platform

Flynn.ai is a voice-first business management platform designed specifically for small service businesses like plumbers, cleaners, and trades professionals. Manage your business operations through natural voice commands.

## Features

- 🤖 **AI-Powered Voice**: Natural conversation with OpenAI integration - "Book John tomorrow around 2-ish"
- 🎤 **Smart Voice Interface**: Understands flexible, conversational commands
- 📅 **Intelligent Scheduling**: Voice-controlled appointment management with natural language
- 👥 **Client Management**: Add and manage clients through voice commands
- 💰 **Voice Invoicing**: Create invoices with natural speech - "Invoice Mike for 150 bucks"
- 📱 **Mobile-First**: Floating voice button perfect for field workers
- 🔄 **Smart Fallback**: Works even when AI is unavailable
- 🔒 **Secure**: Built-in authentication and data protection

## Voice Commands

**Natural Language (with OpenAI):**
- "Book John tomorrow around 2-ish"
- "Invoice Mike for 150 bucks for the sink repair" 
- "What do I have going on this week?"
- "Hey Flynn, schedule Sarah for next Tuesday afternoon"
- "Add Tom Wilson with phone 555-1234"

**Basic Commands (always work):**
- "Schedule [client] for [day] at [time]"
- "Show my appointments for [day]"
- "Create invoice for [client] for $[amount]"
- "Add new client [name]"
- "Show my clients"

## Quick Start

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase database:**
   ```bash
   # Copy environment variables
   cp .env.example .env
   
   # Follow the detailed Supabase setup guide
   # See SETUP-SUPABASE.md for complete instructions
   ```

3. **Configure your .env file:**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Get your DATABASE_URL from Supabase Settings → Database
   - Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
   - Update .env with your actual values

4. **Setup OpenAI for intelligent voice (optional but recommended):**
   ```bash
   # Get API key from https://platform.openai.com/api-keys
   # Add to .env file: OPENAI_API_KEY="sk-your-key-here"
   ```

5. **Initialize database:**
   ```bash
   # Generate Prisma client and push schema to Supabase
   npm run db:generate
   npm run db:push
   npm run db:seed  # Add sample data for testing
   ```

6. **Start the development server:**
   ```bash
   npm run dev
   ```

7. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

> 📚 **Need help?** 
> - Database: See [SETUP-SUPABASE.md](./SETUP-SUPABASE.md) 
> - AI Voice: See [OPENAI-SETUP.md](./OPENAI-SETUP.md)

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Voice**: Web Speech API (Speech Recognition + Text-to-Speech)
- **Database**: Supabase (PostgreSQL) with Prisma ORM
- **Authentication**: NextAuth.js
- **UI**: Responsive design optimized for voice interaction

## Browser Compatibility

For best voice experience, use:
- Chrome (recommended)
- Edge
- Safari (limited voice features)

## Environment Variables

```env
# Get from Supabase: Settings → Database → Connection string
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-generated-secret-here"

# Development URL
NEXTAUTH_URL="http://localhost:3000"
```

See [SETUP-SUPABASE.md](./SETUP-SUPABASE.md) for detailed configuration instructions.

## Project Structure

```
flynn/
├── app/                 # Next.js App Router
├── components/         # React components
│   ├── voice/         # Voice interface components
│   ├── dashboard/     # Dashboard components
│   └── auth/          # Authentication components
├── lib/               # Utility libraries
├── prisma/            # Database schema
└── types/             # TypeScript type definitions
```

## Getting Started with Voice

1. Click the microphone button or say "Hey Flynn"
2. Wait for the "Listening..." indicator
3. Speak your command clearly
4. Flynn will respond with voice feedback and take action

## Development

```bash
# Run development server
npm run dev

# Generate Prisma client
npm run db:generate

# Push database changes
npm run db:push

# Open Prisma Studio
npm run db:studio
```

## Contributing

This is a starter template for voice-first business management. Customize it for your specific business needs.

## License

MIT License - Feel free to use this for your business!