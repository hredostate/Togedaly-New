<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Togedaly - Community Finance Platform

A comprehensive financial platform for cooperative savings, group investments, and community lending powered by AI coaching.

View your app in AI Studio: https://ai.studio/apps/drive/18CX2TgeDZyA-ExmPuC0fl6SEZcgh9zqz

## Features

- **Trust Pools (Ajo)**: Rotating savings and credit associations
- **Group Investments**: Collaborative investment ventures
- **Group Buying**: Bulk purchasing with better rates
- **Event Pooling**: Collect contributions for events (Owambe)
- **Waybill Logistics**: Secure interstate goods delivery
- **AI Financial Coach**: Personalized savings tips and nudges
- **KYC Verification**: Identity verification via SmileID/VerifyMe
- **Mobile Money**: Wallet management and Paystack integration
- **Admin Dashboard**: Comprehensive management tools

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (for database)
- Gemini API key (for AI features)
- Paystack account (for payments)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repository-url>
cd Togedaly-New
npm install
```

### 2. Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configure the following environment variables:

```env
# Gemini AI API Key (required for AI coach)
VITE_API_KEY=your_gemini_api_key_here

# OpenAI API Key (optional, for alternative AI features)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (required)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Paystack Configuration (required for payments)
# WARNING: In production, API calls should be made from a secure backend
# Never expose secret keys on the client side
VITE_PAYSTACK_SECRET_KEY=your_paystack_secret_key_here
```

### 3. Database Setup

#### Initialize Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Project Settings > API
3. Add them to your `.env` file

#### Run Migrations

Apply the database migrations in order:

```bash
# Using Supabase CLI (recommended)
supabase db push

# Or manually apply each migration in the Supabase SQL editor:
# 1. supabase/migrations/20231225_sms_otp_tables.sql
# 2. supabase/migrations/20231226_user_pins.sql
# 3. supabase/migrations/20231226_kyc_device_tables.sql
# 4. supabase/migrations/20231226_core_tables.sql
```

The migrations create:
- User authentication tables (OTP, PINs, KYC)
- Wallet and transaction tables
- Pool management tables (Ajo, Ventures, Group Buys)
- Membership and collateral tracking
- Admin and monitoring tables

### 4. Run the Application

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

## Key Integrations

### Authentication
- **Phone OTP**: Via KudiSMS (configurable in Admin panel)
- **PIN Verification**: Secure 4-digit PIN stored with SHA-256 hashing
- **Biometric**: WebAuthn for FaceID/TouchID (when available)

### KYC Verification
- **SmileID**: Recommended provider for BVN/NIN verification
- **VerifyMe**: Alternative provider
- Status tracking with admin approval workflow

### Payments
- **Paystack**: Card payments, bank transfers, virtual accounts
- **Wallet System**: Atomic credit/debit operations via Supabase functions
- **Split Payments**: Revenue sharing for group transactions

### AI Features
- **Gemini API**: Powers the AI financial coach
- **Personalized Nudges**: Savings tips based on user behavior
- **Smart Insights**: Spending analysis and recommendations

## Architecture

### Frontend
- React 19 with TypeScript
- Tailwind CSS for styling
- Framer Motion for animations
- SWR for data fetching and caching
- IndexedDB for offline support

### Backend
- Supabase (PostgreSQL database)
- Row Level Security (RLS) for data protection
- Stored procedures for atomic operations
- Real-time subscriptions

### Security
- JWT-based authentication
- RLS policies on all tables
- PIN hashing with SHA-256
- Admin-only endpoints restricted to @togedaly.com emails

## Project Structure

```
├── components/        # React components
├── pages/            # Page components
├── services/         # API service layers
├── lib/              # Utility libraries
├── supabase/         # Database migrations
├── types.ts          # TypeScript type definitions
└── App.tsx           # Main application component
```

## Development Notes

### Mock vs Real Mode

Many services operate in "mock mode" when API keys are not provided:
- Paystack: Falls back to mock transactions
- KYC: Auto-approves after 2 seconds
- PIN: Defaults to '1234' if not set in database

This allows development without all external services configured.

### Database Operations

All wallet operations use atomic Supabase functions:
```sql
SELECT credit_wallet(user_id, amount_kobo, 'description', 'reference');
SELECT debit_wallet(user_id, amount_kobo, 'description', 'reference');
```

### Row Level Security

Tables use RLS policies to ensure:
- Users can only access their own data
- Admins have extended permissions
- Service role for system operations

## Admin Features

Access the admin panel at `/admin` (requires @togedaly.com email):
- KYC approval workflow
- SMS configuration (KudiSMS)
- User management
- Transaction monitoring
- Pool oversight

## Deployment

### Build

```bash
npm run build
```

The `dist/` folder contains the production-ready static files.

### Environment Variables in Production

Ensure all required environment variables are set in your hosting platform:
- Vercel: Project Settings > Environment Variables
- Netlify: Site Settings > Build & Deploy > Environment
- AWS/GCP: Via secrets manager

**IMPORTANT**: Never commit `.env` files to version control.

## Testing

```bash
# Run tests (if configured)
npm test

# Lint code
npm run lint

# Type check
npm run type-check
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here]

## Support

For issues or questions:
- GitHub Issues: [repository-url]/issues
- Documentation: [docs-url]
- Email: support@togedaly.com
