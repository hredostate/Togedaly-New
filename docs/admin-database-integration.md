# Admin Panel Database Integration

This document describes the transformation of the admin panel from mock/in-memory data to fully functional CRUD operations with real Supabase database integration.

## Overview

The admin panel (`pages/Admin.tsx`) has been updated to use real database operations instead of mock data. All services in the admin workflow now interact with Supabase tables.

## What Was Changed

### 1. Database Schema (`supabase/migrations/20241225_admin_tables.sql`)

A comprehensive migration file was created that sets up all necessary tables:

#### Core Tables
- **profiles** - User profiles with roles (admin, manager, support, member)
- **kyc_documents** - KYC verification queue
- **risk_events** - Risk monitoring and fraud alerts
- **admin_action_requests** - Maker-checker approval workflow
- **pool_treasury_policies** - Pool treasury management
- **incoming_transfers** - Payment routing and reconciliation
- **audit_logs** - Complete audit trail

#### Billing Tables
- **billing_plans** - Membership tier definitions
- **org_subscriptions** - Organization subscriptions
- **promo_codes** - Promotional codes
- **org_credits** - Credit ledger

#### Security Features
- Row Level Security (RLS) enabled on all tables
- Admin-only access policies for sensitive operations
- User-specific policies for viewing own data
- Service role policies for system operations

#### Performance Optimizations
- Indexes on frequently queried columns
- Foreign key indexes
- Timestamp indexes for audit trails

### 2. Service Layer Rewrites

#### `services/auditService.ts`
**Before:**
- Used in-memory array for audit logs
- Mock delays with `setTimeout`

**After:**
- Stores logs in `audit_logs` table
- Real-time database queries
- Proper error handling

**Functions:**
```typescript
logAdminAction(actor, action, target, meta)  // Insert audit log
fetchAuditLogs(filters?)                      // Query audit logs
```

#### `services/adminService.ts`
**Before:**
- All data stored in in-memory arrays
- Mock delays with `setTimeout`
- TODO comments about connecting to real database

**After:**
- Full CRUD operations with Supabase
- No mock delays
- Comprehensive error handling

**Key Functions:**

**KYC Management:**
```typescript
getKycQueue()                                    // Fetch pending KYC docs
approveKycDocument(docId, actorId)              // Approve KYC
rejectKycDocument(docId, reason, actorId)       // Reject KYC
```

**Risk Events:**
```typescript
getRiskEvents(filters?)                          // Fetch risk events
createRiskEvent(event)                          // Create risk event
resolveRiskEvent(eventId, note, actorId)        // Resolve event
```

**User Management:**
```typescript
getUsers()                                      // Fetch all users
updateUserRole(userId, newRole, actorId)        // Update role
deleteUser(userId, actorId)                     // Soft delete
```

**Maker-Checker Workflow:**
```typescript
getAdminActionRequests(orgId, status?)          // Fetch requests
submitAdminActionRequest(...)                   // Create request
approveAdminActionRequest(requestId, actorId)   // Approve
rejectAdminActionRequest(requestId, reason, actorId) // Reject
```

**Pool Management:**
```typescript
getPoolsForModeration()                         // Fetch pools
updatePoolStatus(poolId, isActive, actorId)     // Update status
closePool(poolId, reason)                       // Close pool
```

**Credit Reapply:**
```typescript
getSkippedCredits(since?)                       // Find skipped credits
reapplyCredit(tx_id)                           // Reapply single
reapplyCreditBulk(since, limit, dryRun, cursor) // Batch reapply
```

#### `services/billingService.ts`
**Before:**
- Mock data arrays for plans, subscriptions, promos
- Mock delays

**After:**
- Full database integration
- Real-time data

**Functions:**

**User Functions:**
```typescript
getAvailablePlans()                             // Fetch active plans
getOrgSubscription(orgId)                       // Get subscription
updateOrgSubscription(orgId, planId, actorId)   // Update plan
applyPromoCode(orgId, code)                     // Apply promo
getOrgCredits(orgId)                            // Get credits
```

**Admin Functions:**
```typescript
upsertBillingPlan(plan)                         // Create/update plan
deleteBillingPlan(planId)                       // Soft delete
getGlobalPromos()                               // Fetch promos
upsertGlobalPromo(promo)                        // Create/update promo
```

### 3. Component Updates

All admin components now work seamlessly with the new database-backed services:

- **UserManagement.tsx** - User directory with role management
- **KycQueue.tsx** - KYC verification queue
- **RiskDashboard.tsx** - Risk event monitoring
- **Approvals.tsx** - Maker-checker approval workflow
- **Billing.tsx** - Billing plan and subscription management

No changes were required to the components themselves - they continue to use the same service functions, which now have real implementations.

## Migration Guide

### Prerequisites
- Supabase project set up
- Supabase CLI installed (optional)
- Database connection configured

### Step 1: Run the Migration

#### Option A: Using Supabase CLI
```bash
cd /path/to/Togedaly-New
supabase db push
```

#### Option B: Direct SQL Execution
```bash
psql -d your_database -f supabase/migrations/20241225_admin_tables.sql
```

#### Option C: Supabase Dashboard
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy the contents of `supabase/migrations/20241225_admin_tables.sql`
4. Execute the SQL

### Step 2: Verify Installation

Run these queries to verify tables were created:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'profiles', 'kyc_documents', 'risk_events', 
    'admin_action_requests', 'pool_treasury_policies',
    'incoming_transfers', 'audit_logs', 'billing_plans',
    'org_subscriptions', 'promo_codes', 'org_credits'
  );

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%_documents' OR tablename LIKE '%_events';

-- Check default billing plans
SELECT * FROM billing_plans;
```

### Step 3: Test Admin Functionality

1. **Access Admin Panel:**
   ```
   Navigate to: /admin
   ```

2. **Test KYC Queue:**
   - No mock data will appear initially
   - Create test KYC documents to verify workflow

3. **Test Risk Events:**
   - Create a test risk event
   - Resolve it and verify audit log

4. **Test Maker-Checker:**
   - Submit an admin action request
   - Approve/reject as different user
   - Verify treasury policy updates

5. **Test Audit Trail:**
   - View audit trail
   - Verify all actions are logged
   - Test filtering

## Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled with policies that:

1. **Admin Access:**
   - Admins can view and modify all data
   - Managers have most admin permissions
   - Support staff have read access to most tables

2. **User Access:**
   - Users can view their own profiles
   - Users can view their own KYC documents
   - Users can view their own transfers and subscriptions

3. **Service Role:**
   - Can insert audit logs
   - Can insert incoming transfers
   - Used for system operations

### Role Hierarchy
```
admin > manager > support > member
```

### Policy Examples

**Admin can view all KYC documents:**
```sql
CREATE POLICY "Admins can view all KYC documents" ON kyc_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  );
```

**Users can view their own KYC documents:**
```sql
CREATE POLICY "Users can view own KYC" ON kyc_documents
  FOR SELECT
  USING (auth.uid() = user_id);
```

## Data Model

### Key Relationships

```
auth.users (Supabase Auth)
    ↓
profiles (user data + role)
    ↓
├── kyc_documents (user's KYC submissions)
├── risk_events (risk flags on user)
├── incoming_transfers (payments from user)
└── org_subscriptions (user's subscription)

admin_action_requests (approval workflow)
    ↓
pool_treasury_policies (approved treasury changes)

audit_logs (immutable log of all actions)
```

### Table Schemas

See the migration file for complete schemas. Key tables:

**kyc_documents:**
- Stores ID cards, selfies, proof of address
- Status: pending → approved/rejected
- Tracks reviewer and review time

**risk_events:**
- Source: system, paystack, manual
- Severity: low, medium, high, critical
- Can be resolved with notes

**admin_action_requests:**
- Maker-checker pattern
- Status: pending → approved/rejected
- Stores payload for execution

**audit_logs:**
- Immutable record of all admin actions
- Actor, action, target, metadata
- Used for compliance and debugging

## Troubleshooting

### Issue: RLS policies prevent access

**Solution:** Ensure user has correct role in profiles table:
```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your@email.com';
```

### Issue: Migration fails on existing tables

**Solution:** Migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to re-run. If tables exist with different schema, you may need to:
```sql
DROP TABLE table_name CASCADE;
-- Then re-run migration
```

### Issue: No data appears in admin panel

**Solution:** 
1. Check RLS policies are correct
2. Verify user has admin role
3. Create test data manually:
```sql
INSERT INTO kyc_documents (user_id, doc_type, status) 
VALUES (auth.uid(), 'id_card', 'pending');
```

### Issue: Audit logs not appearing

**Solution:** Verify service role key is being used for audit inserts, or grant INSERT permission:
```sql
CREATE POLICY "Anyone can insert audit logs" ON audit_logs
  FOR INSERT
  WITH CHECK (true);
```

## Performance Tips

1. **Use pagination** for large datasets:
   ```typescript
   const { data } = await supabase
     .from('audit_logs')
     .select('*')
     .order('created_at', { ascending: false })
     .range(0, 49); // First 50 records
   ```

2. **Add filters** to reduce data:
   ```typescript
   const { data } = await supabase
     .from('risk_events')
     .select('*')
     .eq('resolved', false)
     .eq('severity', 'high');
   ```

3. **Use indexes** (already created in migration)

4. **Consider materialized views** for complex analytics

## Future Enhancements

Potential improvements:

1. **Real-time Updates:**
   ```typescript
   supabase
     .channel('admin-updates')
     .on('postgres_changes', 
       { event: 'INSERT', schema: 'public', table: 'risk_events' },
       handleNewRiskEvent
     )
     .subscribe();
   ```

2. **Advanced Search:**
   - Full-text search on audit logs
   - Date range filtering
   - Multi-field search

3. **Bulk Operations:**
   - Bulk KYC approval
   - Bulk risk resolution
   - Batch user updates

4. **Analytics Dashboard:**
   - Risk event trends
   - KYC approval rates
   - User growth metrics

5. **Export Functionality:**
   - CSV export of audit logs
   - Report generation
   - Scheduled exports

## API Routes (Optional)

While services can be used directly from the frontend, you may want to create server-side API routes for:

1. **Sensitive Operations:**
   ```typescript
   // app/api/admin/users/[id]/suspend/route.ts
   export async function POST(req: Request) {
     // Verify admin role server-side
     // Perform sensitive operation
   }
   ```

2. **Complex Transactions:**
   ```typescript
   // app/api/admin/approvals/execute/route.ts
   export async function POST(req: Request) {
     // Multi-step operation with rollback
   }
   ```

3. **External Service Integration:**
   ```typescript
   // app/api/admin/kyc/verify-external/route.ts
   export async function POST(req: Request) {
     // Call external KYC provider
     // Update database
   }
   ```

## Support

For issues or questions:
1. Check this documentation
2. Review the migration file: `supabase/migrations/20241225_admin_tables.sql`
3. Examine the service implementations
4. Check Supabase logs for database errors

## Conclusion

The admin panel is now fully integrated with Supabase, providing:
- ✅ Real-time data
- ✅ Secure access controls
- ✅ Complete audit trail
- ✅ Scalable architecture
- ✅ Production-ready code

All mock data has been removed, and the system is ready for production use.
