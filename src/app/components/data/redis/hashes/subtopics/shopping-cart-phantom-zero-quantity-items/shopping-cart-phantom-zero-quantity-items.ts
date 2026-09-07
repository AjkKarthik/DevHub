import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-shopping-cart-phantom-zero-quantity-items',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './shopping-cart-phantom-zero-quantity-items.html',
  styleUrl: './shopping-cart-phantom-zero-quantity-items.scss',
})
export class ShoppingCartPhantomZeroQuantityItemsSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'The gap in the main page\'s own Challenge',
      points: [
        'The main page\'s Shopping Cart Challenge asks for <code>addItem(cartId, itemId, qty)</code> to "set/update item quantity" — but its own reference solution calls <code>HSET</code> unconditionally for any quantity, including 0 or a negative number.',
        'A real cart UI routinely produces a qty-0 call: a user clicks the "-" button on an item already at quantity 1. The reference solution stores this as the literal string field value <code>"0"</code> rather than removing the item.',
        'The result: <code>getCart()</code> returns an item entry with quantity 0 sitting in the cart — a "phantom" line item that a checkout screen would render, and that a naive <code>Object.keys(cart).length</code> would count as a real item.',
      ],
    },
    {
      heading: 'Why HDEL is the correct fix, not just filtering on read',
      points: [
        'One tempting alternative is to leave <code>addItem</code> unchanged and filter zero-quantity entries out inside <code>getCart()</code> instead — but this only patches ONE read path; any other code reading the hash directly (an admin dashboard, an analytics job, a different service) would still see the phantom field.',
        'Removing the field at write time with <code>HDEL</code> keeps the hash itself always representing exactly the customer\'s real cart contents — every future reader, not just <code>getCart()</code>, sees the correct state with no extra filtering logic required anywhere.',
        'This mirrors the same "fix it at the source, not at every read site" principle behind Redis\'s own hash-field-deletion behavior: once the last real field is removed from a hash, Redis deletes the key entirely rather than leaving an empty shell behind — the fix here is the same idea applied one level up, to the shopping cart\'s own domain logic.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the phantom item',
      language: 'typescript',
      code: `// The main page's own reference solution, called exactly the way a
// real cart UI would call it when a user decrements an item to zero.
class FakeRedis {
  private hashes = new Map<string, Map<string, string>>();

  hset(key: string, field: string, value: string): void {
    if (!this.hashes.has(key)) this.hashes.set(key, new Map());
    this.hashes.get(key)!.set(field, value);
  }
  hdel(key: string, field: string): void {
    this.hashes.get(key)?.delete(field);
  }
  hgetall(key: string): Record<string, string> {
    return Object.fromEntries(this.hashes.get(key) ?? new Map());
  }
}

async function addItem(redis: FakeRedis, cartId: string, itemId: string, qty: number): Promise<void> {
  await redis.hset(\`cart:\${cartId}\`, itemId, qty.toString());
}
async function getCart(redis: FakeRedis, cartId: string): Promise<Record<string, number>> {
  const raw = await redis.hgetall(\`cart:\${cartId}\`);
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, parseInt(v)]));
}

const redis = new FakeRedis();
await addItem(redis, 'c1', 'widget', 3);
await addItem(redis, 'c1', 'gadget', 1);
// user clicks "-" on gadget, taking it from 1 down to 0
await addItem(redis, 'c1', 'gadget', 0);

console.log('cart contents:', await getCart(redis, 'c1'));
// cart contents: { widget: 3, gadget: 0 }  <-- phantom item, still "in" the cart`,
    },
    {
      label: 'The fix: HDEL on qty <= 0',
      language: 'typescript',
      code: `class FakeRedis {
  private hashes = new Map<string, Map<string, string>>();

  hset(key: string, field: string, value: string): void {
    if (!this.hashes.has(key)) this.hashes.set(key, new Map());
    this.hashes.get(key)!.set(field, value);
  }
  hdel(key: string, field: string): void {
    this.hashes.get(key)?.delete(field);
  }
  hgetall(key: string): Record<string, string> {
    return Object.fromEntries(this.hashes.get(key) ?? new Map());
  }
}

async function addItemFixed(redis: FakeRedis, cartId: string, itemId: string, qty: number): Promise<void> {
  if (qty <= 0) {
    await redis.hdel(\`cart:\${cartId}\`, itemId);
  } else {
    await redis.hset(\`cart:\${cartId}\`, itemId, qty.toString());
  }
}
async function getCart(redis: FakeRedis, cartId: string): Promise<Record<string, number>> {
  const raw = await redis.hgetall(\`cart:\${cartId}\`);
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, parseInt(v)]));
}

const redis = new FakeRedis();
await addItemFixed(redis, 'c1', 'widget', 3);
await addItemFixed(redis, 'c1', 'gadget', 1);
await addItemFixed(redis, 'c1', 'gadget', 0);
console.log('cart contents (fixed):', await getCart(redis, 'c1'));
// cart contents (fixed): { widget: 3 }  <-- gadget genuinely gone

// A negative quantity from a buggy caller is handled the same, safe way:
await addItemFixed(redis, 'c1', 'widget', -1);
console.log('cart contents after negative qty:', await getCart(redis, 'c1'));
// cart contents after negative qty: {}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Suppose instead of fixing <code>addItem</code>, a teammate proposes fixing only <code>getCart</code> to filter out any entry with <code>quantity <= 0</code> before returning it. What is a concrete scenario where this filtered-read approach still produces a wrong result somewhere in the system?',
    hint: 'Think about anything besides <code>getCart()</code> that might read the same <code>cart:{cartId}</code> hash directly — a cart-abandonment analytics job, an admin support tool, HLEN itself.',
    solution: `A cart-abandonment analytics job that runs "HLEN cart:{cartId}" directly against Redis (rather than going through getCart()) would still count the phantom zero-quantity field as a real item -- reporting the cart as having, say, 2 items when the customer's actual cart has 1. Filtering only inside getCart() fixes what THAT one function returns, but does nothing to the actual data stored in Redis, which every other caller still sees unfiltered.

Similarly, an admin support dashboard built later by a different team, reading the hash directly to debug a customer's cart, would see a "gadget: 0" field and have no way to know from the data alone whether that means "the customer removed this" or "this is a genuine zero-quantity line item the business model actually supports" -- an ambiguity that simply doesn't exist once addItem itself guarantees the hash only ever contains real, positive quantities.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Storing quantity 0 explicitly is actually MORE informative than removing the field — it shows the user removed the item, rather than it never having been added."',
      reality: 'The cart hash has no use for that history — its only job is representing CURRENT contents, and "removed" and "never added" both correctly mean "not in the hash" for that purpose. If a cart-removal audit trail is genuinely needed, that\'s a separate concern (an event log, not the live cart hash) — conflating the two inside the same data structure is what created the phantom-item bug in the first place.',
    },
    {
      thought: '"This is just an edge case that only matters if a qty of exactly 0 is passed — a real UI would just call removeItem() directly instead of addItem() with 0."',
      reality: 'A common, entirely realistic UI pattern is a single "quantity stepper" component whose decrement button always calls the SAME addItem(cartId, itemId, currentQty - 1) handler regardless of the resulting number — it has no special-cased branch for "oh, this decrement happens to reach zero, call a different function instead." The bug surfaces from completely ordinary UI code, not a contrived misuse.',
    },
  ];

  topicLabel = 'Hashes';
  topicRoute = '/redis/hashes';
  prev: SubtopicLink | null = {
    label: 'HEXPIRE: Real Per-Field TTL, Since Redis 7.4',
    route: '/redis/hashes/hexpire-real-per-field-ttl-since-redis-7-4',
  };
  next: SubtopicLink | null = {
    label: 'HRANDFIELD: Sampling With and Without Repeats',
    route: '/redis/hashes/hrandfield-sampling-with-and-without-repeats',
  };
}
