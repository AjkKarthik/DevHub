import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Quiz Question With No Matching Code',
    points: [
      'One of the main page\'s own quiz questions defines commutativity precisely: a compensation is commutative when it "produces a correct result regardless of what order it runs in relative to other concurrent operations on the same resource" — and gives the example "\'decrement inventory by X\' is commutative... in a way that \'set inventory to exactly Y\' is not." No codeTab on the page ever builds either version.',
      'The main page\'s own <code>ReleaseReservationAsync</code> and <code>RefundPayment</code> examples are ALREADY commutative by construction (release THIS reservation; refund THIS payment) — but that safety is easy to lose the moment a compensation is written as "set the field to some value" instead of "adjust the field by some amount."',
      'The risk is concrete: sagas run across independently-communicating services, so a compensation message and some OTHER operation on the same resource can genuinely arrive out of the order they were logically issued in — a non-commutative compensation gets the final state wrong depending on which one happens to land first.',
    ],
  },
  {
    heading: 'Decrement vs. Set — Why One Survives Reordering and the Other Doesn\'t',
    points: [
      'A commutative operation like "decrement by X" only ever needs to know the DELTA — it never reads or assumes the CURRENT value first, so applying it before or after some other delta to the same field always lands on the same final total either way.',
      'A non-commutative operation like "set to exactly Y" bakes in an assumption about what the value WAS at the moment it was computed — if a different operation changes the value in between, the "set" silently overwrites that other change, and the final result depends entirely on which operation runs last.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Non-Commutative — Order-Dependent',
    language: 'csharp',
    code: `// "Set" style compensation — computed once from a snapshot of the
// current stock, then applied later.
public class InventoryService(IStockRepository stock)
{
    // Compensation reads current stock NOW, adds back the reserved
    // amount, and writes the RESULT as a fixed new value.
    public async Task ReleaseReservation_NonCommutative(Guid productId, int reservedQty)
    {
        var current = await stock.GetQuantityAsync(productId);   // e.g. 40
        var restored = current + reservedQty;                    // e.g. 40 + 5 = 45
        await stock.SetQuantityAsync(productId, restored);        // writes 45, unconditionally
    }
}

// If a SEPARATE, concurrent operation (a new sale reducing stock by
// 3) reads current stock and writes its own result BETWEEN this
// compensation's read and write, that other write is silently lost
// the moment this "set 45" lands — the final value reflects only
// whichever operation wrote LAST, not both changes combined.`,
  },
  {
    label: 'Commutative — Order-Independent',
    language: 'csharp',
    code: `// "Adjust by a delta" compensation — never reads current stock at
// all, so it cannot silently discard a concurrent change.
public class InventoryService(IStockRepository stock)
{
    public async Task ReleaseReservation_Commutative(Guid productId, int reservedQty) =>
        await stock.IncrementQuantityAsync(productId, reservedQty);
        // A single atomic UPDATE ... SET qty = qty + @reservedQty,
        // not a read-then-write — the database applies the delta
        // relative to whatever the CURRENT value is at write time.
}

// Now the concurrent sale from the example above (-3) and this
// compensation (+5) can apply in EITHER order and land on the exact
// same final total either way: 40 - 3 + 5 = 42, or 40 + 5 - 3 = 42.
// Neither operation ever reads or assumes a "before" value — each
// one only ever expresses its own delta.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Stock starts at 40. A concurrent sale (-3) and a compensation releasing a reservation (+5) both fire at nearly the same moment. Using the NON-COMMUTATIVE version above, walk through the case where the sale\'s read-modify-write happens to interleave BETWEEN the compensation\'s own read and write. What final stock value results, and how does it differ from the correct 42?',
  hint: 'Track exactly what value each operation reads, and which write happens LAST.',
  solution: `// Timeline (compensation's read-modify-write interleaved with the sale's):
// 1. Compensation reads current stock: 40
// 2. Sale reads current stock: 40 (same starting point, not yet updated)
// 3. Sale computes 40 - 3 = 37, writes 37
// 4. Compensation computes 40 + 5 = 45 (using its STALE read from
//    step 1), writes 45 -- overwriting the sale's write entirely

// Final stock: 45 -- WRONG. The correct combined result is 42
// (40 - 3 + 5). The sale's -3 was silently lost because the
// compensation's "set to 45" never accounted for it -- it only knew
// about the value it read at step 1, before the sale's write ever
// happened.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Commutativity is only a concern for numeric fields like inventory counts or account balances.',
    reality: 'The main page\'s own quiz answer already hints at the broader scope ("this robustness to out-of-order arrival is specifically important in sagas"), and it generalizes beyond arithmetic: any compensation that first READS some current state and then WRITES a computed result based on that read has the same non-commutative risk, whether the field is a number, a status enum, or a list. The fix generalizes too — express the compensation as a relative CHANGE (append, remove, increment) rather than an absolute new VALUE, whenever the underlying storage supports it.',
  },
  {
    thought: 'Making a compensation commutative is purely an implementation detail — it doesn\'t change what the compensation is logically supposed to do.',
    reality: 'It can genuinely change what\'s POSSIBLE to express. "Release this specific reservation\'s 5 units back to stock" (commutative) and "set stock to exactly 45" (non-commutative) sound similar in a single-actor scenario, but only the first one has a coherent meaning once multiple concurrent actors are touching the same resource — the second one implicitly assumes exclusive access to the field, an assumption a distributed saga with independently-communicating services cannot actually guarantee.',
  },
];

@Component({
  selector: 'app-dp-saga-commutative',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './building-a-commutative-compensation.html',
  styleUrl: './building-a-commutative-compensation.scss',
})
export class BuildingACommutativeCompensationSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
