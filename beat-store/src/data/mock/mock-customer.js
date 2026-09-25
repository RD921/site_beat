/**
 * BEAT STORE — Mock Data: Customer, Orders, Downloads
 */

export const MOCK_CUSTOMER = {
  id: 'customer-001',
  name: 'João Silva',
  email: 'joao@email.com',
  avatar: null,
  initials: 'JS',
  createdAt: '2024-01-15',
  totalPurchases: 3,
};

export const MOCK_ORDERS = [
  {
    id: 'ORD-2025-001',
    date: '2025-08-20',
    dateLabel: '20 de agosto de 2025',
    status: 'completed',
    statusLabel: 'Concluído',
    total: 149.90,
    totalLabel: 'R$ 149,90',
    items: [
      {
        beatId: 'beat-005',
        beatTitle: 'Impacto Real',
        licenseId: 'license-premium',
        licenseName: 'Premium',
        price: 149.90,
        priceLabel: 'R$ 149,90',
      },
    ],
  },
  {
    id: 'ORD-2025-002',
    date: '2025-09-01',
    dateLabel: '1 de setembro de 2025',
    status: 'completed',
    statusLabel: 'Concluído',
    total: 99.80,
    totalLabel: 'R$ 99,80',
    items: [
      {
        beatId: 'beat-001',
        beatTitle: 'Midnight Flow',
        licenseId: 'license-basic',
        licenseName: 'Basic',
        price: 49.90,
        priceLabel: 'R$ 49,90',
      },
      {
        beatId: 'beat-003',
        beatTitle: 'Real Talk',
        licenseId: 'license-basic',
        licenseName: 'Basic',
        price: 49.90,
        priceLabel: 'R$ 49,90',
      },
    ],
  },
  {
    id: 'ORD-2025-003',
    date: '2025-09-10',
    dateLabel: '10 de setembro de 2025',
    status: 'processing',
    statusLabel: 'Processando',
    total: 49.90,
    totalLabel: 'R$ 49,90',
    items: [
      {
        beatId: 'beat-004',
        beatTitle: 'Night Drive',
        licenseId: 'license-basic',
        licenseName: 'Basic',
        price: 49.90,
        priceLabel: 'R$ 49,90',
      },
    ],
  },
];

export const MOCK_DOWNLOADS = [
  {
    id: 'dl-001',
    orderId: 'ORD-2025-001',
    beatId: 'beat-005',
    beatTitle: 'Impacto Real',
    licenseId: 'license-premium',
    licenseName: 'Premium',
    formats: ['MP3 (320kbps)', 'WAV (24-bit)'],
    purchaseDate: '2025-08-20',
    purchaseDateLabel: '20 ago 2025',
    downloadCount: 2,
    maxDownloads: null, // ilimitado
  },
  {
    id: 'dl-002',
    orderId: 'ORD-2025-002',
    beatId: 'beat-001',
    beatTitle: 'Midnight Flow',
    licenseId: 'license-basic',
    licenseName: 'Basic',
    formats: ['MP3 (320kbps)'],
    purchaseDate: '2025-09-01',
    purchaseDateLabel: '1 set 2025',
    downloadCount: 1,
    maxDownloads: null,
  },
  {
    id: 'dl-003',
    orderId: 'ORD-2025-002',
    beatId: 'beat-003',
    beatTitle: 'Real Talk',
    licenseId: 'license-basic',
    licenseName: 'Basic',
    formats: ['MP3 (320kbps)'],
    purchaseDate: '2025-09-01',
    purchaseDateLabel: '1 set 2025',
    downloadCount: 0,
    maxDownloads: null,
  },
];

export default { MOCK_CUSTOMER, MOCK_ORDERS, MOCK_DOWNLOADS };
