import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-use-client-propagates-to-utils-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './use-client-propagates-to-utils.html',
  styleUrl: './use-client-propagates-to-utils.scss',
})
export class UseClientPropagatesToUtilsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Mistake #1 Only Shows a Component Import — What About a Plain Utility File?',
      points: [
        'The theory section states plainly: "the \'use client\' boundary propagates down: when you mark a file \'use client\', all imports in that file become client code too." Mistake #1\'s wrong/right example only demonstrates this with a formatDate utility imported into an unnecessarily-client-marked component.',
        'This subtopic isolates the actual mechanism: propagation is graph-based, not usage-based. A plain utility module with zero JSX, zero hooks, and zero browser APIs — one that would happily run on a server — still ends up bundled into the CLIENT JavaScript the moment anything importing it is marked "use client". The bundler does not analyze whether the utility itself needs the browser; it only asks "is this file reachable from a client entry point?"',
      ],
    },
    {
      heading: 'Why the Bundler Cannot Be Smarter About This',
      points: [
        'Next.js builds a client reference manifest by walking the import graph starting from every "use client" file. Everything reachable from that starting point — components, plain functions, constants, even entire third-party libraries — is included in the client bundle, full stop.',
        'The bundler genuinely cannot know, in general, whether a given function will ever be called in a way that requires the DOM, localStorage, or an event handler — proving that statically for arbitrary code is not something a build tool can do. So Next.js takes the conservative, correct-but-coarse approach: anything reachable from "use client" ships to the browser, whether or not it strictly needs to.',
        'The practical consequence: placing "use client" at a HIGH level in the component tree (e.g., a whole page) pulls in everything that page transitively imports — including utilities, formatters, and helper modules that never touch a hook or a browser API — inflating the client bundle far beyond what is actually interactive.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A plain utility file — server-only, until it isn\'t',
      language: 'typescript',
      code: `// lib/currency.ts — a plain function, no JSX, no hooks, no browser APIs.
// On its own, this file has NOTHING that requires a client bundle.
export function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function parseCurrencyInput(raw: string): number {
  return Math.round(parseFloat(raw.replace(/[^0-9.]/g, '')) * 100);
}`,
    },
    {
      label: 'Importing it from a "use client" file pulls it into the client bundle',
      language: 'typescript',
      code: `'use client';   // <-- the boundary

import { useState } from 'react';
import { formatCurrency, parseCurrencyInput } from '../lib/currency';
// Both formatCurrency AND parseCurrencyInput are now part of the
// CLIENT bundle -- not because they use hooks (they don't), but
// because they are reachable from this "use client" file.

export function PriceInput({ initialCents }: { initialCents: number }) {
  const [cents, setCents] = useState(initialCents);
  return (
    <input
      defaultValue={formatCurrency(cents)}
      onChange={e => setCents(parseCurrencyInput(e.target.value))}
    />
  );
}`,
    },
    {
      label: 'The fix — narrow the boundary, keep formatting on the server',
      language: 'typescript',
      code: `// app/products/[id]/page.tsx — Server Component (no "use client")
import { formatCurrency } from '../../../lib/currency';
import { PriceInput } from './PriceInput';   // the ONLY client piece

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);

  return (
    <div>
      <h1>{product.name}</h1>
      {/* formatCurrency runs on the SERVER here -- never shipped to the client */}
      <p>List price: {formatCurrency(product.priceCents)}</p>

      {/* Only the genuinely interactive piece is a Client Component */}
      <PriceInput initialCents={product.priceCents} />
    </div>
  );
}

// PriceInput.tsx still imports formatCurrency for its own initial
// render -- that ONE import still ships client-side, which is
// correct and unavoidable. The win is that the read-only price
// display above no longer needs to.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A file <code>lib/analytics.ts</code> exports a plain <code>trackEvent(name)</code> function (just a fetch call, no hooks). It is imported by both a Server Component (a page that logs page views server-side) and a "use client" button component (that logs clicks). Does <code>trackEvent</code> end up in the client bundle?',
    hint: 'Ask: is trackEvent reachable from ANY "use client" file, regardless of what else imports it?',
    solution: `Yes — trackEvent ends up in the client bundle, because it IS
reachable from the "use client" button component's import graph.

The fact that it is ALSO imported by a Server Component doesn't
exempt it — bundling isn't "does the majority of importers need
this," it's "is there at least one client entry point that reaches
this module." A single "use client" importer is enough to pull a
shared utility into the client bundle, even if every other importer
is a Server Component that never needed it there.

This is exactly why the main page's Mistake #1 recommends keeping
"use client" boundaries as narrow and low in the tree as possible --
a shared utility used by both server and client code will always
ship client-side if ANY client file imports it, so the only lever
you actually control is how much OTHER code sits alongside it in
that same client-reachable file.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a utility function only ends up in the client bundle if it is actually CALLED from client-side code at runtime.',
      reality: 'bundling happens at build time based on the STATIC import graph — whether the function is ever actually invoked from the browser at runtime is irrelevant; being reachable from a "use client" file is sufficient.',
    },
    {
      thought: 'a function with no hooks, no JSX, and no browser APIs is automatically excluded from the client bundle, since it doesn\'t "need" the browser.',
      reality: 'the bundler has no way to verify a function never needs browser context — it takes the conservative approach of including everything reachable from a client boundary, regardless of what the function\'s body actually does.',
    },
    {
      thought: 'moving "use client" to a smaller, more specific component only matters for that one component\'s own code size.',
      reality: 'it matters for the ENTIRE import graph reachable from that boundary — a narrower "use client" placement can exclude whole utility modules, formatters, and even third-party libraries that a higher-level "use client" would have dragged along with it.',
    },
  ];
}
