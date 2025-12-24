import type { UserProfile, AjoPayment } from '../types';

// Add phone numbers for SMS fan-out testing
export const mockUserProfiles: UserProfile[] = [
    { id: 'user-001', name: 'Adanna The GOAT', email: 'adanna@example.com', phone: '2348012345671' },
    { id: 'user-002', name: 'Tunde Sabi', email: 'tunde@example.com', phone: '2348012345672' },
    { id: 'user-003', name: 'Chioma Money', email: 'chioma@example.com', phone: '2348012345673' },
    { id: 'user-004', name: 'Bayo On-Time', email: 'bayo@example.com', phone: '2348012345674' },
    { id: 'user-005', name: 'Funke Funds', email: 'funke@example.com', phone: '2348012345675' },
    { id: 'user-006', name: 'Emeka Sharp', email: 'emeka@example.com', phone: '2348012345676' },
    { id: 'user-007', name: 'Ngozi Default', email: 'ngozi@example.com', phone: '2348012345677' },
];

export const mockAjoPayments: AjoPayment[] = [];

const ajoGroupId = 'c3d4e5f6-a7b8-9012-3456-7890abcdef01'; // Community Ajo Savings
const users = mockUserProfiles.slice(0, 6); // First 6 users are in this group

// Generate payment history for the last 4 months
for (let i = 0; i < 4; i++) {
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() - i);
    dueDate.setDate(15);

    users.forEach((user, userIndex) => {
        let paid_at: string | null = null;
        if (i > 0) { // Everyone paid past months, with some delays
             const delayDays = (user.name === 'Ngozi Default' && i < 3) ? 5 : // Ngozi is always late
                               (userIndex % 3 === 0) ? -2 : // Some are early
                               (userIndex % 4 === 0) ? 3 : 0; // Some are a bit late
            const paidDate = new Date(dueDate);
            paidDate.setDate(paidDate.getDate() + delayDays);
            paid_at = paidDate.toISOString();
        } else { // Current month payments
             if (user.name === 'Ngozi Default') {
                paid_at = null; // Ngozi hasn't paid this month yet
             } else if (user.name !== 'Emeka Sharp') {
                const paidDate = new Date(dueDate);
                paidDate.setDate(paidDate.getDate() + (userIndex % 2 === 0 ? -1 : 0));
                paid_at = paidDate.toISOString();
             }
        }

        mockAjoPayments.push({
            id: (i * 10) + userIndex,
            group_id: ajoGroupId,
            user_id: user.id,
            due_date: dueDate.toISOString(),
            paid_at: paid_at,
            amount_kobo: 10000000,
        });
    });
}
