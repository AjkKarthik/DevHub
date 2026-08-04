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
  templateUrl: './parallel-run-skipped-its-own-discrepancy-check.html',
  styleUrl: './parallel-run-skipped-its-own-discrepancy-check.scss'
})
export class ParallelRunSkippedItsOwnDiscrepancyCheckSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A check nested inside the wrong condition',
      points: [
        'The "Parallel Run for Validation" codeTab\'s comment states the intent plainly: "IDs differ (expected) — compare status and total." The whole POINT of a parallel run is comparing status and total between the two systems.',
        'But the original code structured this as a NESTED check: the status/total comparison only ran INSIDE an outer <code>if (legacyResult.value.orderId !== newResult.value.orderId)</code> block — meaning the actual discrepancy check (the one thing this function exists to do) only executed when the IDs happened to be different.',
        'Since the two systems are expected to generate DIFFERENT IDs (separate ID generators, per the comment\'s own words), this rarely mattered in practice — but on the rare occasion the two systems happened to produce the SAME ID (a coincidence, a shared sequence, a test fixture reusing IDs), the entire status/total comparison would be silently skipped, and a genuine discrepancy — the actual thing the parallel run exists to catch — would go completely unnoticed.',
      ]
    },
    {
      heading: 'Why nesting the check this way inverts the intent',
      points: [
        'The comment "IDs differ (expected) — compare status and total" reads naturally as two separate observations: (1) IDs differing is normal and not itself a problem, and (2) status and total should still be compared. Structuring these as a nested if makes (2) CONDITIONAL on (1), when the comment never said they should be linked.',
        'The safer structure treats the ID-difference observation as just that — an observation, not a gate. The status/total comparison should run UNCONDITIONALLY once both promises are fulfilled, exactly the way the outer <code>if (legacyResult.status === \'fulfilled\' && newResult.status === \'fulfilled\')</code> check already gates on both results actually being usable.',
        'This is a subtle category of bug: the code does not crash, does not throw a type error, and passes a casual read — it fails silently, by simply not running a check under a specific, easy-to-miss condition. The kind of bug that only surfaces when someone asks "wait, why didn\'t the parallel run catch this obvious discrepancy?"',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Before and after — un-nesting the discrepancy check',
      language: 'typescript',
      code: `// BEFORE -- status/total comparison gated behind an ID-difference check
async function parallelRunPlaceOrder_before(cmd: PlaceOrderCommand): Promise<OrderResult> {
  const [legacyResult, newResult] = await Promise.allSettled([
    legacyOrders.placeOrder(cmd),
    newOrders.placeOrder(cmd),
  ]);

  if (legacyResult.status === 'fulfilled' && newResult.status === 'fulfilled') {
    if (legacyResult.value.orderId !== newResult.value.orderId) {
      // Only runs when IDs differ -- if they ever happen to MATCH,
      // this entire block, including the actual discrepancy check
      // below, is silently skipped.
      if (legacyResult.value.status !== newResult.value.status ||
          legacyResult.value.total !== newResult.value.total) {
        logger.warn('Parallel run discrepancy', { legacy: legacyResult.value, new: newResult.value, cmd });
      }
    }
  } else if (newResult.status === 'rejected') {
    logger.error('New system failed in parallel run', { error: newResult.reason });
  }

  if (legacyResult.status === 'fulfilled') return legacyResult.value;
  throw legacyResult.reason;
}

// AFTER -- status/total comparison runs unconditionally once both
// results are actually usable -- exactly matching what the comment
// already claimed was happening
async function parallelRunPlaceOrder_after(cmd: PlaceOrderCommand): Promise<OrderResult> {
  const [legacyResult, newResult] = await Promise.allSettled([
    legacyOrders.placeOrder(cmd),
    newOrders.placeOrder(cmd),
  ]);

  if (legacyResult.status === 'fulfilled' && newResult.status === 'fulfilled') {
    // IDs are EXPECTED to differ -- that alone is not a discrepancy,
    // and is never checked as one. status/total ARE compared, always.
    if (legacyResult.value.status !== newResult.value.status ||
        legacyResult.value.total !== newResult.value.total) {
      logger.warn('Parallel run discrepancy', { legacy: legacyResult.value, new: newResult.value, cmd });
    }
  } else if (newResult.status === 'rejected') {
    logger.error('New system failed in parallel run', { error: newResult.reason });
  }

  if (legacyResult.status === 'fulfilled') return legacyResult.value;
  throw legacyResult.reason;
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues the original nested structure is actually fine: "If the IDs match, the two systems clearly agree on the order — there\'s nothing left to check." Is comparing IDs a reliable stand-in for checking whether the two systems agree?',
    hint: 'What does matching (or non-matching) IDs actually tell you about whether STATUS and TOTAL also match?',
    solution: 'No -- matching IDs and matching business outcomes are two completely independent facts. The order ID is typically just a generated identifier (a UUID, a sequence number) with no relationship to the order\'s STATUS or TOTAL -- two systems could easily produce the SAME id (coincidence, a shared sequence, a test fixture) while disagreeing sharply on status or total, or produce DIFFERENT ids while agreeing perfectly on both. The teammate\'s reasoning conflates "the identifier looks the same" with "the business outcome is the same," which is exactly the kind of assumption a parallel run is supposed to verify empirically rather than take for granted. The whole point of comparing status and total is to catch cases where the two systems disagree on the THING THAT ACTUALLY MATTERS, independent of whatever their ID generators happen to produce.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since the two systems are expected to generate different order IDs, a check nested inside "if IDs differ" is effectively the same as an unconditional check in practice.',
      reality: 'Per this subtopic\'s theory, "expected to differ" is not "guaranteed to differ" — the nested structure silently skips the entire discrepancy check on the rare occasion the IDs do happen to match, which is exactly the scenario a robust check needs to handle correctly, not assume away.'
    },
    {
      thought: 'If two systems produce the same order ID for the same request, that is itself proof the two systems agree and nothing further needs checking.',
      reality: 'Per this subtopic\'s theory, an ID matching says nothing about whether status or total also match — these are independent facts, and only directly comparing status/total actually verifies agreement on the outcome that matters.'
    },
    {
      thought: 'A bug like this — a check nested one level too deep — would be caught quickly in practice, since parallel runs are specifically built to surface discrepancies.',
      reality: 'Per this subtopic\'s theory, this exact bug fails SILENTLY — no crash, no error, no obviously wrong output — it just quietly stops running the one check it exists to run, under a condition rare enough that it could go unnoticed for a long time.'
    }
  ];
}
