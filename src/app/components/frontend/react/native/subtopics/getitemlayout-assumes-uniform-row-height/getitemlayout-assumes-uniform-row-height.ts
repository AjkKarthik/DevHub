import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-getitemlayout-assumes-uniform-row-height-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './getitemlayout-assumes-uniform-row-height.html',
  styleUrl: './getitemlayout-assumes-uniform-row-height.scss',
})
export class GetitemlayoutAssumesUniformRowHeightSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Code Comment Says "fixed height" — But the Prop Itself Never Enforces It',
      points: [
        'The FlatList + Platform code tab includes <code>getItemLayout={(_, index) =&gt; ({ length: 56, offset: 56 * index, index })}   // fixed height</code> — a comment acknowledging the assumption, but the main page never explains what happens if that assumption is violated by real, variable-height data.',
        'This subtopic makes the failure mode concrete: <code>getItemLayout</code> is a pure math formula you hand FlatList so it can compute any item\'s position WITHOUT measuring it first. It is a performance optimization built entirely on trust — FlatList never verifies your formula against the actual rendered height of anything.',
      ],
    },
    {
      heading: 'Why a Wrong Formula Produces Silent, Not Loud, Corruption',
      points: [
        'When <code>getItemLayout</code> is present, FlatList skips its own measurement pass entirely for scroll-to-index, initial scroll offset, and content sizing — it trusts <code>length</code> and <code>offset</code> completely. If real row heights vary (a two-line item description wrapping to three lines, a conditionally-rendered image), the computed offsets drift further and further from reality as the index grows.',
        'The visible symptom is not a crash or an error — it is misaligned rows, items that appear to overlap or leave gaps, and <code>scrollToIndex</code> landing on the wrong visual position, worse the deeper into the list you scroll. This is exactly the kind of bug that looks fine in a quick test with 5 uniform items and only appears once real, variable-length content or a longer list is involved.',
        'The correct fix depends on the actual data: if row height genuinely never varies (a fixed-height avatar list), the formula is safe. If height CAN vary, either compute it accurately per item (accounting for every conditional element that changes height) or drop <code>getItemLayout</code> and accept FlatList\'s own on-demand measurement — slower for scroll-to-index, but never silently wrong.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The assumption baked into a fixed formula',
      language: 'typescript',
      code: `// Correct ONLY if every row is exactly 56 units tall, always.
<FlatList
  data={products}
  getItemLayout={(_, index) => ({ length: 56, offset: 56 * index, index })}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <ProductRow product={item} />}
/>

// ProductRow -- looks like a fixed-height row today...
function ProductRow({ product }: { product: Product }) {
  return (
    <View style={{ height: 56, flexDirection: 'row', padding: 8 }}>
      <Text>{product.name}</Text>
    </View>
  );
}`,
    },
    {
      label: 'The silent break — a conditional element changes real height',
      language: 'typescript',
      code: `// A "small" change: a discount badge that only renders sometimes.
// The row is NO LONGER always 56 units tall -- but getItemLayout
// still tells FlatList every row is exactly 56.
function ProductRow({ product }: { product: Product }) {
  return (
    <View style={{ minHeight: 56, flexDirection: 'row', padding: 8 }}>
      <Text>{product.name}</Text>
      {product.onSale && (
        // This badge adds real height when it wraps to its own line
        // on a narrow screen -- but getItemLayout's math never knows.
        <Text style={{ color: 'red' }}>ON SALE — Limited time offer, ends soon!</Text>
      )}
    </View>
  );
}

// Symptom: rows with onSale=true visually overlap the row below
// them. scrollToIndex(50) lands on the wrong visual row, worse the
// further into the list the sale items are scattered. No error, no
// warning -- just increasingly wrong positions.`,
    },
    {
      label: 'Two real fixes — accurate per-item math, or drop it entirely',
      language: 'typescript',
      code: `// Fix 1: compute the REAL height per item, accounting for every
// conditional element that changes it.
const BASE_HEIGHT = 56;
const SALE_BADGE_HEIGHT = 20;

function getItemLayout(data: Product[] | null | undefined, index: number) {
  let offset = 0;
  for (let i = 0; i < index; i++) {
    offset += BASE_HEIGHT + (data?.[i]?.onSale ? SALE_BADGE_HEIGHT : 0);
  }
  const length = BASE_HEIGHT + (data?.[index]?.onSale ? SALE_BADGE_HEIGHT : 0);
  return { length, offset, index };
}
// This is O(n) per call though -- fine for scrollToIndex (called
// rarely), but a real cost if FlatList calls it very frequently.

// Fix 2: when height genuinely can't be predicted formulaically,
// drop getItemLayout and let FlatList measure on demand.
<FlatList
  data={products}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <ProductRow product={item} />}
  // No getItemLayout -- FlatList measures actual rendered heights.
  // scrollToIndex is slower (may need onScrollToIndexFailed handling)
  // but positions are always correct, never silently wrong.
/>`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A FlatList of chat messages uses <code>getItemLayout={(_, i) =&gt; ({ length: 60, offset: 60 * i, index: i })}</code>. Messages can be 1-5 lines depending on content length. What will happen, and is this a case where getItemLayout should be used at all?',
    hint: 'Ask whether the actual data (variable-length chat messages) matches the assumption the formula requires (every row is exactly the same height).',
    solution: `Row heights will drift from the formula's prediction almost
immediately -- a 1-line message and a 5-line message are nowhere
close to the same rendered height, so the 60-unit-per-row assumption
is wrong for the vast majority of real messages. The symptom:
overlapping message bubbles, wrong scroll-to-bottom positioning
(common in chat UIs), and increasingly wrong positions the further
up the message history you scroll.

This is a case where getItemLayout should NOT be used with a fixed
formula at all -- chat messages are a canonical example of
genuinely variable-height content. The two real options: drop
getItemLayout and let FlatList measure rows on demand (accepting
slower scrollToIndex/scrollToEnd), or switch to a library actually
designed for variable-height virtualized lists with accurate
position tracking (e.g. FlashList, which estimates and corrects
rather than assuming a fixed formula).

The general lesson from this and the previous "fixed height" comment
in the main page's own code tab: getItemLayout is safe ONLY when you
can name a concrete reason every row is really, truly the same
height (a fixed-size avatar grid, a uniform icon list) -- not
whenever it "seems roughly consistent" from a quick visual check.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'getItemLayout is a safe performance optimization to add to any FlatList — worst case, it just doesn\'t help much if row heights vary slightly.',
      reality: 'a wrong getItemLayout formula actively corrupts scroll positioning and row layout — it is not a no-op fallback, it is FlatList trusting incorrect math completely, since providing getItemLayout tells FlatList to skip its own measurement.',
    },
    {
      thought: 'FlatList would validate or auto-correct a getItemLayout formula that doesn\'t match the real rendered heights.',
      reality: 'FlatList performs zero validation — getItemLayout exists specifically so FlatList can AVOID measuring anything, which is the entire performance benefit. There is no mechanism to detect or correct a wrong formula at runtime.',
    },
    {
      thought: 'a small, occasional height variation (like a badge that only shows sometimes) is a minor issue that only slightly affects scroll accuracy.',
      reality: 'the offset calculation compounds across every row before the current index — even a rarely-varying height, if unaccounted for in the formula, produces increasingly wrong offsets the deeper into the list a row sits, not just a minor local inaccuracy.',
    },
  ];
}
