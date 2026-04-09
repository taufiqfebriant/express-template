/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Clear existing entries
  await knex('product_variants').del();
  await knex('products').del();

  const products = [
    {
      sku: 'VANS-OLD-SKOOL',
      name: 'Vans Old Skool',
      category: 'Sneakers',
      description: 'Vans Old Skool - classic skate shoe with signature side stripe',
      base_price: 850000,
      sizes: [39, 40, 41, 42, 43],
      colors: [
        { name: 'Hitam Putih', suffix: 'HP' },
        { name: 'Navy', suffix: 'NV' }
      ]
    },
    {
      sku: 'VANS-AUTHENTIC',
      name: 'Vans Authentic',
      category: 'Sneakers',
      description: 'Vans Authentic - original classic canvas sneaker',
      base_price: 750000,
      sizes: [38, 39, 40, 41, 42],
      colors: [
        { name: 'Hitam', suffix: 'BK' },
        { name: 'Putih', suffix: 'WH' }
      ]
    },
    {
      sku: 'VANS-SLIP-ON-CLASSIC',
      name: 'Vans Slip-On Classic',
      category: 'Slip-On',
      description: 'Vans Slip-On Classic - effortless style with elastic side pockets',
      base_price: 800000,
      sizes: [39, 40, 41, 42, 43],
      colors: [
        { name: 'Checkerboard', suffix: 'CB' },
        { name: 'Hitam', suffix: 'BK' }
      ]
    },
    {
      sku: 'VANS-SK8-HI',
      name: 'Vans Sk8-Hi',
      category: 'High-Top',
      description: 'Vans Sk8-Hi - legendary high-top skate shoe with padded ankle support',
      base_price: 950000,
      sizes: [40, 41, 42, 43, 44],
      colors: [
        { name: 'Hitam Putih', suffix: 'HB' },
        { name: 'Hitam', suffix: 'BK' }
      ]
    },
    {
      sku: 'VANS-ERA',
      name: 'Vans Era',
      category: 'Sneakers',
      description: 'Vans Era - retro-inspired skate shoe with padded collar',
      base_price: 800000,
      sizes: [39, 40, 41, 42, 43],
      colors: [
        { name: 'Hitam', suffix: 'BK' },
        { name: 'Merah', suffix: 'RD' }
      ]
    }
  ];

  // Insert products and generate variants
  for (const product of products) {
    const [result] = await knex('products').insert({
      sku: product.sku,
      name: product.name,
      category: product.category,
      description: product.description,
      base_price: product.base_price
    }).returning('id');

    const productId = typeof result === 'object' ? result.id : result;

    // Generate variants: size × color
    const variants = [];
    for (const size of product.sizes) {
      for (const color of product.colors) {
        variants.push({
          product_id: productId,
          size: size.toString(),
          color: color.name,
          sku_suffix: `-${size}-${color.suffix}`,
          price_adjustment: 0,
          stock_quantity: 100
        });
      }
    }

    await knex('product_variants').insert(variants);
  }

  console.log(`Seeded ${products.length} products with variants`);
};