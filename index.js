const express = require('express');
const bodyParser = require('body-parser');
const knex = require('knex')(require('./knexfile').development);
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// simple auth
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await knex('users').where({ username }).first();
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { id: user.id, name: user.name, username: user.username, role: user.role } });
});

function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h) return res.status(401).json({ error: 'no token' });
  const parts = h.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid token' });
  jwt.verify(parts[1], JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'invalid token' });
    req.user = payload;
    next();
  });
}

// categories & items
app.get('/api/categories', async (req, res) => {
  const cats = await knex('categories').orderBy('position', 'asc');
  res.json(cats);
});
app.get('/api/items', async (req, res) => {
  const items = await knex('items').where({ active: 1 }).orderBy('name');
  res.json(items);
});

// create order
app.post('/api/orders', async (req, res) => {
  const { order_type, table_no, items, tax=0, discount=0 } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items required' });
  const trx = await knex.transaction();
  try {
    let total = 0;
    for (const it of items) {
      total += parseFloat(it.price) * parseInt(it.qty || 1);
    }
    const [orderId] = await trx('orders').insert({
      order_type, table_no, total, tax, discount, status: 'open'
    });
    for (const it of items) {
      await trx('order_items').insert({
        order_id: orderId,
        item_id: it.item_id,
        qty: it.qty || 1,
        price: it.price,
        notes: it.notes || null
      });
    }
    await trx.commit();
    res.json({ orderId, total });
  } catch (e) {
    await trx.rollback();
    console.error(e);
    res.status(500).json({ error: 'could not create order' });
  }
});

app.get('/api/orders', async (req, res) => {
  const orders = await knex('orders').orderBy('created_at', 'desc').limit(100);
  res.json(orders);
});

app.get('/api/orders/:id', async (req, res) => {
  const id = req.params.id;
  const order = await knex('orders').where({ id }).first();
  if (!order) return res.status(404).json({ error: 'not found' });
  const items = await knex('order_items').where({ order_id: id });
  res.json({ order, items });
});

// admin protected endpoints
app.post('/api/items', auth, async (req, res) => {
  const { name, description, price, category_id } = req.body;
  const [id] = await knex('items').insert({ name, description, price, category_id, active:1 });
  res.json({ id });
});

app.put('/api/items/:id', auth, async (req, res) => {
  const id = req.params.id;
  await knex('items').where({ id }).update(req.body);
  res.json({ ok: true });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log('Server running on port', PORT);
  // ensure DB exists and initialized
  const init = require('./db_init');
});
