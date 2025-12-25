
import { db } from '../lib/db';
import type { UserProgress, UserBadge } from '../types';

export async function getUserProgress(userId: string): Promise<UserProgress | null> {
    const prog = db.getUserProgress(userId);
    return {
        user_id: userId,
        xp: prog.xp,
        trust_score: prog.trust,
        level: prog.level
    };
}

export async function getUserBadges(userId: string): Promise<UserBadge[]> {
    return []; // Implementation simplified for now
}

export async function getLeaderboard(userId: string): Promise<{ display_name: string, xp: number }[]> {
    return [
        { display_name: 'Adanna', xp: 2500 },
        { display_name: 'Tunde', xp: 2100 },
        { display_name: 'You', xp: db.getUserProgress(userId).xp }
    ].sort((a,b) => b.xp - a.xp);
}

export async function awardXp(userId: string, amount: number, reason: string): Promise<{ xp_after: number, level_after: number }> {
    const current = db.getUserProgress(userId);
    const newXp = current.xp + amount;
    const newLevel = Math.floor(newXp / 500) + 1;
    
    db.updateUserProgress(userId, { xp: newXp, level: newLevel });
    return { xp_after: newXp, level_after: newLevel };
}

export async function adjustTrust(userId: string, delta: number, reason: string): Promise<{ trust_after: number }> {
    const current = db.getUserProgress(userId);
    const newTrust = Math.min(100, Math.max(0, current.trust + delta));
    
    db.updateUserProgress(userId, { trust: newTrust });
    return { trust_after: newTrust };
}

export async function grantBadge(badgeCode: string): Promise<void> {
    // placeholder
}
