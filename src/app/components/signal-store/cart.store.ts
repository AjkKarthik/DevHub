import { Injectable, signal, computed } from '@angular/core';

export interface Product {
  id: number;
  name: string;
  price: number;
}

export interface CartItem {
  product: Product;
  qty: number;
}

/**
 * Signal Store pattern — no NgRx needed for most apps.
 * One class, all state in signals, all reads via computed().
 */
@Injectable()
export class CartStore {
  readonly catalogue: Product[] = [
    { id: 1, name: 'Angular Sticker Pack', price: 5 },
    { id: 2, name: 'TypeScript T-Shirt',   price: 25 },
    { id: 3, name: 'RxJS Mug',             price: 15 },
    { id: 4, name: 'VS Code Mousepad',     price: 20 },
  ];

  private items = signal<CartItem[]>([]);

  // Derived state — auto-updates
  readonly cartItems  = this.items.asReadonly();
  readonly itemCount  = computed(() => this.items().reduce((s, i) => s + i.qty, 0));
  readonly total      = computed(() => this.items().reduce((s, i) => s + i.product.price * i.qty, 0));
  readonly isEmpty    = computed(() => this.items().length === 0);

  add(product: Product) {
    this.items.update(cart => {
      const existing = cart.find(i => i.product.id === product.id);
      return existing
        ? cart.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        : [...cart, { product, qty: 1 }];
    });
  }

  remove(productId: number) {
    this.items.update(cart => cart.filter(i => i.product.id !== productId));
  }

  decrement(productId: number) {
    this.items.update(cart =>
      cart
        .map(i => i.product.id === productId ? { ...i, qty: i.qty - 1 } : i)
        .filter(i => i.qty > 0)
    );
  }

  clear() { this.items.set([]); }
}
