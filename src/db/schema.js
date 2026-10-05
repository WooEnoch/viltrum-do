import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
};

export const users = pgTable('auth_users', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()::text`),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date', withTimezone: true }),
  image: text('image'),
});

export const accounts = pgTable('auth_accounts', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => [
  primaryKey({ columns: [table.provider, table.providerAccountId] }),
  index('auth_accounts_user_idx').on(table.userId),
]);

export const sessions = pgTable('auth_sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
}, (table) => [index('auth_sessions_user_idx').on(table.userId)]);

export const verificationTokens = pgTable('auth_verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date', withTimezone: true }).notNull(),
}, (table) => [primaryKey({ columns: [table.identifier, table.token] })]);

export const customers = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  authUserId: text('auth_user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  displayName: text('display_name'),
  imageUrl: text('image_url'),
  ...timestamps,
}, (table) => [index('customers_email_idx').on(table.email)]);

export const mobileSessions = pgTable('mobile_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index('mobile_sessions_customer_idx').on(table.customerId)]);

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  collection: text('collection'),
  imagePath: text('image_path').notNull(),
  isNew: boolean('is_new').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
});

export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  sku: text('sku').notNull().unique(),
  color: text('color').notNull(),
  priceCents: integer('price_cents').notNull(),
  imagePath: text('image_path'),
  isActive: boolean('is_active').default(true).notNull(),
  ...timestamps,
}, (table) => [
  index('product_variants_product_idx').on(table.productId),
  check('product_variants_price_positive', sql`${table.priceCents} >= 0`),
]);

export const sizes = pgTable('sizes', {
  id: uuid('id').defaultRandom().primaryKey(),
  label: text('label').notNull().unique(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const inventory = pgTable('inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  variantId: uuid('variant_id').notNull().references(() => productVariants.id, { onDelete: 'cascade' }),
  sizeId: uuid('size_id').notNull().references(() => sizes.id, { onDelete: 'restrict' }),
  onHand: integer('on_hand').default(0).notNull(),
  reserved: integer('reserved').default(0).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex('inventory_variant_size_unique').on(table.variantId, table.sizeId),
  check('inventory_on_hand_nonnegative', sql`${table.onHand} >= 0`),
  check('inventory_reserved_nonnegative', sql`${table.reserved} >= 0`),
  check('inventory_reserved_available', sql`${table.reserved} <= ${table.onHand}`),
]);

export const cartStatus = pgEnum('cart_status', ['active', 'converted', 'ordered', 'abandoned']);
export const carts = pgTable('carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
  guestTokenHash: text('guest_token_hash'),
  status: cartStatus('status').default('active').notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('active_customer_cart_unique').on(table.customerId).where(sql`${table.status} = 'active' AND ${table.customerId} IS NOT NULL`),
  uniqueIndex('active_guest_cart_unique').on(table.guestTokenHash).where(sql`${table.status} = 'active' AND ${table.guestTokenHash} IS NOT NULL`),
  check('cart_has_one_owner', sql`num_nonnulls(${table.customerId}, ${table.guestTokenHash}) = 1`),
]);

export const cartItems = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  inventoryId: uuid('inventory_id').notNull().references(() => inventory.id, { onDelete: 'restrict' }),
  quantity: integer('quantity').notNull(),
  ...timestamps,
}, (table) => [
  uniqueIndex('cart_item_unique').on(table.cartId, table.inventoryId),
  check('cart_item_quantity_positive', sql`${table.quantity} > 0 AND ${table.quantity} <= 20`),
]);

export const favourites = pgTable('favourites', {
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.customerId, table.productId] })]);

export const orderStatus = pgEnum('order_status', ['submitted', 'cancelled']);
export const paymentStatus = pgEnum('payment_status', ['pending']);
export const fulfilmentStatus = pgEnum('fulfilment_status', ['unconfirmed', 'cancelled']);
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'restrict' }),
  status: orderStatus('status').default('submitted').notNull(),
  paymentStatus: paymentStatus('payment_status').default('pending').notNull(),
  fulfilmentStatus: fulfilmentStatus('fulfilment_status').default('unconfirmed').notNull(),
  currency: text('currency').default('NGN').notNull(),
  subtotalCents: integer('subtotal_cents').notNull(),
  totalCents: integer('total_cents').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  state: text('state').notNull(),
  note: text('note'),
  placedAt: timestamp('placed_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index('orders_customer_idx').on(table.customerId, table.placedAt),
  check('orders_totals_nonnegative', sql`${table.subtotalCents} >= 0 AND ${table.totalCents} >= 0`),
]);

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  inventoryId: uuid('inventory_id').references(() => inventory.id, { onDelete: 'set null' }),
  sku: text('sku').notNull(),
  productName: text('product_name').notNull(),
  color: text('color').notNull(),
  size: text('size').notNull(),
  imagePath: text('image_path').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  quantity: integer('quantity').notNull(),
  lineTotalCents: integer('line_total_cents').notNull(),
}, (table) => [index('order_items_order_idx').on(table.orderId)]);

export const marketingConsents = pgTable('marketing_consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  email: text('email').notNull(),
  consented: boolean('consented').notNull(),
  source: text('source').default('storefront_newsletter').notNull(),
  providerStatus: text('provider_status'),
  consentText: text('consent_text').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const productRelations = relations(products, ({ many }) => ({ variants: many(productVariants) }));
export const variantRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  inventory: many(inventory),
}));
