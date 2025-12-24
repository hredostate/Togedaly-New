

import type { LegacyPool } from '../types';

export const mockLegacyPools: LegacyPool[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    name: 'Sienna Bus for Inter-State Transport',
    description: 'Pooling funds to purchase a fairly used Toyota Sienna for a profitable transport business between Lagos and Ibadan. High demand route with proven returns.',
    poolType: 'invest',
    frequency: 'monthly',
    base_amount_kobo: 550000000,
    raised_amount_kobo: 125000000,
    min_contribution_kobo: 25000000,
    vote_threshold_pct: 75,
    is_active: true,
    creator_score: 92, // The Odogwu
    roadmap: {
        start_date: new Date().toISOString(),
        maturity_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        projected_roi_pct: 25.5,
        payout_frequency: 'monthly',
        grace_period_days: 3,
        phases: [
            { name: 'Vehicle Purchase', description: 'Acquire and register the Sienna bus.', date: 'Month 1', status: 'active' },
            { name: 'Route Operations', description: 'Begin Lagos-Ibadan route. Monthly payouts start.', date: 'Months 2-11', status: 'upcoming', roi_target: '2.5% / month' },
            { name: 'Asset Liquidation', description: 'Sell vehicle and return capital + final profit.', date: 'Month 12', status: 'upcoming' }
        ]
    },
    milestones: [
      { id: 101, title: 'Vehicle Purchase & Registration', amount_kobo: 550000000, status: 'voting', position: 1, yes_votes_pct: 68 },
      { id: 102, title: 'First 3-Months Operational Costs', amount_kobo: 75000000, status: 'draft', position: 2, yes_votes_pct: 0 },
    ],
    created_by: 'admin-user-id'
  },
  {
    id: 'b2c3d4e5-f6a7-8901-2345-67890abcdef0',
    name: 'A-Grade Cow Share for Ileya Festival',
    description: 'Group buying a large, healthy cow for the upcoming Sallah celebration. Meat will be shared equally among contributors. Save money by buying in bulk!',
    poolType: 'group_buy',
    frequency: 'weekly',
    base_amount_kobo: 85000000,
    raised_amount_kobo: 85000000, // Fully funded for demo
    min_contribution_kobo: 5000000,
    vote_threshold_pct: 80,
    is_active: true,
    target_state: 'Lagos',
    creator_score: 78, // Reliable
    confirmed_receipts: 2, // 2 out of say 10 have received
    // Timelines
    dispute_window_end: new Date(Date.now() + 23 * 3600 * 1000 + 45 * 60 * 1000).toISOString(), // 23h 45m remaining
    fulfillment_timeline: [
        { stage: 'funded', timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), completed: true, note: 'Pool fully funded' },
        { stage: 'processing', timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), completed: true, note: 'Supplier sourced cow' },
        { stage: 'shipped', timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), completed: true, note: 'Delivered to slaughterhouse' },
        { stage: 'delivered', timestamp: new Date(Date.now() - 15 * 60000).toISOString(), completed: true, note: 'Meat shared and ready for pickup' },
        { stage: 'settled', timestamp: '', completed: false }
    ],
    milestones: [
        { id: 201, title: 'Cow Purchase from Supplier', amount_kobo: 85000000, status: 'approved', position: 1, yes_votes_pct: 95 }
    ],
    created_by: 'admin-user-id'
  },
  {
    id: 'c3d4e5f6-a7b8-9012-3456-7890abcdef01',
    name: 'Community Ajo Savings (12-Month Cycle)',
    description: 'A traditional rotating savings club (Ajo/Esusu). 12 members contribute monthly, with one member receiving the full pot each month. Transparent and secure.',
    poolType: 'ajo',
    frequency: 'monthly',
    base_amount_kobo: 120000000,
    raised_amount_kobo: 10000000,
    min_contribution_kobo: 10000000,
    vote_threshold_pct: 100,
    is_active: true,
    creator_score: 85, // Reliable
    milestones: [],
    created_by: 'admin-user-id'
  },
  {
    id: 'd4e5f6a7-b8c9-0123-4567-890abcdef012',
    name: 'Plot of Land in Epe Outskirts',
    description: 'Invest in a fast-developing area in Epe, Lagos. Land banking has proven to be a reliable long-term investment. Documents will be processed collectively.',
    poolType: 'invest',
    frequency: 'monthly',
    base_amount_kobo: 1500000000,
    raised_amount_kobo: 950000000,
    min_contribution_kobo: 50000000,
    vote_threshold_pct: 66,
    is_active: true,
    creator_score: 65, // Building
    milestones: [
        { id: 301, title: 'Land Acquisition & Survey', amount_kobo: 1500000000, status: 'voting', position: 1, yes_votes_pct: 45 },
        { id: 302, title: 'Documentation & C of O Processing', amount_kobo: 200000000, status: 'draft', position: 2, yes_votes_pct: 0 },
    ],
    created_by: 'admin-user-id'
  },
  // NEW WAYBILL MOCK
  {
    id: 'way-iphone-13-ikeja',
    name: 'Iphone 13 Pro Max - Waybill to Abuja',
    description: 'Escrow for gadget purchase from Gadget Plug Ikeja. Funds held until item is received via Peace Mass Transit.',
    poolType: 'waybill',
    frequency: 'one_time',
    base_amount_kobo: 65000000, // 650k
    raised_amount_kobo: 0,
    min_contribution_kobo: 65000000,
    vote_threshold_pct: 0,
    is_active: true,
    milestones: [],
    creator_score: 90,
    waybillData: {
        origin: 'Computer Village, Ikeja',
        destination: 'Wuse Zone 2, Abuja',
        itemDescription: 'iPhone 13 Pro Max (Sierra Blue) + Charger',
        status: 'waiting_funds',
        arrivalState: 'Abuja'
    },
    created_by: 'admin-user-id'
  }
];