import postgres from 'postgres';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required. Run migrations before seeding.');

const catalogue = [
  ['chain-sandals', 'NB-SHOE-CHAIN-GOLD', 'Chain Sandals', 3200000, 'Gold', 'Shoes', null, 'hero-left.png', 'A polished block-heel sandal finished with a delicate gold chain detail.', ['37', '38', '39', '40', '41'], true],
  ['embroidered-coord', 'NB-SET-EMB-NAVY', 'Embroidered Co-ord', 4850000, 'Navy', 'Sets', null, 'product-two.png', 'A relaxed two-piece set with bold embroidered motifs and an easy drape.', ['S', 'M', 'L', 'XL'], true],
  ['crystal-slingback', 'NB-SHOE-CRYSTAL-WHITE', 'Crystal Slingback', 3800000, 'White', 'Shoes', null, 'product-three.png', 'A graceful slingback with a sculpted heel and crystal-trimmed mesh.', ['37', '38', '39', '40', '41'], true],
  ['casa-shirt', 'NB-TOP-CASA-SKY', 'Casa Shirt', 2750000, 'Sky', 'Tops', null, 'product-four.png', 'An expressive resort shirt with a fluid fit and statement back artwork.', ['S', 'M', 'L', 'XL'], true],
  ['sunrise-wrap-dress', 'NB-DRESS-SUNRISE-DAWN', 'Sunrise Wrap Dress', 4200000, 'Dawn', 'Dresses', 'sunrise', 'sunrise-one.png', 'A light wrap silhouette in soft sunrise florals, made for warm days.', ['S', 'M', 'L'], false],
  ['meadow-ruffle-dress', 'NB-DRESS-MEADOW-GREEN', 'Meadow Ruffle Dress', 4600000, 'Green', 'Dresses', 'sunrise', 'sunrise-two.png', 'A playful tiered dress with generous movement and vivid green blooms.', ['S', 'M', 'L'], false],
  ['daybreak-set', 'NB-SET-DAYBREAK-BLUE', 'Daybreak Set', 3500000, 'Blue', 'Sets', 'sunrise', 'sunrise-three.png', 'A breezy matching set with scalloped detailing and an effortless cut.', ['S', 'M', 'L', 'XL'], false],
];

const sortOrder = { S: 10, M: 20, L: 30, XL: 40, '37': 37, '38': 38, '39': 39, '40': 40, '41': 41 };
const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

try {
  await sql.begin(async (tx) => {
    for (const [, , , , , , , , , productSizes] of catalogue) {
      for (const label of productSizes) await tx`INSERT INTO sizes (label, sort_order) VALUES (${label}, ${sortOrder[label]}) ON CONFLICT (label) DO UPDATE SET sort_order = EXCLUDED.sort_order`;
    }
    for (const [slug, sku, name, priceCents, color, category, collection, imagePath, description, productSizes, isNew] of catalogue) {
      const product = await tx`
        INSERT INTO products (slug, name, description, category, collection, image_path, is_new, is_active)
        VALUES (${slug}, ${name}, ${description}, ${category}, ${collection}, ${imagePath}, ${isNew}, true)
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, category = EXCLUDED.category, collection = EXCLUDED.collection, image_path = EXCLUDED.image_path, is_new = EXCLUDED.is_new, is_active = true, updated_at = now()
        RETURNING id
      `;
      const variant = await tx`
        INSERT INTO product_variants (product_id, sku, color, price_cents, is_active)
        VALUES (${product[0].id}, ${sku}, ${color}, ${priceCents}, true)
        ON CONFLICT (sku) DO UPDATE SET product_id = EXCLUDED.product_id, color = EXCLUDED.color, price_cents = EXCLUDED.price_cents, is_active = true, updated_at = now()
        RETURNING id
      `;
      for (const label of productSizes) {
        const size = await tx`SELECT id FROM sizes WHERE label = ${label}`;
        await tx`INSERT INTO inventory (variant_id, size_id, on_hand, reserved) VALUES (${variant[0].id}, ${size[0].id}, 12, 0) ON CONFLICT (variant_id, size_id) DO NOTHING`;
      }
    }
  });
  console.log(`Seeded ${catalogue.length} products.`);
} finally {
  await sql.end();
}
