# 📞 Flynn.ai - AI-Powered Call-to-Job Scheduler

> **Never miss an appointment from a phone call again**

Flynn.ai transforms customer calls into organized jobs in your scheduler automatically. AI processes calls in real-time, extracts appointment details, and delivers them via email and/or in-app notifications within 2 minutes.

![Flynn.ai Hero](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Flynn.ai+Demo)

## ✨ Key Features

- **🤖 AI Call Processing**: Whisper + GPT-4 extract appointment details from any call
- **📅 Job Scheduler**: Drag-and-drop pipeline management (Quoting → Confirmed → In Progress → Completed)
- **📧 Flexible Delivery**: Choose email summaries, in-app notifications, or both
- **📱 Universal Phone Integration**: Works with Twilio, RingCentral, or call forwarding
- **💰 Simple Pricing**: $15/month with first month FREE
- **🏢 Multi-Industry**: Perfect for plumbing, HVAC, cleaning, contracting, healthcare, and more

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- API keys for integrations (see setup below)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/atticusjxn/flynnai.git
   cd flynnai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual API keys and database URL
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3001` to see your Flynn.ai landing page!

## 🔧 Environment Setup

### Required API Keys

1. **OpenAI API** (for call processing)
   - Visit: https://platform.openai.com/api-keys
   - Add to `.env.local`: `OPENAI_API_KEY="sk-your-key"`

2. **Stripe** (for payments)
   - Visit: https://dashboard.stripe.com/apikeys
   - Add keys and webhook secret to `.env.local`

3. **Resend** (for email delivery)
   - Visit: https://resend.com/api-keys
   - Add to `.env.local`: `RESEND_API_KEY="re-your-key"`

4. **Twilio** (for phone integration)
   - Visit: https://console.twilio.com/
   - Add account SID and auth token to `.env.local`

5. **Database**
   - Set up PostgreSQL locally or use a hosted service
   - Add connection string to `.env.local`

### NextAuth Secret

Generate a secure secret for JWT tokens:
```bash
openssl rand -base64 32
```

## 📋 Project Structure

```
flynnai/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API routes
│   │   ├── phone/webhook/        # Twilio webhook handler
│   │   ├── stripe/               # Payment processing
│   │   └── ...
│   ├── onboarding/               # Multi-step onboarding flow
│   └── page.tsx                  # Landing page
├── components/
│   ├── landing/                  # Landing page components
│   │   ├── HeroSection.tsx       # Hero with animated demo
│   │   ├── PricingSection.tsx    # $15/month pricing
│   │   └── ...
│   ├── onboarding/               # Onboarding wizard
│   └── scheduler/                # Job management (upcoming)
├── lib/
│   ├── call-processing/          # AI call processing pipeline
│   │   ├── transcription.ts     # Whisper API integration
│   │   ├── appointmentExtractor.ts # GPT-4 data extraction
│   │   └── emailDelivery.ts      # Email + calendar file generation
│   ├── stripe.ts                 # Payment integration
│   └── prisma.ts                 # Database client
└── prisma/
    └── schema.prisma             # Database schema
```

## 🎯 Core User Flow

1. **Customer calls** your business phone
2. **AI processes** the call in real-time
3. **Appointment details** are extracted (name, date, service, etc.)
4. **Job appears** in your scheduler pipeline
5. **Email sent** with call summary and calendar file
6. **You manage** the job through completion

## 🔄 Job Pipeline Stages

- **Quoting** - New leads requiring estimates
- **Confirmed** - Accepted jobs, scheduled
- **In Progress** - Currently working on
- **Completed** - Finished jobs

## 📊 Database Schema

Key models:
- `User` - Business owners with subscription info
- `Job` - Extracted appointments with pipeline status
- `CallRecord` - Call transcriptions and processing results
- `PhoneIntegration` - Connected phone systems

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

### Manual Deployment

```bash
npm run build
npm start
```

## 🛠️ Development

### Database Changes

```bash
# After modifying schema.prisma
npx prisma generate
npx prisma db push
```

### Testing Call Processing

1. Set up Twilio webhook: `https://yourdomain.com/api/phone/webhook`
2. Configure call forwarding to your Twilio number
3. Make a test call with appointment details
4. Check processing results in database

## 🔒 Security & Compliance

- **SOC 2 Type II** compliant infrastructure
- **State-by-state** call recording compliance
- **Automatic PII** redaction in transcriptions
- **GDPR/CCPA** compliant data handling
- **End-to-end encryption** for all data

## 💡 Business Model

- **Free Trial**: First month completely free
- **Monthly Plan**: $15/month, unlimited calls
- **Enterprise**: Custom pricing for teams

## 📈 Metrics & Analytics

Track key business metrics:
- Calls processed
- Jobs converted
- Pipeline velocity
- Customer satisfaction

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the setup guides in `/docs`
- **Issues**: Report bugs on GitHub Issues
- **Email**: support@flynn.ai
- **Phone**: +1 (555) FLYNN-AI

## 🎯 Roadmap

- [ ] Mobile app for field workers
- [ ] Advanced analytics dashboard
- [ ] CRM integrations (HubSpot, Salesforce)
- [ ] Multi-language support
- [ ] Team collaboration features
- [ ] Advanced automation rules

---

**Built with:** Next.js 14, TypeScript, Tailwind CSS, Prisma, PostgreSQL, OpenAI, Stripe, Twilio, Resend

**Made with ❤️ for service professionals who never want to miss an opportunity**