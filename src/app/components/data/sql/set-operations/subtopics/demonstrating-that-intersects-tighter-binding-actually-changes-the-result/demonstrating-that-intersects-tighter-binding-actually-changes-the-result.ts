import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-demonstrating-intersect-precedence-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './demonstrating-that-intersects-tighter-binding-actually-changes-the-result.html',
  styleUrl: './demonstrating-that-intersects-tighter-binding-actually-changes-the-result.scss',
})
export class DemonstratingThatIntersectsTighterBindingActuallyChangesTheResultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Precedence Rule Is Shown as Syntax, Never as a Diverging Result',
      points: [
        'The main page\'s own "Chaining & ORDER BY" tab shows both the unparenthesized form (A UNION B INTERSECT C, implicitly evaluated as A UNION (B INTERSECT C) since INTERSECT binds tighter) and the explicitly parenthesized form ((A UNION B) INTERSECT C) — but only ever demonstrates the SYNTAX difference between them. Nothing on the page proves these two forms can actually produce DIFFERENT result sets on the same underlying data, leaving the precedence rule\'s practical stakes abstract.',
        'A small, hand-computable fixture makes the divergence concrete: with A = {1,2}, B = {2,3}, and C = {3,4}, the implicit-precedence evaluation A UNION (B INTERSECT C) computes B INTERSECT C = {3} first, then unions with A to get {1,2,3}. The explicitly-parenthesized (A UNION B) INTERSECT C computes A UNION B = {1,2,3} first, then intersects with C to get just {3}. Two completely different result sets — {1,2,3} vs {3} — from the exact same three input sets, differing only in where the parentheses go.',
      ],
    },
    {
      heading: 'Why This Matters More Than a Style Preference',
      points: [
        'Because SQL\'s default precedence silently applies whenever parentheses are omitted, a query author who intends (A UNION B) INTERSECT C but writes it without parentheses gets A UNION (B INTERSECT C) instead — a genuinely different, and potentially much larger, result set, with no error or warning of any kind. The safest habit is to always parenthesize explicitly when mixing UNION/EXCEPT with INTERSECT in the same query, rather than relying on memorized precedence rules.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The implicit-precedence form — A UNION (B INTERSECT C)',
      language: 'sql',
      code: `CREATE TABLE SetA (id INT); INSERT INTO SetA VALUES (1), (2);
CREATE TABLE SetB (id INT); INSERT INTO SetB VALUES (2), (3);
CREATE TABLE SetC (id INT); INSERT INTO SetC VALUES (3), (4);

-- Written without parentheses -- INTERSECT binds tighter than UNION,
-- so this is silently evaluated as A UNION (B INTERSECT C):
SELECT id FROM SetA
UNION
SELECT id FROM SetB
INTERSECT
SELECT id FROM SetC;
-- B INTERSECT C = {3} (only 3 is in both B and C)
-- A UNION {3} = {1, 2, 3}
-- Result: 1, 2, 3`,
    },
    {
      label: 'The explicitly parenthesized form — (A UNION B) INTERSECT C',
      language: 'sql',
      code: `-- Same three sets, but explicit parentheses force the OTHER order:
SELECT id FROM (
    SELECT id FROM SetA
    UNION
    SELECT id FROM SetB
) combined
INTERSECT
SELECT id FROM SetC;
-- A UNION B = {1, 2, 3}
-- {1, 2, 3} INTERSECT C({3,4}) = {3}
-- Result: 3

-- The two forms above used IDENTICAL input data and differ ONLY in
-- where the parentheses go -- yet one returns 3 rows (1, 2, 3) and
-- the other returns exactly 1 row (3). This is the concrete,
-- measurable consequence of the precedence rule the main page's own
-- theory states but never demonstrates diverging.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A report combining "customers in region A or region B" (via UNION) with "customers who also match a promotional segment" (via INTERSECT) is written without any parentheses, following the exact unparenthesized pattern shown in the main page\'s own code tab. The report consistently shows MORE customers than a colleague\'s equivalent report, which uses explicit parentheses around the UNION. Using the mechanics above, explain what\'s actually different between the two reports, and which one most likely matches the intended business question ("customers in region A or B, who ALSO match the promo segment").',
    hint: 'Work out which grouping — A UNION (B INTERSECT C) or (A UNION B) INTERSECT C — corresponds to "in region A or B, AND ALSO in the promo segment," using the same small-set reasoning as the code tabs above.',
    solution: `The unparenthesized report is silently evaluated as RegionA UNION
(RegionB INTERSECT PromoSegment) -- it returns every RegionA customer
UNCONDITIONALLY (regardless of promo segment membership), plus only
the RegionB customers who also happen to be in the promo segment. This
is NOT "customers in region A or B who also match the promo segment"
-- it partially bypasses the promo-segment filter entirely for RegionA.

The colleague's explicitly parenthesized version, (RegionA UNION
RegionB) INTERSECT PromoSegment, correctly computes the full region
A-or-B customer set FIRST, then intersects the WHOLE thing with the
promo segment -- matching the intended business question precisely.
This is exactly why the unparenthesized report shows MORE customers:
it never actually filters RegionA customers by promo-segment
membership at all, due to INTERSECT's tighter binding grouping it with
RegionB instead of with the combined UNION result.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the main page\'s own theory statement "INTERSECT binds tighter than UNION" is a minor syntactic detail that mostly affects how a query looks, not what it actually returns.',
      reality: 'the small three-set fixture above shows the two groupings return genuinely different result sets ({1,2,3} vs {3}) from identical input data — the precedence rule has real, measurable consequences on query results, not just on formatting.',
    },
    {
      thought: 'writing a mixed UNION/INTERSECT query without parentheses, using the "natural" left-to-right reading order, produces the same result as explicitly parenthesizing left-to-right.',
      reality: 'INTERSECT\'s tighter binding overrides simple left-to-right evaluation — an unparenthesized query silently groups the INTERSECT branch with its neighboring operand first, regardless of where it appears in the overall left-to-right reading order.',
    },
    {
      thought: 'memorizing SQL\'s operator precedence rules (INTERSECT before UNION/EXCEPT) is a reliable way to write correct mixed set-operation queries without needing parentheses.',
      reality: 'even with the rule correctly memorized, an unparenthesized query is harder for a FUTURE reader (or the original author, months later) to verify correctly — explicit parentheses remove any ambiguity for every reader, not just the one who happens to remember the precedence table.',
    },
  ];
}
