import * as s from '@common/node/services';

const knex = () => s.get('knex1');

const generateOrderNumber = async () => {
  const lastOrder = await knex()('orders').orderBy('id', 'desc').first();
  const nextNum = lastOrder ? parseInt(lastOrder.order_number) + 1 : 1;
  return String(nextNum).padStart(5, '0');
};

const create = async (req, res, next) => {
  try {
    const { customer_name, customer_email, shipping_address, notes, items } = req.body;

    if (!customer_name || !customer_email || !shipping_address || !items || !items.length) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    for (const item of items) {
      if (!item.product_variant_id || !item.quantity) {
        return res.status(400).json({ error: 'Each item needs product_variant_id and quantity' });
      }
      const variant = await knex()('product_variants').where({ id: item.product_variant_id }).first();
      if (!variant || variant.stock_quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for variant ${item.product_variant_id}` });
      }
    }

    const order_number = await generateOrderNumber();
    let total_amount = 0;

    for (const item of items) {
      const variant = await knex()('product_variants').where({ id: item.product_variant_id }).first();
      const product = await knex()('products').where({ id: variant.product_id }).first();
      const unitPrice = parseFloat(product.base_price) + parseFloat(variant.price_adjustment || 0);
      total_amount += unitPrice * item.quantity;
    }

    const trx = await knex().transaction();
    try {
      const [orderId] = await trx('orders').insert({
        order_number,
        customer_name,
        customer_email,
        shipping_address,
        notes,
        status: 'pending',
        total_amount,
        created_at: new Date(),
        updated_at: new Date(),
      });

      for (const item of items) {
        const variant = await trx('product_variants').where({ id: item.product_variant_id }).first();
        const product = await trx('products').where({ id: variant.product_id }).first();
        const unitPrice = parseFloat(product.base_price) + parseFloat(variant.price_adjustment || 0);
        const subtotal = unitPrice * item.quantity;

        await trx('order_items').insert({
          order_id: orderId,
          product_variant_id: item.product_variant_id,
          quantity: item.quantity,
          unit_price: unitPrice,
          subtotal,
        });

        await trx('product_variants')
          .where({ id: item.product_variant_id })
          .update('stock_quantity', variant.stock_quantity - item.quantity);
      }

      await trx.commit();
      return res.status(201).json({ order_number, status: 'pending' });
    } catch (err) {
      await trx.rollback();
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { order_number } = req.params;
    const { status } = req.body;

    const validStatuses = [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'return_requested',
      'return_in_transit',
      'return_received',
      'return_accepted',
      'return_rejected',
      'refunded',
      'cancelled',
    ];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await knex()('orders').where({ order_number }).first();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await knex()('orders').where({ order_number }).update({ status, updated_at: new Date() });

    return res.status(200).json({ order_number, status });
  } catch (err) {
    next(err);
  }
};

const requestReturn = async (req, res, next) => {
  try {
    const { order_number } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Return reason is required' });
    }

    const order = await knex()('orders').where({ order_number }).first();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({ error: 'Only delivered orders can be returned' });
    }

    await knex()('orders').where({ order_number }).update({
      status: 'return_requested',
      return_reason: reason,
      updated_at: new Date(),
    });

    return res.status(200).json({ success: true, status: 'return_requested' });
  } catch (err) {
    next(err);
  }
};

const findOne = async (req, res, next) => {
  try {
    const { order_number } = req.params;

    const order = await knex()('orders').where({ order_number }).first();
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await knex()('order_items')
      .join('product_variants', 'order_items.product_variant_id', 'product_variants.id')
      .join('products', 'product_variants.product_id', 'products.id')
      .where({ order_id: order.id })
      .select(
        'order_items.id',
        'order_items.quantity',
        'order_items.unit_price',
        'order_items.subtotal',
        'product_variants.size',
        'product_variants.color',
        'products.name as product_name',
        'products.sku',
      );

    return res.status(200).json({
      ...order,
      items,
    });
  } catch (err) {
    next(err);
  }
};

const findProducts = async (req, res, next) => {
  try {
    const products = await knex()('products').select('*');

    for (const product of products) {
      product.variants = await knex()('product_variants')
        .where({ product_id: product.id })
        .select('id', 'size', 'color', 'price_adjustment', 'stock_quantity');
    }

    return res.status(200).json(products);
  } catch (err) {
    next(err);
  }
};

export default {
  create,
  updateStatus,
  requestReturn,
  findOne,
  findProducts,
};
