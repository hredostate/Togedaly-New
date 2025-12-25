import type { VelocityAlert, DeviceMatrix } from '../types';

let velocityAlertsDb: VelocityAlert[] = [];
let deviceMatrixDb: DeviceMatrix[] = [];

export async function getVelocityAlerts(): Promise<VelocityAlert[]> {
    console.log("getVelocityAlerts");
    await new Promise(res => setTimeout(res, 500));
    return velocityAlertsDb;
}

export async function getDeviceMatrix(): Promise<DeviceMatrix[]> {
    console.log("getDeviceMatrix");
    await new Promise(res => setTimeout(res, 600));
    return deviceMatrixDb;
}

export async function resolveVelocityAlert(alertId: string): Promise<void> {
    console.log("resolveVelocityAlert", alertId);
    await new Promise(res => setTimeout(res, 300));
    velocityAlertsDb = velocityAlertsDb.filter(a => a.id !== alertId);
}

export async function blockUser(userId: string, reason: string): Promise<void> {
    console.log("blockUser", { userId, reason });
    await new Promise(res => setTimeout(res, 400));
    // In a real app, this would update the user's status in the database.
}
