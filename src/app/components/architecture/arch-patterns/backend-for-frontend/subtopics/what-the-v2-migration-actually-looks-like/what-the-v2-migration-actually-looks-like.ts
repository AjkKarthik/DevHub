import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './what-the-v2-migration-actually-looks-like.html',
  styleUrl: './what-the-v2-migration-actually-looks-like.scss'
})
export class WhatTheV2MigrationActuallyLooksLikeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A version bump named in a comment, never shown in code',
      points: [
        'The "Third-Party BFF (Stable API)" codeTab ends with three comment lines: "When breaking changes are needed: create /api/v2/products/:id. Keep v1 running for 12+ months with deprecation notice. Partner BFF team owns the versioning contract independently of services." The codeTab itself only ever defines <code>getProductV1</code> — there is no v2 anywhere on the page.',
        'This mirrors the QnA\'s own point about BFF versioning ("standard API versioning approaches apply... but this is treated as the exception rather than the default") — the third-party case IS exactly that exception, since a BFF and frontend released in lockstep don\'t normally need this, but a partner integration BFF genuinely does.',
        'This subtopic writes the v2 endpoint the comment promises, running alongside v1, and shows what actually has to be true for both to coexist safely.',
      ]
    },
    {
      heading: 'What changes between v1 and v2, and what has to stay identical',
      points: [
        'The comment names a concrete trigger — "when breaking changes are needed." A genuinely BREAKING change is one an existing v1 partner integration cannot absorb without code changes on their side: renaming a field, changing a field\'s type, or removing a field a partner might already depend on.',
        'v1\'s <code>priceUsd: number</code> hardcodes USD — a real limitation once the BFF needs to support partners billing in other currencies. Fixing this properly (a structured <code>price: { amount: number; currency: string }</code>) changes the field\'s TYPE, which is breaking for any v1 partner still parsing <code>priceUsd</code> as a bare number — exactly the kind of change that has to go in v2, not be patched into v1.',
        'Both endpoints call the SAME underlying <code>catalogService</code> and <code>inventoryService</code> — v1 and v2 are two different SHAPES over the same underlying data, not two different systems. This is what makes coexistence tractable: there is one source of truth, and each version\'s handler is responsible only for shaping that data differently, matching the "aggregates and shapes" principle this hub\'s own mistakes block establishes for BFFs generally.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'v1 and v2 running side by side',
      language: 'typescript',
      code: `// v1 -- UNCHANGED from the main page, still serving existing partners
interface ThirdPartyProductV1 {
  productId: string;
  productName: string;
  priceUsd: number;              // hardcoded USD -- the limitation v2 fixes
  availableForPurchase: boolean;
  lastUpdated: string;
}

async function getProductV1(productId: string): Promise<ThirdPartyProductV1> {
  const [product, inventory] = await Promise.all([
    catalogService.getProduct(productId),
    inventoryService.getStock(productId),
  ]);
  return {
    productId: product.id,
    productName: product.name,
    priceUsd: product.price.amount,
    availableForPurchase: inventory.stockLevel > 0,
    lastUpdated: product.updatedAt,
  };
}

// v2 -- the breaking change the main page's comment named: multi-currency
// pricing. This is why it can't just be patched into v1 -- any partner
// still reading priceUsd as a bare number would break the moment that
// field's type or meaning changed underneath them.
interface ThirdPartyProductV2 {
  productId: string;
  productName: string;
  price: { amount: number; currency: string };   // <-- breaking change
  availableForPurchase: boolean;
  lastUpdated: string;
}

async function getProductV2(productId: string): Promise<ThirdPartyProductV2> {
  // SAME underlying services as v1 -- v1 and v2 are two shapes over
  // one source of truth, not two separate systems to keep in sync.
  const [product, inventory] = await Promise.all([
    catalogService.getProduct(productId),
    inventoryService.getStock(productId),
  ]);
  return {
    productId: product.id,
    productName: product.name,
    price: { amount: product.price.amount, currency: product.price.currency },
    availableForPurchase: inventory.stockLevel > 0,
    lastUpdated: product.updatedAt,
  };
}

// Routing -- both versions live at the same time, per the main page's
// own "keep v1 running for 12+ months with deprecation notice"
// GET /api/v1/products/:id  -> getProductV1  (deprecated, sunset date set)
// GET /api/v2/products/:id  -> getProductV2  (current)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate proposes a shortcut: instead of maintaining two handler functions, just call getProductV2 from inside getProductV1 and convert the result back to the v1 shape (extracting price.amount into priceUsd). Is this a reasonable way to avoid duplicating the aggregation logic?',
    hint: 'Does converting v2\'s shape back into v1\'s shape lose any information — specifically, what happens if a product\'s actual currency is not USD?',
    solution: 'It is reasonable for the AGGREGATION part (fetching from catalogService/inventoryService), but risky if done carelessly for the SHAPE conversion. v1\'s contract promises a USD price as a bare number -- if v2\'s underlying price is genuinely in a different currency, naively taking price.amount and calling it priceUsd would silently return the wrong number in the wrong currency, labeled as if it were USD. The safe version of this shortcut has getProductV1 call the SAME underlying data-fetching step v2 uses (avoiding duplicated Promise.all calls), but keeps its OWN explicit, currency-aware conversion logic (e.g. converting to USD via an exchange rate, or documenting that v1 only ever supported USD-priced products) rather than blindly reusing v2\'s already-shaped output. Sharing the FETCH is a reasonable de-duplication; blindly reusing the SHAPED response risks silently breaking the contract v1 partners are still relying on.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Adding a v2 endpoint means v1 and v2 are now two separate systems that could drift out of sync with each other over time.',
      reality: 'Per this subtopic\'s theory, v1 and v2 call the SAME underlying catalogService and inventoryService — they are two different response SHAPES over one source of truth, not two systems that could disagree about the underlying data.'
    },
    {
      thought: 'Any change to a BFF\'s response shape counts as a "breaking change" requiring a new API version.',
      reality: 'Per this subtopic\'s theory, a breaking change is specifically one an existing consumer cannot absorb without code changes — renaming, retyping, or removing a field. Adding a genuinely new, optional field would not require a new version the way changing priceUsd\'s type does.'
    },
    {
      thought: 'Once v2 exists, the aggregation and shaping logic for v1 and v2 should be merged into one function to avoid duplication, converting between shapes as needed.',
      reality: 'Per this subtopic\'s theory, sharing the underlying data-fetching step is reasonable, but blindly deriving one version\'s shaped output from the other risks silently breaking the contract — v1\'s USD-only guarantee, for instance — that existing partners still depend on.'
    }
  ];
}
