// services/idempotencyService.ts

// MOCK in-memory store for idempotency keys. In a real app, this would be a database table.
const idempotencyKeys: { key: string; processed_at: string }[] = [];

/**
 * Constructs a unique key for an event to check for duplicates.
 */
function constructKey(provider: string, event_type: string, external_id: string): string {
    return `${provider}:${event_type}:${external_id}`;
}

/**
 * Checks if a webhook event has already been processed and records it if it's new.
 * This prevents duplicate actions, like crediting a wallet twice for the same transaction.
 *
 * @returns {Promise<boolean>} - `true` if the event is new, `false` if it's a duplicate.
 */
export async function recordIdempotency(
    provider: string,
    event_type: string,
    external_id: string
): Promise<boolean> {
    const key = constructKey(provider, event_type, external_id);
    
    // Check if the key already exists in our mock store
    if (idempotencyKeys.some(k => k.key === key)) {
        console.warn(`IDEMPOTENCY: Duplicate event skipped - ${key}`);
        return false; // Already processed
    }

    // Record the new key
    idempotencyKeys.push({ key, processed_at: new Date().toISOString() });
    console.log(`IDEMPOTENCY: New event recorded - ${key}`);
    return true; // Is new
}