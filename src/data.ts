import type { Customer, Product, Quote, Sale } from './types'

const daysAgo = (days: number, hours = 10) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hours, 0, 0, 0)
  return date.toISOString()
}

export const customers: Customer[] = [
  { id: 'c-001', name: 'Nuevo Horizonte SAC', document: 'DEMO-20100000001', email: 'ventas@nuevohorizonte.demo', phone: '+51 999 000 001' },
  { id: 'c-002', name: 'Innova Retail SAC', document: 'DEMO-20500000002', email: 'compras@innovaretail.demo', phone: '+51 999 000 002' },
  { id: 'c-003', name: 'Tech Solutions Perú', document: 'DEMO-20600000003', email: 'contacto@techsolutions.demo', phone: '+51 999 000 003' },
  { id: 'c-004', name: 'Distribuidora Andina', document: 'DEMO-20400000004', email: 'logistica@distributandina.demo', phone: '+51 999 000 004' },
  { id: 'c-005', name: 'Estudio Creativo Nexos', document: 'DEMO-20300000005', email: 'hola@estudiosnexos.demo', phone: '+51 999 000 005' },
  { id: 'c-006', name: 'Héctor Ramírez', document: 'DEMO-10444444444', email: 'hector.demo@mail.com', phone: '+51 999 000 006' },
]

export const products: Product[] = [
  { id: 'p-001', code: 'ACC-001', name: 'Teclado inalámbrico K300', category: 'Accesorios', unit: 'NIU', price: 159, stock: 38 },
  { id: 'p-002', code: 'ACC-002', name: 'Mouse silencioso M20', category: 'Accesorios', unit: 'NIU', price: 79, stock: 52 },
  { id: 'p-003', code: 'ACC-003', name: 'Cable HDMI 2.1 2 m', category: 'Cables', unit: 'NIU', price: 69, stock: 120 },
  { id: 'p-004', code: 'MON-024', name: 'Monitor 24" Full HD', category: 'Pantallas', unit: 'NIU', price: 749, stock: 18 },
  { id: 'p-005', code: 'MOB-005', name: 'Laptop stand aluminio', category: 'Mobiliario', unit: 'NIU', price: 189, stock: 24 },
  { id: 'p-006', code: 'ACC-006', name: 'Hub USB-C 7 en 1', category: 'Conectividad', unit: 'NIU', price: 239, stock: 30 },
  { id: 'p-007', code: 'ACC-007', name: 'Webcam Full HD', category: 'Video', unit: 'NIU', price: 259, stock: 27 },
  { id: 'p-008', code: 'AUD-008', name: 'Headset Bluetooth Pro', category: 'Audio', unit: 'NIU', price: 299, stock: 36 },
  { id: 'p-009', code: 'STO-009', name: 'SSD NVMe 1 TB', category: 'Almacenamiento', unit: 'NIU', price: 459, stock: 44 },
  { id: 'p-010', code: 'STO-010', name: 'Memoria RAM 16 GB', category: 'Memoria', unit: 'NIU', price: 319, stock: 40 },
  { id: 'p-011', code: 'ACC-011', name: 'Mousepad XL', category: 'Accesorios', unit: 'NIU', price: 49, stock: 80 },
  { id: 'p-012', code: 'ACC-012', name: 'Cargador USB-C 30 W', category: 'Energía', unit: 'NIU', price: 99, stock: 64 },
]

export const seedQuotes: Quote[] = [
  {
    id: 'q-seed-2',
    number: 'Q-2042',
    customerId: 'c-002',
    customerName: 'Innova Retail SAC',
    createdAt: daysAgo(0, 9),
    discountPercentage: 5,
    status: 'Pendiente',
    items: [
      { productId: 'p-006', quantity: 2, unitPrice: 239 },
      { productId: 'p-008', quantity: 1, unitPrice: 299 },
    ],
  },
  {
    id: 'q-seed-1',
    number: 'Q-2041',
    customerId: 'c-001',
    customerName: 'Nuevo Horizonte SAC',
    createdAt: daysAgo(1, 16),
    discountPercentage: 0,
    status: 'Cerrada',
    items: [
      { productId: 'p-003', quantity: 2, unitPrice: 69 },
      { productId: 'p-002', quantity: 1, unitPrice: 79 },
      { productId: 'p-001', quantity: 1, unitPrice: 159 },
    ],
  },
]

export const seedSales: Sale[] = [
  { id: 's-seed-5', number: 'V-3104', customerName: 'Nuevo Horizonte SAC', createdAt: daysAgo(0, 10), total: 966, items: [{ productId: 'p-004', quantity: 1, unitPrice: 749 }, { productId: 'p-002', quantity: 1, unitPrice: 79 }, { productId: 'p-012', quantity: 1, unitPrice: 99 }] },
  { id: 's-seed-4', number: 'V-3103', customerName: 'Innova Retail SAC', createdAt: daysAgo(1, 12), total: 377, items: [{ productId: 'p-006', quantity: 1, unitPrice: 239 }, { productId: 'p-007', quantity: 1, unitPrice: 259 }, { productId: 'p-011', quantity: 2, unitPrice: 49 }] },
  { id: 's-seed-3', number: 'V-3102', customerName: 'Distribuidora Andina', createdAt: daysAgo(3, 11), total: 1365, items: [{ productId: 'p-009', quantity: 2, unitPrice: 459 }, { productId: 'p-010', quantity: 1, unitPrice: 319 }] },
  { id: 's-seed-2', number: 'V-3101', customerName: 'Tech Solutions Perú', createdAt: daysAgo(6, 15), total: 458, items: [{ productId: 'p-001', quantity: 2, unitPrice: 159 }, { productId: 'p-011', quantity: 3, unitPrice: 49 }] },
  { id: 's-seed-1', number: 'V-3100', customerName: 'Estudio Creativo Nexos', createdAt: daysAgo(12, 10), total: 299, items: [{ productId: 'p-008', quantity: 1, unitPrice: 299 }] },
]
