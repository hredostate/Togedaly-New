import type { PoolTP, LegacyPool, UserProfile, PoolMembership, CollateralAccount, MemberCycleObligation } from '../types';

const KEYS = {
  POOLS_TP: 'db_pools_tp',
  POOLS_LEGACY: 'db_pools_legacy',
  MEMBERSHIPS: 'db_memberships',
  COLLATERAL: 'db_collateral',
  OBLIGATIONS: 'db_obligations',
  USERS: 'db_users',
  WALLET: 'db_wallet',
  KYC: 'db_kyc',
  XP: 'db_xp'
};

class LocalDB {
  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Initialize empty data structures if not present
    if (!localStorage.getItem(KEYS.POOLS_TP)) {
      localStorage.setItem(KEYS.POOLS_TP, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.POOLS_LEGACY)) {
      localStorage.setItem(KEYS.POOLS_LEGACY, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.MEMBERSHIPS)) {
      localStorage.setItem(KEYS.MEMBERSHIPS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.COLLATERAL)) {
      localStorage.setItem(KEYS.COLLATERAL, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.OBLIGATIONS)) {
      localStorage.setItem(KEYS.OBLIGATIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.WALLET)) {
      localStorage.setItem(KEYS.WALLET, JSON.stringify({}));
    }
    if (!localStorage.getItem(KEYS.XP)) {
      localStorage.setItem(KEYS.XP, JSON.stringify({}));
    }
  }

  // --- GENERIC HELPERS ---
  private get<T>(key: string): T {
    if (typeof window === 'undefined') return [] as any;
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  private set<T>(key: string, data: T) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
  }

  private getMap<T>(key: string): Record<string, T> {
    if (typeof window === 'undefined') return {};
    return JSON.parse(localStorage.getItem(key) || '{}');
  }

  // --- POOLS ---
  getTrustPools(): PoolTP[] { return this.get(KEYS.POOLS_TP); }
  getLegacyPools(): LegacyPool[] { return this.get(KEYS.POOLS_LEGACY); }
  
  addTrustPool(pool: PoolTP) {
    const list = this.getTrustPools();
    list.unshift(pool);
    this.set(KEYS.POOLS_TP, list);
  }

  addLegacyPool(pool: LegacyPool) {
    const list = this.getLegacyPools();
    list.unshift(pool);
    this.set(KEYS.POOLS_LEGACY, list);
  }

  updateLegacyPool(pool: LegacyPool) {
    const list = this.getLegacyPools();
    const idx = list.findIndex(p => p.id === pool.id);
    if (idx !== -1) {
        list[idx] = pool;
        this.set(KEYS.POOLS_LEGACY, list);
    }
  }

  // --- MEMBERSHIPS ---
  getMemberships(userId?: string): PoolMembership[] {
    const all = this.get<PoolMembership[]>(KEYS.MEMBERSHIPS);
    return userId ? all.filter(m => m.user_id === userId) : all;
  }

  addMembership(membership: PoolMembership) {
    const list = this.get<PoolMembership[]>(KEYS.MEMBERSHIPS);
    list.push(membership);
    this.set(KEYS.MEMBERSHIPS, list);
  }

  // --- WALLET ---
  getBalance(userId: string): number {
    const wallets = this.getMap<number>(KEYS.WALLET);
    return wallets[userId] || 0;
  }

  creditWallet(userId: string, amountKobo: number) {
    const wallets = this.getMap<number>(KEYS.WALLET);
    wallets[userId] = (wallets[userId] || 0) + amountKobo;
    this.set(KEYS.WALLET, wallets);
    return wallets[userId];
  }

  debitWallet(userId: string, amountKobo: number) {
    const wallets = this.getMap<number>(KEYS.WALLET);
    const current = wallets[userId] || 0;
    if (current < amountKobo) throw new Error("Insufficient funds");
    wallets[userId] = current - amountKobo;
    this.set(KEYS.WALLET, wallets);
    return wallets[userId];
  }

  // --- GAMIFICATION ---
  getUserProgress(userId: string) {
    const map = this.getMap<any>(KEYS.XP);
    return map[userId] || { xp: 0, level: 1, trust: 50 };
  }

  updateUserProgress(userId: string, updates: Partial<{xp: number, level: number, trust: number}>) {
    const map = this.getMap<any>(KEYS.XP);
    const current = map[userId] || { xp: 0, level: 1, trust: 50 };
    map[userId] = { ...current, ...updates };
    this.set(KEYS.XP, map);
    return map[userId];
  }

  // --- KYC ---
  getKycStatus(userId: string) {
    const map = this.getMap<any>(KEYS.KYC);
    return map[userId] || { status: 'unverified' };
  }

  setKycStatus(userId: string, status: string, data?: any) {
    const map = this.getMap<any>(KEYS.KYC);
    map[userId] = { status, ...data };
    this.set(KEYS.KYC, map);
  }

  // --- OBLIGATIONS & COLLATERAL ---
  getObligations(poolId: string, userId: string): MemberCycleObligation[] {
      const all = this.get<MemberCycleObligation[]>(KEYS.OBLIGATIONS);
      return all.filter(o => o.pool_id === poolId && o.user_id === userId);
  }

  settleObligation(poolId: string, userId: string, cycleId: string) {
      const all = this.get<MemberCycleObligation[]>(KEYS.OBLIGATIONS);
      const target = all.find(o => o.pool_id === poolId && o.user_id === userId && o.cycle_id === cycleId);
      if (target) {
          target.is_settled = true;
          target.settled_at = new Date().toISOString();
          this.set(KEYS.OBLIGATIONS, all);
      }
  }

  getCollateral(poolId: string, userId: string): CollateralAccount | null {
      const all = this.get<CollateralAccount[]>(KEYS.COLLATERAL);
      return all.find(c => c.pool_id === poolId && c.user_id === userId) || null;
  }
  
  updateCollateral(account: CollateralAccount) {
      const all = this.get<CollateralAccount[]>(KEYS.COLLATERAL);
      const idx = all.findIndex(c => c.id === account.id);
      if (idx !== -1) {
          all[idx] = account;
          this.set(KEYS.COLLATERAL, all);
      } else {
          all.push(account);
          this.set(KEYS.COLLATERAL, all);
      }
  }
}

export const db = new LocalDB();
