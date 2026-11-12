export type Customer = {
  id: string
  name: string
  document: string
  email: string
  phone: string
}

export type Product = {
  id: string
  code: string
  name: string
  category: string
  unit: string
  price: number
  stock: number
}

export type QuoteItem = {
  productId: string
  quantity: number
  unitPrice: number
}

export type QuoteStatus = 'Pendiente' | 'Cerrada' | 'Anulada'

export type Quote = {
  id: string
  number: string
  customerId: string
  customerName: string
  createdAt: string
  discountPercentage: number
  status: QuoteStatus
  items: QuoteItem[]
}

export type Sale = {
  id: string
  number: string
  customerName: string
  createdAt: string
  total: number
  items: QuoteItem[]
}
