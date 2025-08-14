const fs = require('fs');
const knexConfig = require('./knexfile').development;
const knex = require('knex')(knexConfig);

async function init() {
  // create tables if not exist
  await knex.schema.hasTable('users').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('users', (t) => {
        t.increments('id').primary();
        t.string('name');
        t.string('username').unique();
        t.string('password_hash');
        t.string('role').defaultTo('cashier');
      });
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('admin123', 10);
      await knex('users').insert({name: 'Admin', username: 'admin', password_hash: hash, role: 'manager'});
      console.log('Created users table and default admin (username: admin password: admin123)');
    }
  });

  await knex.schema.hasTable('categories').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('categories', (t) => {
        t.increments('id').primary();
        t.string('name');
        t.integer('position').defaultTo(0);
      });
      await knex('categories').insert([{name:'Main'}, {name:'Sides'}, {name:'Drinks'}]);
    }
  });

  await knex.schema.hasTable('items').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('items', (t) => {
        t.increments('id').primary();
        t.string('name');
        t.text('description');
        t.decimal('price', 10,2);
        t.integer('category_id').references('categories.id');
        t.boolean('active').defaultTo(true);
      });
      await knex('items').insert([
        {name:'Veg Burger', description:'Tasty veg patty', price:99.00, category_id:1},
        {name:'Paneer Roll', description:'Spicy paneer', price:129.00, category_id:1},
        {name:'Fries', description:'Crispy fries', price:69.00, category_id:2}
      ]);
    }
  });

  await knex.schema.hasTable('orders').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('orders', (t) => {
        t.increments('id').primary();
        t.string('order_type');
        t.string('table_no');
        t.decimal('total', 12,2);
        t.decimal('tax', 12,2).defaultTo(0);
        t.decimal('discount', 12,2).defaultTo(0);
        t.string('status').defaultTo('open');
        t.timestamp('created_at').defaultTo(knex.fn.now());
      });
    }
  });

  await knex.schema.hasTable('order_items').then(async (exists) => {
    if (!exists) {
      await knex.schema.createTable('order_items', (t) => {
        t.increments('id').primary();
        t.integer('order_id').references('orders.id');
        t.integer('item_id').references('items.id');
        t.integer('qty').defaultTo(1);
        t.decimal('price', 12,2);
        t.text('notes');
      });
    }
  });

  console.log('DB initialized');
  process.exit(0);
}

init().catch(e => { console.error(e); process.exit(1); });
