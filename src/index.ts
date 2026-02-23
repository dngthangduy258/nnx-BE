import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  NNX_BUCKET: R2Bucket
  R2_PUBLIC_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

app.get('/', (c) => {
  return c.text('NNX Agro Shop API v2')
})

// --- Auth ---
app.post('/api/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    const user = await c.env.DB.prepare('SELECT * FROM users WHERE username = ? AND password = ?')
      .bind(username, password)
      .first()

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    return c.json({ message: 'Login successful', user: { id: user.id, username: user.username, role: user.role } })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// --- Categories & Products ---
app.get('/api/categories', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM categories').all()
    return c.json(results)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

app.get('/api/products', async (c) => {
  try {
    const { category, search } = c.req.query()
    let query = 'SELECT * FROM products WHERE 1=1'
    const params: any[] = []

    if (category && category !== 'all') {
      query += ' AND category = ?'
      params.push(category)
    }

    let { results } = await c.env.DB.prepare(query).bind(...params).all()

    if (search) {
      const lowerSearch = search.toLowerCase()
      results = results.filter((p: any) =>
        (p.name && p.name.toLowerCase().includes(lowerSearch)) ||
        (p.description && p.description.toLowerCase().includes(lowerSearch))
      )
    }

    return c.json(results)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

app.get('/api/products/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const product = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first()
    if (!product) return c.json({ error: 'Product not found' }, 404)
    return c.json(product)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// Admin Product CRUD
app.post('/api/products', async (c) => {
  try {
    const { name, category, price, image, description } = await c.req.json()
    const { meta } = await c.env.DB.prepare(
      'INSERT INTO products (name, category, price, image, description) VALUES (?, ?, ?, ?, ?)'
    ).bind(name, category, price, image, description).run()
    return c.json({ message: 'Product created', id: meta.last_row_id }, 201)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

app.put('/api/products/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { name, category, price, image, description } = await c.req.json()
    await c.env.DB.prepare(
      'UPDATE products SET name = ?, category = ?, price = ?, image = ?, description = ? WHERE id = ?'
    ).bind(name, category, price, image, description, id).run()
    return c.json({ message: 'Product updated' })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

app.delete('/api/products/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run()
    return c.json({ message: 'Product deleted' })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// --- Orders ---
app.post('/api/orders', async (c) => {
  try {
    const { name, phone, address, items, total } = await c.req.json()
    const trackingId = (globalThis as any).crypto.randomUUID()

    // Create Order
    const { meta } = await c.env.DB.prepare(
      'INSERT INTO orders (tracking_id, customer_name, customer_phone, customer_address, total_amount) VALUES (?, ?, ?, ?, ?)'
    ).bind(trackingId, name, phone, address, total).run()

    const orderId = meta.last_row_id

    // Create Order Items
    const itemQueries = items.map((item: any) =>
      c.env.DB.prepare('INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)')
        .bind(orderId, item.id, item.quantity, item.price)
    )
    await c.env.DB.batch(itemQueries)

    // Initial Tracking
    await c.env.DB.prepare('INSERT INTO tracking (order_id, status, note) VALUES (?, ?, ?)')
      .bind(orderId, 'pending', 'Đơn hàng mới được tạo')
      .run()

    return c.json({ message: 'Order created', orderId, trackingId }, 201)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

app.get('/api/orders/:trackingId', async (c) => {
  try {
    const trackingId = c.req.param('trackingId')
    const order = await c.env.DB.prepare('SELECT * FROM orders WHERE tracking_id = ?').bind(trackingId).first()
    if (!order) return c.json({ error: 'Order not found' }, 404)

    const orderId = order.id
    const { results: items } = await c.env.DB.prepare(
      'SELECT oi.*, p.name as product_name, p.image as product_image FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?'
    ).bind(orderId).all()
    const { results: tracking } = await c.env.DB.prepare('SELECT * FROM tracking WHERE order_id = ? ORDER BY timestamp DESC').bind(orderId).all()

    return c.json({ ...order, items, tracking })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

// --- Admin Orders ---
app.get('/api/admin/orders', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
    return c.json(results)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

app.get('/api/orders/lookup/phone/:phone', async (c) => {
  try {
    const phone = c.req.param('phone')
    const { results } = await c.env.DB.prepare('SELECT id, tracking_id, total_amount, status, created_at FROM orders WHERE customer_phone = ? ORDER BY created_at DESC')
      .bind(phone)
      .all()
    return c.json(results)
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

app.patch('/api/admin/orders/:id/status', async (c) => {
  try {
    const id = c.req.param('id')
    const { status, note } = await c.req.json()

    await c.env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(status, id).run()
    await c.env.DB.prepare('INSERT INTO tracking (order_id, status, note) VALUES (?, ?, ?)')
      .bind(id, status, note || `Cập nhật trạng thái: ${status}`)
      .run()

    return c.json({ message: 'Status updated' })
  } catch (e: any) {
    return c.json({ error: e.message }, 500)
  }
})

export default app
