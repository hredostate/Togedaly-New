

// From services/geminiService.ts
export interface AdviserTip {
    title: string;
    description: string;
    category: string;
}

export interface VentureRoadmapPhase {
    name: string;
    description: string;
    date: string; // approximate date or duration
    roi_target?: string;
    status: 'completed' | 'active' | 'upcoming';
}

export interface VentureRoadmap {
    start_date: string;
    maturity_date: string;
    projected_roi_pct: number;
    payout_frequency: 'monthly' | 'quarterly' | 'end_of_term';
    grace_period_days: number;
    phases: VentureRoadmapPhase[];
}

// From pages/VentureDetails.tsx
export interface Milestone {
    id: number;
    title: string;
    amount_kobo: number;
    status: 'draft' | 'voting' | 'approved' | 'completed';
    position: number;
    yes_votes_pct: number;
}

export type PoolType = 'invest' | 'group_buy' | 'ajo' | 'event' | 'waybill';

export type FulfillmentStage = 'funded' | 'processing' | 'shipped' | 'delivered' | 'settled' | 'disputed';

export interface FulfillmentEvent {
    stage: FulfillmentStage;
    timestamp: string;
    note?: string;
    completed: boolean;
}

export interface EventItem {
    id: string;
    name: string; // e.g. "Ankara (6 yards)"
    price_kobo: number;
    mandatory: boolean;
}

export interface EventSettings {
    eventDate: string;
    venue: string;
    items: EventItem[];
    allowCredit?: boolean; // Enable "Deliver First, Pay Later" mode
}

export interface WaybillData {
    origin: string; // e.g., "Ikeja, Lagos"
    destination: string; // e.g., "Wuse 2, Abuja"
    logistics_provider?: string; // e.g. "GIGM", "Peace Mass"
    driver_phone?: string;
    waybill_number?: string;
    waybill_image?: string;
    status: 'waiting_funds' | 'pending_dropoff' | 'in_transit' | 'delivered' | 'funds_released';
    itemDescription?: string;
    arrivalState?: string;
}

// From data/mockData.ts
export interface LegacyPool {
    id: string;
    name: string;
    description: string;
    poolType: PoolType;
    frequency: 'monthly' | 'weekly' | 'daily' | 'one_time';
    base_amount_kobo: number;
    raised_amount_kobo: number;
    min_contribution_kobo: number;
    vote_threshold_pct: number;
    is_active: boolean;
    milestones: Milestone[];
    target_state?: string; // Optional geographical restriction
    creator_score?: number; // 0-100 Reliability Index
    roadmap?: VentureRoadmap;
    confirmed_receipts?: number; // Count of members who confirmed item receipt
    
    // New Timeline Fields
    fulfillment_timeline?: FulfillmentEvent[];
    dispute_window_end?: string; // ISO date when auto-settlement happens
    
    // New Event Fields
    eventSettings?: EventSettings;

    // New Waybill Fields
    waybillData?: WaybillData;

    // Ownership
    created_by?: string;
}

// From services/payoutService.ts
export interface RevenueEvent {
    id: string;
    pool_id: string;
    total_revenue_kobo: number;
    cycle_end: string;
    notes: string;
}

// From components/ToastHost.tsx
export interface ToastMessage {
    id: string;
    title: string;
    desc: string;
    emoji: string;
    timeout?: number;
}

// From pages/Legal.tsx
export type LegalDocType = 'terms' | 'privacy' | 'refund' | 'support' | 'compliance';

// From services/gamificationService.ts
export interface UserProgress {
    user_id: string;
    xp: number;
    trust_score: number;
    level: number;
}

export interface UserBadge {
    user_id: string;
    badge_code: string;
    earned_at: string;
}

// from services/kycService.ts
export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface KycProfile {
    user_id: string;
    status: KycStatus;
    provider?: 'smileid' | 'verifyme' | 'manual';
    last_ref?: string;
    data: any;
    created_at: string;
    updated_at: string;
}

export interface DeviceEvent {
    id: number;
    device_hash: string;
    ip: string;
    city: string;
    country: string;
    created_at: string;
}

// From services/adminService.ts
export type KycLevel = 'basic' | 'plus' | 'pro';

export interface KycDocument {
    id: string;
    user_id: string;
    doc_type: 'id_card' | 'selfie' | 'proof_of_address';
    storage_path: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export interface AdminRiskEvent {
    id: string;
    user_id: string;
    source: 'system' | 'paystack' | 'manual';
    code: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: any;
    created_at: string;
}

export interface AuditLog {
    id: string;
    actor: string;
    action: string;
    target: string;
    meta?: any;
    created_at: string;
}

// NEW: Admin Action Requests (Maker-Checker)
export type AdminActionStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface AdminActionRequest {
  id: number;
  org_id: number;
  pool_id?: string;
  action_type: 'treasury_policy_update' | string;
  target_table: string;
  target_id: string;
  payload: any;
  status: AdminActionStatus;
  requested_by: string;
  approved_by?: string;
  reject_reason?: string;
  created_at: string;
  updated_at: string;
}

// NEW: Admin User Management
export type UserRole = 'admin' | 'support' | 'manager' | 'member';

export interface AdminUser extends UserProfile {
    role: UserRole;
    status: 'active' | 'suspended';
    joined_at: string;
}

// From data/trustPoolMockData.ts
export interface PoolTP {
    id: string;
    name: string;
    currency: 'NGN';
    base_amount: number;
    frequency: 'daily' | 'weekly' | 'monthly';
    collateral_ratio: number;
    min_lock_cycles: number;
    created_by: string;
    created_at: string;
    is_active: boolean;
    inflation_shield?: boolean; // New: Option to peg value to stablecoin
}

// NEW: Guarantor Request
export interface GuarantorRequest {
    id: string;
    pool_id: string;
    requester_user_id: string;
    guarantor_user_id?: string;
    guarantor_email?: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
}

export interface PoolMembership {
    id: string;
    pool_id: string;
    user_id: string;
    status: 'active' | 'inactive' | 'suspended';
    join_date: string;
    trust_score: number;
    current_default_state: 'none' | 'grace' | 'penalty';
    consecutive_missed: number;
    slot_count: number;
    // New: List of accepted guarantor IDs for high-value pools
    guarantor_ids?: string[];
}

export interface PoolCycle {
    id: string;
    pool_id: string;
    cycle_number: number;
    due_date: string;
}

export interface MemberCycleObligation {
    id: string;
    pool_id: string;
    user_id: string;
    cycle_id: string;
    contribution_due: number;
    collateral_due: number;
    is_settled: boolean;
    settled_at?: string;
}

export interface CollateralAccount {
    id: string;
    pool_id: string;
    user_id: string;
    locked_amount: number;
    available_amount: number;
    last_unlock_cycle: number;
    updated_at: string;
}

export interface PoolDetailsData {
    pool: PoolTP;
    membership: PoolMembership | null;
    collateral: CollateralAccount | null;
    obligations: (MemberCycleObligation & { cycle: PoolCycle })[];
    guarantorRequests?: GuarantorRequest[]; // Optional for UI
}

// From services/payoutService.ts
export interface MilestoneProof {
    id: number;
    milestone_id: number;
    uploader: string;
    proof_url: string;
    approved: boolean;
    uploaded_at: string;
}

// from services/opsService
export type IncidentSeverity = 'minor' | 'major' | 'critical';
export type IncidentStatus = 'investigating' | 'monitoring' | 'resolved' | 'false_positive';

export interface IncidentUpdate {
    id: number;
    body_md: string;
    created_at: string;
}

export interface Incident {
    id: number;
    title: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    updates: IncidentUpdate[];
}

export interface UptimeCheck {
    id: number;
    service: string;
    ok: boolean;
    latency_ms: number;
    checked_at: string;
}

export interface DlqItem {
    id: string;
    queue: string;
    payload: any;
    error: string | null;
    attempts: number;
    last_seen: string;
}

export interface ArrearsRecord {
  org_id: number;
  pool_id: string;
  user_id: string;
  open_cycles: number;
  total_owed: number;
}


// from data/ajoMockData.ts
export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    // New: Paystack Authorization for recurring billing
    paystack_auth?: PaystackAuthorization;
}

export interface AjoPayment {
    id: number;
    group_id: string;
    user_id: string;
    due_date: string;
    paid_at: string | null;
    amount_kobo: number;
}

// from services/analyticsService.ts
export interface AjoBoardEntry {
    group_id: string;
    title: string;
    created_at: string;
    members: number;
    contributed_ngn: number;
    on_time_ratio: number;
    missers: number;
    defaulters: number;
    next_due: string | null;
}

export interface AjoMemberDetails {
    group_id: string;
    user_id: string;
    member_name: string;
    periods_due: number;
    periods_paid: number;
    periods_missed: number;
    next_due: string | null;
    paid_kobo: number;
}

export interface AjoHistoryPoint {
    // Define structure if needed, empty for now
}

export interface AjoMemberTimelineEntry {
    due_date: string;
    paid_at: string | null;
    amount_kobo: number;
    status: 'paid' | 'late' | 'due' | 'paid_late';
}

export interface TtfEntry {
    group_id: string;
    title: string;
    user_id?: string;
    member_name?: string;
    members?: number;
    payments_done: number;
    avg_ttf_hours: number;
    p50_ttf_hours: number;
    early_ratio: number;
    last_activity: string;
}

export type NotificationChannel = 'sms' | 'email' | 'toast' | 'inapp' | 'whatsapp' | 'voice' | 'push';
export type NotificationStyle = 'inapp_general' | 'join_success' | 'join_success_sms';

export interface MessageTemplate {
    id: string;
    scope: 'global' | 'org';
    channel: NotificationChannel;
    code: string;
    tone: 'naija' | 'formal' | 'strict';
    name: string;
    body: string;
    style: NotificationStyle;
    updated_at: string;
}

// From data/dvaMockData.ts
export interface VirtualAccount {
    id: string;
    user_id: string;
    provider_slug: string;
    account_number: string;
    bank_name: string;
    account_name: string;
    active: boolean;
    assigned: boolean;
    created_at: string;
    updated_at: string;
}

export interface IncomingTransfer {
    id: string;
    user_id: string;
    amount_kobo: number;
    currency: 'NGN';
    provider_slug: string;
    sender_bank: string;
    sender_account_number: string;
    receiver_account_number: string;
    narration: string;
    paystack_tx_id?: number;
    raw?: any;
    created_at: string;
}

// services/routingService
export interface WalletRoutingPrefs {
    user_id: string;
    default_destination: 'wallet' | 'ajo' | 'group_buy' | 'invest';
    default_destination_id?: string | null;
    memo_overrides?: Record<string, { dest: string; id: string }>;
    updated_at: string;
}

// from standing
export type DisputeKind = 'payout' | 'groupbuy' | 'ajo' | 'other';
export type DisputeStatus = 'open' | 'under_review' | 'awaiting_evidence' | 'submitted_to_psp' | 'resolved' | 'reversed' | 'rejected' | 'in_review';


export interface Dispute {
    id: string;
    user_id: string;
    org_id: number;
    kind: DisputeKind;
    ref?: string;
    title: string;
    body: string;
    status: DisputeStatus;
    meta?: any;
    created_at: string;
    updated_at: string;
}

export interface DefaultEvent {
    id: string;
    user_id: string;
    pool_id: string;
    cycle_id: string;
    state: 'grace' | 'penalty' | 'collateral_drawdown';
    penalty_amount: number;
    created_at: string;
}

// from data/refinanceMockData
export interface RefinanceRequest {
    id: string;
    user_id: string;
    amount_kobo: number;
    collateral_locked_kobo: number;
    interest_rate_bps: number;
    repayment_due_at: string;
    status: 'pending' | 'active' | 'repaid' | 'defaulted' | 'rejected';
    created_at: string;
    updated_at: string;
}

// from data/treasuryMockData
export interface PoolTreasuryPolicy {
    pool_id: string;
    kill_draws: boolean;
    kill_unlocks: boolean;
    kill_payments: boolean;
    per_user_daily_draw_ngn: number;
    per_org_daily_draw_ngn: number;
    per_user_daily_unlock_ngn: number;
    max_draw_pct: number;
    min_reserve_pct: number;
    updated_at: string;
}

export interface LiquidityPosition {
    org_id: string;
    pool_id: string;
    total_locked: number;
    max_draw_pct: number;
    min_reserve_pct: number;
    vol_buf: number;
    next_14d_due: number;
    pending_draws: number;
    draw_capacity: number;
}

export interface OpsHealth {
    org_id: string;
    errors_24h: number;
    warns_24h: number;
}

// from lib/aiCoach/persona.ts
export interface HabitSummary {
    userId: string;
    orgId: number;
    windowDays: number;
    stats: {
        opens: number;
        contributions: number;
        missedCycles: number;
        unlocks: number;
        unlockAttempts: number;
        groupbuyBrowses: number;
        groupbuyJoins: number;
        refiRequests: number;
        paymentsFailed: number;
    };
    money: {
        contributed: number;
        unlocked: number;
        drawCapacity: number;
    };
}

// from app/api/coach/events/route.ts
export interface UserEventPayload {
    orgId: number;
    userId: string;
    kind: string;
    poolId?: string;
    groupbuyId?: string;
    amount?: number;
    meta?: any;
    ts?: string;
}

// from services/chatService
export interface ChatThread {
    id: number;
    title: string;
    created_by: string;
    created_at: string;
    last_message_at: string;
    last_message_preview: string;
    org_id: number;
    rtype: 'dm' | 'group'; // was scope
}

export interface ChatMessage {
    id: number;
    room_id: number; // was thread_id
    org_id: number;
    sender: string; // was author
    body: string;
    status: 'ok' | 'flagged' | 'deleted';
    strikes: number;
    meta: any;
    created_at: string;
}

// from services/reputationService
export interface UserReputation {
    user_id: string;
    org_id: number;
    trust_score: number;
    score_peer: number;
    score_on_time: number;
    score_misses: number;
    score_tenure: number;
}

export type InboxMessage = Notification;

// from services/notificationService
export interface Notification {
    id: string;
    recipient: string;
    title: string;
    body: string;
    kind: 'toast' | 'push';
    meta: any;
    read_at: string | null;
    created_at: string;
    delivery_status: 'pending' | 'queued' | 'sent' | 'failed' | 'skipped';
    delivery_channels: NotificationChannel[];
    tries: number;
    deferred_until?: string;
}

export interface NotificationDelivery {
    id: string;
    notification_id: string;
    channel: NotificationChannel;
    status: 'sent' | 'failed' | 'skipped';
    error?: string;
    created_at: string;
    delivered_at: string;
}

export interface UserNotificationPrefs {
    user_id: string;
    default_channels: NotificationChannel[];
    quiet_hours: {
        enabled: boolean;
        from: string;
        to: string;
        tz: string;
    };
    updated_at: string;
}

export interface UserSettings {
  user_id: string;
  ui_language: 'en' | 'pidgin';
  coach_tone: 'formal' | 'playful';
  screen_reader_mode: boolean;
  high_contrast_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformSetting {
    key: string;
    value: any;
    updated_at: string;
}

// Payouts
export interface Payout {
    id: number;
    org_id: number;
    pool_id?: string;
    target: 'member' | 'supplier' | 'org' | 'cycle' | 'settlement'; // Expanded for mapping
    beneficiaryId: string; // user_id or supplier_id
    beneficiaryName: string;
    sourceId: number; // cycle_id or settlement_id
    user_id?: string;
    supplier_id?: number;
    amount: number;
    amount_kobo?: number;
    currency: 'NGN';
    status: 'pending' | 'queued' | 'initiated' | 'settled' | 'failed' | 'skipped';
    provider: 'paystack' | 'manual' | string;
    provider_ref?: string;
    recipient_code?: string;
    bank_account: any;
    reason?: string;
    meta: any;
    created_at: string;
    updated_at?: string;
    settled_at?: string;
    approvals?: number;
    can_queue?: boolean;
    split_code?: string;
    created_by?: string;
    wallet_id?: string;
    deferred_until?: string;
    receipt_url?: string;
    receipt_file_path?: string;
    receipt_source?: string;
}

// FIX: Added missing PayoutRun and PayoutInstruction types.
// from data/payoutMockData.ts
export interface PayoutRun {
  id: number;
  pool_id: string;
  cycle_id: string;
  run_at: string;
  created_by: string;
}

export interface PayoutInstruction {
  id: number;
  run_id: number;
  pool_id: string;
  cycle_id: string;
  user_id: string;
  slot_index: number;
  rotation_position: number;
  amount: number;
  status: 'scheduled' | 'paid' | 'failed' | 'deferred';
  provider_ref?: string;
  meta: any;
  created_at: string;
  updated_at: string;
}


// from Recon
export interface Wallet {
    id: string;
    owner_type: 'user' | 'org' | 'pool';
    owner_id: string;
    balance_kobo: number;
}
export interface Webhook {
    id: string;
    provider: 'paystack' | 'termii';
    event: string;
    created_at: string;
}
export interface PayoutEvent {
    event: string;
    note: string;
    created_at: string;
}
export interface LedgerEntry {
    id: string;
    ts: string;
    wallet_id: string;
    amount_kobo: number;
    code: string;
    ref: string;
}

export interface ReconSummary {
    wallets: number;
    mismatches: ReconMismatch[];
}

export interface ReconMismatch {
    wallet_id: string;
    currency: 'NGN';
    ledger: number;
    cached: number;
    diff: number;
}

// from risk
export interface UserRiskProfile extends KycProfile {
    risk_30d: number;
    risk_all: number;
    last_event_at?: string;
    account_number?: string;
    bvn?: string;
    bank_code?: string;
    first_name?: string;
    last_name?: string;
}

export interface RiskEvent {
    id: string;
    user_id: string;
    source: string;
    event_type: string;
    severity: number;
    meta: any;
    created_at: string;
}

// from settlement
export interface SupplierInvoice {
    id: number;
    org_id: number;
    groupbuy_id: number;
    supplier_id: number;
    invoice_number: string;
    gross_amount: number;
    discount_amount: number;
    net_amount: number;
    vat_amount: number;
    shipping_amount: number;
    status: 'draft' | 'sent' | 'partially_paid' | 'paid';
    meta: any;
    created_at: string;
}

export interface SupplierInvoiceLine {
    //
}
export interface InvoicePayoutLink {
    id: number;
    invoice_id: number;
    payout_id: number;
    amount: number;
    created_at: string;
}
export interface ReconRun {
    id: number;
    org_id: number;
    status: 'running' | 'completed' | 'failed' | 'pending';
    started_at: string;
    ended_at: string;
}
export type ReconStatus = 'pending' | 'matched' | 'mismatched' | 'resolved';

export interface ReconItem {
    id: number;
    run_id: number;
    source: 'psp' | 'ledger' | 'bank';
    external_ref: string;
    amount: number;
    currency: string;
    status: ReconStatus;
    meta: any;
}

export interface InvoiceLine { qty: number; unit_price: number; fill_ratio: number };

// from nudges
export type NudgeBucket = 'A' | 'B' | 'control';

export interface NudgeExperiment {
    id: number;
    key: string;
    description: string;
    is_active: boolean;
    created_at: string;
}

export interface NudgeTemplate {
    id: number;
    key: string;
    channel: NotificationChannel;
    audience: string; // View name or '*'
    payload: any;
    is_active: boolean;
    created_at: string;
}

export interface Nudge {
    id: number;
    user_id: string;
    template_id: number;
    experiment_id: number;
    bucket: NudgeBucket;
    channel: NotificationChannel;
    content: string;
    tts_url?: string;
    status: 'queued' | 'sent' | 'delivered' | 'failed' | 'skipped';
    quiet_skipped: boolean;
    dnd_skipped: boolean;
    meta: any;
    created_at: string;
    sent_at?: string;
}

export interface UserNudgePrefs {
    user_id: string;
    dnd: boolean;
    quiet_start: string;
    quiet_end: string;
    allow_push: boolean;
    allow_voice: boolean;
    allow_sms: boolean;
    allow_email: boolean;
    allow_inapp: boolean;
    locale: string;
    updated_at: string;
}

export interface NudgeAssignment {
    experiment_id: number;
    user_id: string;
    bucket: NudgeBucket;
    assigned_at: string;
}

export interface NudgeOutcome {
    id?: number;
    nudge_id?: number;
    user_id?: string;
    otype?: 'click' | 'repayment' | 'join_pool';
    value?: number;
    meta?: any;
    created_at?: string;
    // from BI
    org_id?: number;
    due_month?: string;
    nudge_type?: string;
    variant?: string;
    obligations?: number;
    total_due?: number;
    total_settled?: number;
    settle_pct?: number;
    avg_days_to_settle?: number;
}

export interface NudgeStat {
    experiment_id: number;
    key: string;
    bucket: NudgeBucket;
    nudges_sent: number;
    clicks: number;
    repayments: number;
    joins: number;
    ctr_pct: number;
}


// From fraud
export interface VelocityAlert {
    id: string;
    user_id: string;
    rule: string;
    value: number;
    triggered_at: string;
}

export interface DeviceMatrix {
    fingerprint: string;
    first_seen: string;
    last_seen: string;
    user_ids: string[];
}

// from services/supplierService.ts
export type SupplierStatus = 'draft' | 'submitted' | 'verified' | 'active' | 'suspended';

// NEW TYPES FOR LOGISTICS
export interface SupplierSku {
    id: string;
    name: string;
    unit: string; // e.g., 'kg', 'bag', 'unit'
    price_kobo: number;
    moq: number;
    stock_level: 'high' | 'medium' | 'low' | 'out';
    description?: string;
}

export interface LogisticsProfile {
    min_order_value_kobo: number;
    lead_time_days: number;
    delivery_areas: string[]; // e.g., ['Lagos', 'Ogun']
    kyc_tier: 'basic' | 'verified' | 'partner';
}

export interface Supplier {
  id: number;
  org_id: number;
  owner_user_id?: string;
  business_name: string;
  display_name?: string;
  contact_person?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  bank_name: string;
  account_number: string;
  account_name?: string;
  paystack_recipient_code?: string;
  cac_number?: string;
  tax_id?: string;
  status: SupplierStatus;
  rating_average: number;
  rating_count: number;
  // New fields
  skus?: SupplierSku[];
  logistics?: LogisticsProfile;
  
  notes?: string;
  meta: any;
  created_at: string;
  updated_at: string;
}

// from GroupBuy Schema (Canvas 2)
export type GroupBuyStatus = 'draft' | 'prelaunch' | 'open' | 'closing' | 'locked' | 'fulfilling' | 'completed' | 'cancelled' | 'partially_refunded';
export type FulfillmentStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'issue';

export interface GroupBuy {
    id: number;
    org_id: number;
    name: string;
    description: string;
    supplier_id: number;
    supplier_sku_id?: number;
    unit_price: number;
    min_units: number;
    max_units?: number;
    status: GroupBuyStatus;
    allow_oversubscribe: boolean;
    auto_cancel_if_under_min: boolean;
    visible: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
    total_reserved_units?: number;
    // Logistics extensions
    fulfillment_status?: FulfillmentStatus;
    units_fulfilled?: number;
    pod_url?: string;
    // Geographical Restriction
    target_state?: string; // e.g. 'Lagos', 'Ogun'. If set, confined to this state.
}

// New types for Data & BI
export interface CohortHealth {
    org_id: number;
    cohort_month: string;
    users_in_cohort: number;
    total_due: number;
    total_settled: number;
    settle_pct: number;
}

export interface OrgLTV {
    org_id: number;
    org_name: string;
    fee_revenue: number;
    total_credits: number;
    net_revenue: number;
}

export interface RepaymentCurve {
    org_id: number;
    due_month: string;
    day_bucket: number;
    cumulative_repayment_ratio: number;
}

// FIX: Added missing type definitions for Support, Billing, GroupBuy, Settlements, and Referrals.

// from services/supportService.ts
export type SupportTicketStatus = 'open' | 'pending' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent';
export interface SupportTicket {
    id: number;
    user_id: string;
    subject: string;
    status: SupportTicketStatus;
    priority: SupportTicketPriority;
    transaction_id?: number;
    pool_id?: number;
    created_at: string;
    updated_at: string;
}
export interface SupportTicketMessage {
    id: number;
    ticket_id: number;
    author_id: string;
    is_admin: boolean;
    body: string;
    created_at: string;
}

// from services/disbursementService.ts and pages/RotationPayouts.tsx
export interface PayoutRecipient {
    id: number;
    org_id: number;
    user_id?: string;
    supplier_id?: number;
    provider: 'paystack';
    recipient_code: string;
    currency: 'NGN';
    bank_code: string;
    account_number: string;
    account_name: string;
    meta: any;
    created_at: string;
}

export type PayoutStatus = 'initiated' | 'settled' | 'failed' | 'queued' | 'pending' | 'scheduled';
export interface CyclePayout {
    id: number;
    pool_id: number;
    cycle_id: number;
    rotation_position: number;
    beneficiary_user_id: string;
    amount: number;
    status: PayoutStatus;
    meta: any;
    created_at: string;
    provider?: string;
    provider_ref?: string;
    receipt_url?: string;
    settled_at?: string;
    receipt_file_path?: string;
    receipt_source?: string;
    psp_meta?: any;
}
export interface SupplierPayout {
    id: number;
    org_id: number;
    settlement_id: number;
    supplier_id: number;
    amount: number;
    status: PayoutStatus;
    provider: 'paystack';
    provider_ref?: string;
    created_at: string;
    settled_at?: string;
    meta: any;
    psp_meta?: any;
    receipt_url?: string;
    receipt_file_path?: string;
    receipt_source?: string;
}

// from services/settlementService.ts
export type SettlementStatus = 'pending' | 'partially_paid' | 'settled';
export interface GroupbuySupplierSettlement {
    id: number;
    org_id: number;
    groupbuy_id: number;
    supplier_id: number;
    gross_amount: number;
    platform_fee: number;
    net_payable: number;
    paid_amount: number;
    status: SettlementStatus;
    currency: 'NGN';
    created_at: string;
    updated_at: string;
    settled_at?: string;
    meta: any;
}
export interface VGroupbuySupplierBalance {
    settlement_id: number;
    org_id: number;
    groupbuy_id: number;
    supplier_id: number;
    gross_amount: number;
    platform_fee: number;
    net_payable: number;
    total_adjustments: number;
    paid_amount: number;
    remaining_due: number;
    status: SettlementStatus;
    currency: 'NGN';
    groupbuy_name?: string;
    supplier_name?: string;
}

// from services/billingService.ts
export type PlanTier = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled';
export interface BillingPlan {
    id: number;
    tier: PlanTier;
    name: string;
    currency: 'NGN';
    monthly_fee: number;
    annual_fee?: number;
    max_pools?: number;
    max_members?: number;
    max_org_admins?: number;
    features: {
        ai_nudges: boolean;
        priority_support: boolean;
        custom_branding?: boolean;
    };
    is_active: boolean;
}
export interface OrgSubscription {
    org_id: number;
    plan_id: number;
    status: SubscriptionStatus;
    current_period_start: string;
    current_period_end: string;
    promo_code_id?: number;
    referral_code_id?: number;
    meta: any;
    updated_at: string;
}
export type PromoType = 'percent_off' | 'fixed_amount';
export interface PromoCode {
    id: number;
    code: string;
    description: string;
    promo_type: PromoType;
    value: number;
    max_uses?: number;
    used_count: number;
    per_org_limit: number;
    active: boolean;
    created_at: string;
    meta: any;
}
export interface OrgCredit {
    id: number;
    org_id: number;
    amount: number;
    description: string;
    source: 'referral' | 'manual' | 'stripe' | 'paystack';
    created_at: string;
    created_by: string;
    consumed_at?: string;
}

// from services/referralService.ts
export type ReferralRewardType = 'credit';
export type ReferralStatus = 'pending' | 'rewarded' | 'expired';
export interface ReferralCode {
    id: number;
    org_id: number;
    code: string;
    reward_type: ReferralRewardType;
    reward_value: number;
    max_uses: number;
    used_count: number;
    created_by?: string;
    active: boolean;
    created_at: string;
}
export interface Referral {
    id: number;
    referral_code_id: number;
    referrer_org_id: number;
    referred_org_id: number;
    status: ReferralStatus;
    created_at: string;
    rewarded_at?: string;
    meta: any;
}

// --- PAYSTACK SPECIFIC TYPES ---
export interface PaystackAuthorization {
    authorization_code: string;
    card_type: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    bin: string;
    bank: string;
    channel: string;
    signature: string;
    reusable: boolean;
    country_code: string;
    account_name?: string;
}

export interface PaystackSplit {
    name: string;
    type: 'percentage' | 'flat';
    currency: 'NGN';
    subaccounts: {
        subaccount_code: string;
        share: number;
    }[];
    bearer_type: 'subaccount' | 'account' | 'all-proportional' | 'all';
    bearer_subaccount: string;
}

// --- PROFILE BUILDER TYPES ---
export interface ProfileQuestion {
    id: string;
    question: string;
    options: string[]; // Or empty for free text
    category: 'lifestyle' | 'finance' | 'risk' | 'goals';
    gamification: { xp: number; successMsg: string };
}

export interface UserAttribute {
    questionId: string;
    answer: string;
    answeredAt: string;
}
