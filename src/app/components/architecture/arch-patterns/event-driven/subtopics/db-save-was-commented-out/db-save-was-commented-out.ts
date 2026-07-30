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
  templateUrl: './db-save-was-commented-out.html',
  styleUrl: './db-save-was-commented-out.scss'
})
export class DbSaveWasCommentedOutSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A hint the solution didn\'t actually follow',
      points: [
        'The Challenge\'s own hints explicitly say: "Publish AFTER DB save — not before" — a direct, unambiguous instruction matching the page\'s own "Publishing events before the DB transaction commits" mistake block, which recommends exactly this ordering.',
        'The reference solution\'s <code>placeOrder()</code> originally had the DB save line PRESENT but COMMENTED OUT: <code>// await orderRepo.save(order); // DB first</code> — followed immediately by an uncommented <code>await broker.publish(...)</code>. The solution never actually calls any DB save at all; it only ever publishes.',
        'This is a self-contained catch: the Challenge tells the reader what ordering to implement, and the reference answer — meant to model the correct solution — doesn\'t actually implement it, just gestures at it in a comment.',
      ]
    },
    {
      heading: 'Why "it\'s just a demo, no real DB exists" isn\'t a sufficient excuse here',
      points: [
        'The Challenge\'s OWN broker is fully stubbed out as working, runnable code (<code>subscribers</code> array, <code>publish</code>/<code>subscribe</code> functions) specifically so the exercise is self-contained and actually runs — there was no technical reason the DB save couldn\'t receive the exact same treatment (a simple stub that logs and resolves), especially since the Challenge explicitly asks for DB-then-publish ordering as one of its four numbered requirements.',
        'Leaving the DB-save line commented out doesn\'t just skip an implementation detail — it means the solution never actually DEMONSTRATES the ordering it\'s teaching, which is the entire point of a reference solution: showing a working example of the pattern being asked for, not describing it in a comment while the code does something else.',
        'The fix adds a minimal, self-contained <code>orderRepo</code> stub (matching the style of the existing <code>broker</code> stub) and un-comments the save call — the solution now genuinely executes "save, then publish," matching both its own hint and the page\'s own mistake-block guidance.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'From a comment describing the order to code demonstrating it',
      language: 'typescript',
      code: `// BEFORE -- the ordering is only described in a comment, never executed
async function placeOrderBroken(customerId: string, total: number): Promise<string> {
  const orderId = 'ord-' + Date.now();
  // await orderRepo.save(order); // DB first  <- commented out, never runs
  await broker.publish({ id: 'evt-' + Date.now(), data: { orderId, customerId, totalAmount: total } });
  return orderId;
  // Only the publish actually happens -- there is no "DB first" in this code,
  // just a comment claiming there should be.
}

// AFTER -- a minimal, self-contained "DB" stub makes the ordering real
const orderRepo = {
  save: async (order: { orderId: string; customerId: string; totalAmount: number }) => {
    console.log(\`Saved order \${order.orderId} to DB\`);
  },
};

async function placeOrder(customerId: string, total: number): Promise<string> {
  const orderId = 'ord-' + Date.now();
  await orderRepo.save({ orderId, customerId, totalAmount: total }); // DB commit first
  await broker.publish({ id: 'evt-' + Date.now(), data: { orderId, customerId, totalAmount: total } });
  return orderId;
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You\'re reviewing a colleague\'s pull request for a coding exercise. Their reference solution includes a comment, // validate input first, directly above a function body that never actually calls any validation logic. They argue the comment documents the INTENDED design, so it\'s fine. Do you approve?',
    hint: 'What is a reference/example solution actually FOR -- documenting an intention, or demonstrating working code that does the thing?',
    solution: 'Not as-is. A reference solution\'s job is to demonstrate WORKING code that actually does what it claims -- a comment describing intended behavior that the code never executes is not a substitute for that, regardless of how clear the comment is. This is exactly the gap this subtopic found: a hint or hint-shaped comment stating the correct approach doesn\'t verify anything if the code right below it doesn\'t actually do it. The fix is the same in both cases: either implement the described behavior for real (even via a minimal stub, as this subtopic did for the DB save), or remove the misleading comment if the behavior genuinely isn\'t needed for that specific exercise.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A comment describing what a function "should" do is roughly equivalent to the function actually doing it, for teaching purposes.',
      reality: 'Per this subtopic\'s theory, a reference solution exists specifically to DEMONSTRATE working code — a comment describing intended behavior that the code never executes teaches the reader nothing about whether that behavior actually works or how to implement it.'
    },
    {
      thought: 'Since this Challenge\'s broker is "just a stub," it would have been inconsistent or unnecessary to also stub out a fake database.',
      reality: 'Per this subtopic\'s theory, the Challenge already fully commits to a self-contained, runnable style via its broker stub — extending that same treatment to a minimal orderRepo stub is consistent with, not a departure from, the existing pattern.'
    },
    {
      thought: 'This is a minor omission since the Challenge\'s hints already state the correct ordering in words.',
      reality: 'Per this subtopic\'s theory, the hints and the reference solution serve different purposes — hints guide the reader toward an approach, while the solution is supposed to be the definitive, working demonstration; a gap between what the hints ask for and what the solution actually does undermines the solution\'s role.'
    }
  ];
}
