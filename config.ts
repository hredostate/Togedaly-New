// config.ts

/**
 * Global kill-switch for DVA wallet crediting.
 * When set to `true`, the Paystack webhook handler will log incoming transfers
 * but will skip the actual crediting of user wallets or ventures.
 * This is useful for maintenance or reconciliation periods.
 */
export const DISABLE_WALLET_CREDIT = false;
