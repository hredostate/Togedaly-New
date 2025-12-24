
import type { Supplier } from '../types';

export const mockSuppliers: Supplier[] = [
  {
    id: 1,
    org_id: 1,
    business_name: 'Mama Chi Foods Ltd.',
    display_name: 'Mama Chi Foods',
    contact_person: 'Chioma Okeke',
    phone: '08012345678',
    email: 'contact@mamachi.com',
    bank_name: 'GTBank',
    account_number: '0123456789',
    status: 'active',
    rating_average: 4.5,
    rating_count: 12,
    meta: {},
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    logistics: {
        min_order_value_kobo: 5000000,
        lead_time_days: 3,
        delivery_areas: ['Lagos', 'Ogun'],
        kyc_tier: 'verified'
    },
    skus: [
        { id: 'sku-101', name: 'Premium Rice (50kg)', unit: 'bag', price_kobo: 3500000, moq: 10, stock_level: 'high' },
        { id: 'sku-102', name: 'Vegetable Oil (25L)', unit: 'jerrycan', price_kobo: 2800000, moq: 5, stock_level: 'medium' }
    ]
  },
  {
    id: 2,
    org_id: 1,
    business_name: 'Babatunde Farms & Co.',
    display_name: 'Babatunde Farms',
    contact_person: 'Babatunde Adeyemi',
    phone: '09087654321',
    email: 'sales@bbfarms.ng',
    bank_name: 'First Bank',
    account_number: '9876543210',
    status: 'verified',
    rating_average: 4.8,
    rating_count: 25,
    meta: {},
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    logistics: {
        min_order_value_kobo: 10000000,
        lead_time_days: 7,
        delivery_areas: ['Lagos', 'Ibadan', 'Abeokuta'],
        kyc_tier: 'partner'
    },
    skus: [
        { id: 'sku-201', name: 'Live Turkey (Large)', unit: 'unit', price_kobo: 2500000, moq: 20, stock_level: 'high' },
        { id: 'sku-202', name: 'Live Goat (Medium)', unit: 'unit', price_kobo: 4500000, moq: 5, stock_level: 'low' }
    ]
  },
  {
    id: 3,
    org_id: 1,
    business_name: 'New Agro Ventures',
    contact_person: 'Funke Akindele',
    phone: '07011223344',
    email: 'funke@newagro.co',
    bank_name: 'Wema Bank',
    account_number: '1122334455',
    status: 'draft',
    rating_average: 0,
    rating_count: 0,
    meta: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    logistics: {
        min_order_value_kobo: 0,
        lead_time_days: 5,
        delivery_areas: ['Lagos'],
        kyc_tier: 'basic'
    },
    skus: []
  },
];
