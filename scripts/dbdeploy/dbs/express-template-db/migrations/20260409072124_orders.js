/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('products', (table) => {
    table.increments('id').primary()
    table.string('sku').unique()
    table.string('name')
    table.string('category')
    table.text('description')
    table.decimal('base_price')
  })

  await knex.schema.createTable('product_variants', (table) => {
    table.increments('id').primary()
    table.integer('product_id').unsigned().references('products.id')
    table.string('size')
    table.string('color')
    table.string('sku_suffix')
    table.decimal('price_adjustment').defaultTo(0)
    table.integer('stock_quantity')
    table.unique(['product_id', 'size', 'color'])
  })

  await knex.schema.createTable('orders', (table) => {
    table.increments('id').primary()
    table.string('order_number').unique()
    table.string('customer_name')
    table.string('customer_email')
    table.string('status').defaultTo('pending')
    table.decimal('total_amount')
    table.text('shipping_address')
    table.text('notes')
    table.datetime('created_at')
    table.datetime('updated_at')
  })

  await knex.schema.createTable('order_items', (table) => {
    table.increments('id').primary()
    table.integer('order_id').unsigned().references('orders.id')
    table.integer('product_variant_id').unsigned().references('product_variants.id')
    table.integer('quantity')
    table.decimal('unit_price')
    table.decimal('subtotal')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('order_items')
  await knex.schema.dropTableIfExists('orders')
  await knex.schema.dropTableIfExists('product_variants')
  await knex.schema.dropTableIfExists('products')
}
