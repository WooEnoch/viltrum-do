export type Product = { id: string; variantId: string; name: string; description: string; category: string; collection?: string; image: string; isNew: boolean; color: string; price: number; sizes: string[] };
export type CartItem = { id: string; productId: string; name: string; image: string; color: string; size: string; price: number; quantity: number; lineTotal: number };
export type Cart = { items: CartItem[]; count: number; subtotal: number };
export type User = { id: string; name: string; email: string; image?: string };
export type Order = { id: string; orderNumber: string; createdAt: string; total: number; paymentLabel: string; items: Array<{ product_name: string; quantity: number; size: string }> };
export type Delivery = { firstName: string; lastName: string; email: string; phone: string; address: string; city: string; state: string; note?: string };

import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParams = { Home: undefined; Shop: undefined; Saved: undefined; Bag: undefined; Account: undefined };
export type RootStackParams = {
  Tabs: NavigatorScreenParams<TabParams> | undefined;
  Product: { productId: string };
  Checkout: undefined;
  Orders: undefined;
  SignIn: undefined;
};
