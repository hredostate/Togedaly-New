// services/backupService.ts

// Mock in-memory store for backups
const mockBackups: { stamp: string; tables: string[] }[] = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000);
    const stamp = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}`;
    return {
        stamp,
        tables: ["ledger.csv", "obligations.csv", "collateral.csv", "memberships.csv", "pools.csv"],
    };
});

export async function getRecentBackups(): Promise<{ stamp: string; tables: string[] }[]> {
    console.log("MOCK: getRecentBackups");
    await new Promise(resolve => setTimeout(resolve, 500));
    return JSON.parse(JSON.stringify(mockBackups));
}

export async function triggerManualBackup(): Promise<{ ok: boolean; stamp: string }> {
    console.log("MOCK: triggerManualBackup");
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const d = new Date();
    const stamp = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}`;

    // Check if a backup for today already exists to avoid duplicates
    if (!mockBackups.some(b => b.stamp === stamp)) {
        mockBackups.unshift({
            stamp,
            tables: ["ledger.csv", "obligations.csv", "collateral.csv", "memberships.csv", "pools.csv"],
        });
        // Keep the list tidy
        if (mockBackups.length > 10) {
            mockBackups.pop();
        }
    }

    return { ok: true, stamp };
}
