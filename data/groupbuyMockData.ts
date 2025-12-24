
import type { GroupBuy } from '../types';

export const mockGroupBuys: GroupBuy[] = [
  {
    id: 1,
    org_id: 1,
    name: 'Bulk Ramadan Rice (50kg bags)',
    description: 'Pooling funds to buy high-quality Nigerian rice in bulk for the Ramadan season to save on costs.',
    supplier_id: 2, // Mama Rice & Sons
    supplier_sku_id: 201, // Mock SKU ID
    unit_price: 35000,
    min_units: 50,
    max_units: 200,
    status: 'open',
    allow_oversubscribe: true,
    auto_cancel_if_under_min: true,
    visible: true,
    created_by: 'admin-user-id',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    total_reserved_units: 62,
  },
  {
    id: 2,
    org_id: 1,
    name: 'Sallah Cow Share (Medium)',
    description: 'A-grade cow for the upcoming Ileya festival. Meat to be shared equally among contributors.',
    supplier_id: 1, // Cow Merchant Ltd.
    supplier_sku_id: 101, // Mock SKU ID
    unit_price: 85000,
    min_units: 10,
    max_units: 10,
    status: 'locked',
    allow_oversubscribe: false,
    auto_cancel_if_under_min: true,
    visible: true,
    created_by: 'admin-user-id',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    total_reserved_units: 10,
    target_state: 'Lagos',
  },
  {
    id: 3,
    org_id: 1,
    name: 'Christmas Turkey (Large)',
    description: 'Planning ahead for Christmas. Large, healthy turkeys sourced directly from Babatunde Farms.',
    supplier_id: 2, // Babatunde Farms
    supplier_sku_id: 205, // Mock SKU ID
    unit_price: 25000,
    min_units: 100,
    status: 'draft',
    allow_oversubscribe: true,
    auto_cancel_if_under_min: true,
    visible: false,
    created_by: 'admin-user-id',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_reserved_units: 0,
    target_state: 'Ogun',
  },
];