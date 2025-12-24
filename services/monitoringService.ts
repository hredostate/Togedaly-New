// services/monitoringService.ts

export interface MonitoringStats {
    webhookSuccessRate: number;
    queueDepth: number;
    apiP95: number;
}

export async function getMonitoringStats(): Promise<MonitoringStats> {
    console.log("MOCK: getMonitoringStats");
    await new Promise(resolve => setTimeout(resolve, 600));
    return {
        webhookSuccessRate: 0.998,
        queueDepth: 1234,
        apiP95: 280,
    };
}
