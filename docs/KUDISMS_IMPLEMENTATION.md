# KudiSMS Phone Authentication Implementation

This implementation provides phone number sign-up/sign-in functionality using KudiSMS for OTP verification.

## Features

### 1. OTP-based Phone Authentication
- Send OTP via KudiSMS V2 API
- Verify OTP with 10-minute expiry
- Nigerian phone number normalization (234XXXXXXXXXX format)
- Comprehensive error handling for all KudiSMS error codes

### 2. Admin Configuration Interface
- Configure KudiSMS API token and sender ID
- Test SMS functionality before saving
- Secure JWT-based authentication for admin access
- Visual feedback for configuration status

### 3. Security Features
- Row Level Security (RLS) policies on database tables
- Admin-only access to SMS configuration
- JWT token validation with domain checking (@togedaly.com)
- API tokens masked in responses
- Service role isolation for OTP operations

## Setup Instructions

### 1. Database Migration
Run the migration file to create required tables:
```bash
supabase migration apply supabase/migrations/20231225_sms_otp_tables.sql
```

### 2. Configure KudiSMS
1. Sign up for a KudiSMS account at https://my.kudisms.net
2. Get your API token from the KudiSMS dashboard
3. Register and get approval for your Sender ID
4. Navigate to Admin > System Internals > SMS Config
5. Enter your API token and Sender ID
6. Test with your phone number
7. Save configuration

## Architecture

### Components
- **`services/kudiSmsService.ts`** - Core OTP and SMS functionality
- **`app/api/auth/send-otp/route.ts`** - API endpoint to send OTP
- **`app/api/auth/verify-otp/route.ts`** - API endpoint to verify OTP
- **`app/api/admin/sms-config/route.ts`** - API endpoint to manage SMS config
- **`pages/AdminSmsConfig.tsx`** - Admin UI for SMS configuration
- **`pages/Auth.tsx`** - Updated authentication flow

### Database Tables
- **`sms_config`** - Stores KudiSMS API credentials (admin access only)
- **`otp_codes`** - Stores OTP codes with expiry (service role access only)

## Known Limitations

### 1. Service Role Client
The service functions use the regular Supabase client. In production with strict RLS, these should use a service role client in the API routes.

### 2. User Session Management
OTP verification validates the phone number but doesn't automatically create a user session. A complete implementation would use Supabase Admin API to generate session tokens.

### 3. Profiles Table Access
The verify-otp API route checks the `profiles` table. Ensure appropriate RLS policies or use service role client.

## API Reference

### Send OTP
```
POST /api/auth/send-otp
{ "phone": "+234 803 000 0000" }
```

### Verify OTP
```
POST /api/auth/verify-otp
{ "phone": "+234 803 000 0000", "code": "123456", "isSignUp": true }
```

### Admin SMS Config
```
GET /api/admin/sms-config
POST /api/admin/sms-config
```

## Error Codes

- `000` - Message Sent Successfully
- `100` - Invalid token
- `107` - Invalid phone number
- `109` - Insufficient balance
- `188` - Sender ID unapproved
- `300` - Missing parameters

## Security Considerations

1. OTPs expire after 10 minutes
2. One-time use (marked as verified)
3. Admin access restricted to @togedaly.com
4. API tokens masked in responses
5. HTTPS required in production
