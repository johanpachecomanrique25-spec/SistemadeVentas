import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  FileText,
  LayoutDashboard,
  Minus,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'

import { customers, products, seedQuotes, seedSales } from './data'
import type { Product, Quote, Sale } from './types'
import './styles.css'

type Tab = 'panel' | 'cotizaciones' | 'productos'
type Toast = { id: number; message: string }

const currency = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
})

const dateTime = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const shortDay = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
})

const STORAGE_KEY = 'sistema-ventas-demo-v1'

type DemoState = {
  products: Product[]
  quotes: Quote[]
  sales: Sale[]
}

const totals = (items: Quote['items'], discountPercentage = 0) => {
  const productById = new Map(products.map((product) => [product.id, product]))
  const gross = items.reduce((sum, item) => {
    const product = productById.get(item.productId)
    return sum + (product?.price ?? item.unitPrice) * item.quantity
  }, 0)
  const discountAmount = gross * (discountPercentage / 100)
  const total = Math.max(gross - discountAmount, 0)
  const subtotal = total / 1.18
  const igv = total - subtotal
  return { gross, discountAmount, subtotal, igv, total }
}

const defaultState = (): DemoState => ({
  products,
  quotes: seedQuotes,
  sales: seedSales,
})

const loadState = (): DemoState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw) as DemoState
    return {
      products: parsed.products?.length ? parsed.products : products,
      quotes: parsed.quotes ?? seedQuotes,
      sales: parsed.sales ?? seedSales,
    }
  } catch {
    return defaultState()
  }
}

const titleCase = (value: string) =>
  value.replace(/_/g, ' ').replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())

const newQuoteId = (number: number) => `quote-${number}`

export default function App() {
  const [tab, setTab] = useState<Tab>('panel')
  const [state, setState] = useState<DemoState>(loadState)
  const [toast, setToast] = useState<Toast | null>(null)
  const [search, setSearch] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [quoteNumber, setQuoteNumber] = useState(2043)
  const [cartCustomer, setCartCustomer] = useState(customers[0].id)
  const [cartDiscount, setCartDiscount] = useState(0)
  const [cartItems, setCartItems] = useState<Quote['items']>([])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    const highest = state.quotes.reduce((max, quote) => {
      const value = Number(quote.number.replace('Q-', ''))
      return Number.isFinite(value) ? Math.max(max, value) : max
    }, 2042)
    setQuoteNumber(highest + 1)
  }, [state.quotes])

  const notify = (message: string) => {
    setToast({ id: Date.now(), message })
    window.setTimeout(() => setToast(null), 2800)
  }

  const quoteTotals = totals(cartItems, cartDiscount)

  const filteredQuotes = useMemo(() => {
    const term = search.trim().toLowerCase()
    return [...state.quotes]
      .filter((quote) => !term || [quote.number, quote.customerName, quote.status].join(' ').toLowerCase().includes(term))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [search, state.quotes])

  const filteredProducts = useMemo(() => {
    const term = productFilter.trim().toLowerCase()
    return state.products.filter((product) =>
      !term || [product.code, product.name, product.category].join(' ').toLowerCase().includes(term),
    )
  }, [productFilter, state.products])

  const productById = useMemo(
    () => new Map(state.products.map((product) => [product.id, product])),
    [state.products],
  )

  const stats = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7)
    const monthlySales = state.sales.filter((sale) => sale.createdAt.startsWith(monthKey))
    const pendingQuotes = state.quotes.filter((quote) => quote.status === 'Pendiente')
    const pendingValue = pendingQuotes.reduce((sum, quote) => sum + totals(quote.items, quote.discountPercentage).total, 0)
    const averageTicket = monthlySales.length ? monthlySales.reduce((sum, sale) => sum + sale.total, 0) / monthlySales.length : 0
    return {
      monthlyTotal: monthlySales.reduce((sum, sale) => sum + sale.total, 0),
      averageTicket,
      pendingQuotes: pendingQuotes.length,
      pendingValue,
      activeProducts: state.products.filter((product) => product.stock > 0).length,
    }
  }, [state.quotes, state.sales, state.products])

  const salesByDay = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (13 - index))
      const key = date.toISOString().slice(0, 10)
      const total = state.sales.filter((sale) => sale.createdAt.startsWith(key)).reduce((sum, sale) => sum + sale.total, 0)
      return { label: shortDay.format(date), total }
    })
  }, [state.sales])

  const topProducts = useMemo(() => {
    const counter = new Map<string, { name: string; quantity: number }>()
    for (const sale of state.sales) {
      for (const item of sale.items) {
        const product = productById.get(item.productId)
        const current = counter.get(item.productId) ?? { name: product?.name ?? 'Producto', quantity: 0 }
        current.quantity += item.quantity
        counter.set(item.productId, current)
      }
    }
    return [...counter.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5)
  }, [productById, state.sales])

  const maxSales = Math.max(...salesByDay.map((entry) => entry.total), 1)

  const addProduct = (product: Product) => {
    setCartItems((items) => {
      const existing = items.find((item) => item.productId === product.id)
      if (existing) {
        return items.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...items, { productId: product.id, quantity: 1, unitPrice: product.price }]
    })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setCartItems((items) => items.filter((item) => item.productId !== productId))
      return
    }
    setCartItems((items) =>
      items.map((item) => (item.productId === productId ? { ...item, quantity } : item)),
    )
  }

  const saveQuote = () => {
    if (!cartItems.length) {
      notify('Agrega al menos un producto a la cotización.')
      return
    }
    const number = `Q-${quoteNumber}`
    const customer = customers.find((item) => item.id === cartCustomer)
    const quote: Quote = {
      id: newQuoteId(quoteNumber),
      number,
      customerId: cartCustomer,
      customerName: customer?.name ?? 'Cliente demo',
      createdAt: new Date().toISOString(),
      discountPercentage: cartDiscount,
      status: 'Pendiente',
      items: cartItems.map((item) => ({ ...item })),
    }
    setState((current) => ({ ...current, quotes: [quote, ...current.quotes] }))
    setCartItems([])
    setCartDiscount(0)
    setTab('cotizaciones')
    notify(`${number} guardada correctamente.`)
  }

  const duplicateQuote = (quote: Quote) => {
    const number = `Q-${quoteNumber}`
    setState((current) => ({
      ...current,
      quotes: [
        {
          ...quote,
          id: newQuoteId(quoteNumber),
          number,
          createdAt: new Date().toISOString(),
          status: 'Pendiente',
          items: quote.items.map((item) => ({ ...item })),
        },
        ...current.quotes,
      ],
    }))
    notify(`${number} duplicada como pendiente.`)
  }

  const deleteQuote = (id: string) => {
    setState((current) => ({ ...current, quotes: current.quotes.filter((quote) => quote.id !== id) }))
    notify('Cotización eliminada.')
  }

  const convertToSale = (quote: Quote) => {
    const quoteItems = quote.items
    for (const item of quoteItems) {
      const product = state.products.find((entry) => entry.id === item.productId)
      if ((product?.stock ?? 0) < item.quantity) {
        notify(`Stock insuficiente para ${product?.name ?? 'un producto'}.`)
        return
      }
    }

    const amount = totals(quote.items, quote.discountPercentage).total
    const saleCount = state.sales.length + 3100
    const sale: Sale = {
      id: `sale-${saleCount}`,
      number: `V-${saleCount}`,
      customerName: quote.customerName,
      createdAt: new Date().toISOString(),
      total: amount,
      items: quote.items.map((item) => ({ ...item })),
    }

    setState((current) => ({
      products: current.products.map((product) => {
        const sold = quoteItems.find((item) => item.productId === product.id)
        return sold ? { ...product, stock: product.stock - sold.quantity } : product
      }),
      sales: [sale, ...current.sales],
      quotes: current.quotes.map((entry) => (entry.id === quote.id ? { ...entry, status: 'Cerrada' } : entry)),
    }))
    notify(`${quote.number} convertida en ${sale.number}.`)
  }

  const selectedQuoteItems = selectedQuote?.items ?? []
  const selectedQuoteTotals = totals(selectedQuoteItems, selectedQuote?.discountPercentage ?? 0)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">SV</div>
          <div>
            <strong>Sistema de Ventas</strong>
            <span>Demo pública · Cotizaciones</span>
          </div>
        </div>

        <nav className="nav-stack" aria-label="Módulos">
          <button className={tab === 'panel' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('panel')}><LayoutDashboard size={18} />Panel</button>
          <button className={tab === 'cotizaciones' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('cotizaciones')}><FileText size={18} />Cotizaciones</button>
          <button className={tab === 'productos' ? 'nav-item active' : 'nav-item'} onClick={() => setTab('productos')}><Package size={18} />Productos</button>
        </nav>

        <div className="sidebar-note">
          <span className="note-kicker">Demo interactiva</span>
          <p>Los datos son ficticios y se guardan en tu navegador.</p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">Panel comercial</span>
            <h1>{tab === 'panel' ? 'Resumen de ventas' : tab === 'cotizaciones' ? 'Cotizaciones' : 'Productos'}</h1>
          </div>
          <div className="topbar-right"><span className="status-dot" />{state.products.filter((product) => product.stock > 0).length} activos&nbsp;· {state.quotes.length} documentos</div>
        </header>

        {toast && <div className="toast" key={toast.id}><CheckCircle2 size={17} />{toast.message}</div>}

        {tab === 'panel' && (
          <div className="page-stack">
            <section className="hero">
              <div>
                <span className="eyebrow">Portafolio React</span>
                <h2>Una experiencia comercial clara, rápida y moderna.</h2>
                <p>Sistema de Ventas es una demo funcional de cotizaciones: crea presupuestos, revisa el desempeño y convierte una oportunidad en venta.</p>
                <button className="hero-action" onClick={() => setTab('cotizaciones')}>Crear cotización <ArrowRight size={17} /></button>
              </div>
              <div className="hero-card">
                <span>Cotizaciones pendientes</span>
                <strong>{stats.pendingQuotes}</strong>
                <p>{currency.format(stats.pendingValue)} en valor potencial</p>
              </div>
            </section>

            <section className="kpi-row">
              <article className="kpi-card"><span>Ventas del mes</span><strong>{currency.format(stats.monthlyTotal)}</strong></article>
              <article className="kpi-card"><span>Ticket promedio</span><strong>{currency.format(stats.averageTicket)}</strong></article>
              <article className="kpi-card"><span>Productos activos</span><strong>{stats.activeProducts}</strong></article>
              <article className="kpi-card amber"><span>Pendientes</span><strong>{stats.pendingQuotes}</strong></article>
            </section>

            <div className="content-grid">
              <section className="card chart-card">
                <div className="card-head"><div><span className="eyebrow">Últimos 14 días</span><h3>Ritmo comercial</h3></div></div>
                <div className="bar-chart">
                  {salesByDay.map((entry, index) => <div className="bar-column" key={index}><div className="bar" style={{ height: `${Math.max((entry.total / maxSales) * 100, 5)}%` }} title={`${currency.format(entry.total)}`} /><span>{entry.label}</span></div>)}
                </div>
              </section>

              <section className="card">
                <div className="card-head"><div><span className="eyebrow">Ranking</span><h3>Más vendidos</h3></div></div>
                <div className="rank-list">
                  {topProducts.map((product) => <div className="rank-item" key={product.name}><span>{product.name}</span><strong>{product.quantity} u.</strong></div>)}
                </div>
              </section>
            </div>

            <section className="card">
              <div className="card-head"><div><span className="eyebrow">Actividad</span><h3>Cotizaciones recientes</h3></div><button className="text-button" onClick={() => setTab('cotizaciones')}>Ver todas <ArrowRight size={15} /></button></div>
              <div className="quote-list compact">
                {state.quotes.slice(0, 5).map((quote) => <button className="quote-row" key={quote.id} onClick={() => setSelectedQuote(quote)}><span><strong>{quote.number}</strong><small>{quote.customerName}</small></span><small>{dateTime.format(new Date(quote.createdAt))}</small><b>{currency.format(totals(quote.items, quote.discountPercentage).total)}</b></button>)}
              </div>
            </section>
          </div>
        )}

        {tab === 'cotizaciones' && (
          <div className="quote-workspace">
            <section className="card builder-card">
              <div className="card-head"><div><span className="eyebrow">Nueva oportunidad</span><h3>Armar cotización</h3></div></div>
              <label className="field-label" htmlFor="customer-select">Cliente</label>
              <select id="customer-select" value={cartCustomer} onChange={(event) => setCartCustomer(event.target.value)}>
                {customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.name}</option>)}
              </select>

              <div className="product-picker">
                <label className="search-control"><Search size={16} /><input placeholder="Buscar producto por código o nombre…" value={productFilter} onChange={(event) => setProductFilter(event.target.value)} /></label>
                <div className="product-results">
                  {filteredProducts.slice(0, 7).map((product) => <button key={product.id} onClick={() => addProduct(product)}><span><strong>{product.name}</strong><small>{product.code} · {product.category}</small></span><b>{currency.format(product.price)}</b></button>)}
                </div>
              </div>

              <div className="cart-header"><h3>Detalle</h3><span>{cartItems.length} líneas</span></div>
              <div className="cart-lines">
                {!cartItems.length ? <p className="empty-cart">Agrega un producto para comenzar.</p> : cartItems.map((item) => {
                  const product = productById.get(item.productId)
                  return <div className="cart-line" key={item.productId}><div><strong>{product?.name}</strong><span>{product?.code} · {currency.format(product?.price ?? item.unitPrice)}</span></div><div className="quantity-control"><button onClick={() => updateQuantity(item.productId, item.quantity - 1)} aria-label="Reducir cantidad"><Minus size={13} /></button><input type="number" min="1" value={item.quantity} onChange={(event) => updateQuantity(item.productId, Number(event.target.value))} aria-label={`Cantidad de ${product?.name}`} /><button onClick={() => updateQuantity(item.productId, item.quantity + 1)} aria-label="Aumentar cantidad"><Plus size={13} /></button></div><button className="icon-button danger" onClick={() => updateQuantity(item.productId, 0)} aria-label="Eliminar producto"><Trash2 size={16} /></button></div>
                })}
              </div>
              <div className="summary">
                <div><span>Subtotal</span><strong>{currency.format(quoteTotals.subtotal)}</strong></div>
                <div><span>IGV (18%)</span><strong>{currency.format(quoteTotals.igv)}</strong></div>
                <label><span>Descuento</span><input type="number" min="0" max="100" value={cartDiscount} onChange={(event) => setCartDiscount(Number(event.target.value) || 0)} /> %</label>
                <div className="grand-total"><span>Total</span><strong>{currency.format(quoteTotals.total)}</strong></div>
              </div>
              <button className="primary-button" onClick={saveQuote}>Guardar cotización <Plus size={17} /></button>
            </section>

            <section className="card quote-table-card">
              <div className="card-head list-head"><div><span className="eyebrow">Historial</span><h3>Cotizaciones</h3></div><label className="compact-search"><Search size={15} /><input placeholder="Buscar cliente o número…" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Número</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th>Total</th><th /></tr></thead>
                  <tbody>{filteredQuotes.map((quote) => <tr key={quote.id}><td><strong>{quote.number}</strong></td><td>{quote.customerName}</td><td>{dateTime.format(new Date(quote.createdAt))}</td><td><span className={`badge ${quote.status.toLowerCase()}`}>{quote.status}</span></td><td>{currency.format(totals(quote.items, quote.discountPercentage).total)}</td><td><div className="row-actions"><button className="icon-button" title="Duplicar" onClick={() => duplicateQuote(quote)}><Copy size={15} /></button><button className="icon-button danger" title="Eliminar" onClick={() => deleteQuote(quote.id)}><Trash2 size={15} /></button><button className="small-convert" onClick={() => convertToSale(quote)} disabled={quote.status !== 'Pendiente'}>Convertir</button></div></td></tr>)}</tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {tab === 'productos' && (
          <div className="page-stack">
            <section className="page-intro"><div><span className="eyebrow">Catálogo</span><h2>Productos de demostración</h2><p>Productos ficticios preparados para probar el flujo completo de cotización y venta.</p></div><span className="eyebrow">{state.products.length} productos</span></section>
            <div className="card"><label className="search-control full"><Search size={17} /><input autoFocus placeholder="Buscar código, nombre o categoría…" value={productFilter} onChange={(event) => setProductFilter(event.target.value)} /></label></div>
            <div className="product-grid">
              {filteredProducts.map((product) => <article className="product-card" key={product.id}><div><span className="product-code">{product.code}</span><h3>{product.name}</h3><p>{titleCase(product.category)} · {product.unit}</p></div><div className="product-footer"><strong>{currency.format(product.price)}</strong><span>{product.stock} en stock</span></div><button className="secondary-button" onClick={() => addProduct(product)}>Cotizar <Plus size={15} /></button></article>)}
            </div>
          </div>
        )}
      </main>

      {selectedQuote && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="quote-title">
          <div className="modal">
            <div className="modal-head"><div><span className="eyebrow">Detalle</span><h2 id="quote-title">{selectedQuote.number}</h2></div><button className="icon-button" onClick={() => setSelectedQuote(null)} aria-label="Cerrar"><X size={19} /></button></div>
            <dl className="quote-detail"><div><dt>Cliente</dt><dd>{selectedQuote.customerName}</dd></div><div><dt>Fecha</dt><dd>{dateTime.format(new Date(selectedQuote.createdAt))}</dd></div><div><dt>Estado</dt><dd>{selectedQuote.status}</dd></div></dl>
            <div className="detail-lines">{selectedQuote.items.map((item) => { const product = productById.get(item.productId); return <div key={item.productId}><span>{product?.name ?? 'Producto'} <small>× {item.quantity}</small></span><strong>{currency.format((product?.price ?? item.unitPrice) * item.quantity)}</strong></div> })}</div>
            <div className="detail-total"><span>Total</span><strong>{currency.format(selectedQuoteTotals.total)}</strong></div>
            <button className="primary-button" onClick={() => { addProductToSelectedQuote(); }}>Copiar líneas al carrito <Plus size={17} /></button>
          </div>
        </div>
      )}
    </div>
  )

  function addProductToSelectedQuote() {
    if (!selectedQuote) return
    selectedQuote.items.forEach((item) => {
      const product = productById.get(item.productId)
      if (product) {
        for (let index = 0; index < item.quantity; index += 1) addProduct(product)
      }
    })
    setSelectedQuote(null)
    setTab('cotizaciones')
    notify('Las líneas se agregaron al carrito.')
  }
}
