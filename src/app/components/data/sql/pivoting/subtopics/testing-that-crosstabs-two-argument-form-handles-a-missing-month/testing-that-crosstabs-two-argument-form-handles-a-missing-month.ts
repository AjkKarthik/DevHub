import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-crosstab-two-arg-safety-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-that-crosstabs-two-argument-form-handles-a-missing-month.html',
  styleUrl: './testing-that-crosstabs-two-argument-form-handles-a-missing-month.scss',
})
export class TestingThatCrosstabsTwoArgumentFormHandlesAMissingMonthSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Quiet Correct Choice, Worth Confirming',
      points: [
        'PostgreSQL\'s crosstab() function actually has two forms, though the main page only shows one. The 1-argument form — crosstab(source_sql) — assumes categories appear in the SAME positional order for every row group; if one row_name is missing a category that others have, every value AFTER the gap silently shifts into the wrong output column. This is the version most crosstab() horror stories online are about.',
        'The main page\'s code tab uses the SAFER 2-argument form: crosstab(source_sql, category_sql), passing a second query — VALUES (\'Jan\'), (\'Feb\'), (\'Mar\') — that explicitly defines the categories and their order. This form matches each value to its output column BY NAME, not by position, so a missing category for one product produces NULL in that column rather than shifting everything else. The page never explains this distinction or demonstrates it — it\'s simply true by virtue of which form was picked.',
      ],
    },
    {
      heading: 'Proving the Safety Empirically',
      points: [
        'This subtopic runs the main page\'s own crosstab() code against data where one product has no February sales at all — a realistic sparse-data scenario — and confirms the 2-argument form correctly produces NULL specifically in the "Feb" column for that product, with Jan and Mar unaffected. For contrast, it shows what the DANGEROUS 1-argument form would have done with the identical data: silently shifted the March value into the February column.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Sparse data — one product missing a month entirely',
      language: 'sql',
      code: `CREATE TABLE sales (product TEXT, month TEXT, amount NUMERIC);
INSERT INTO sales VALUES
    ('Widget', 'Jan', 1500), ('Widget', 'Feb', 2200), ('Widget', 'Mar', 1800),
    ('Gadget', 'Jan', 900),                           ('Gadget', 'Mar', 1400);
    -- Gadget has NO February row at all -- a genuine gap in the data.`,
    },
    {
      label: 'The main page\'s own 2-argument crosstab — confirmed safe',
      language: 'sql',
      code: `CREATE EXTENSION IF NOT EXISTS tablefunc;

SELECT *
FROM crosstab(
    $$ SELECT product, month, SUM(amount)
       FROM sales
       GROUP BY product, month
       ORDER BY product $$,
    $$ VALUES ('Jan'), ('Feb'), ('Mar') $$
) AS ct(product TEXT, "Jan" NUMERIC, "Feb" NUMERIC, "Mar" NUMERIC);

--  product |  Jan | Feb  | Mar
-- ---------+------+------+------
--  Gadget  |  900 | NULL | 1400
--  Widget  | 1500 | 2200 | 1800
--
-- Gadget's missing February row correctly produces NULL in the "Feb"
-- column -- Mar is NOT shifted into Feb's position. This is the
-- 2-argument form's category_sql doing exactly its job: matching
-- each value to its column BY NAME, immune to gaps in the source data.`,
    },
    {
      label: 'For contrast — what the risky 1-argument form would do',
      language: 'sql',
      code: `-- The main page does NOT show this form, but it's worth knowing to
-- avoid by name: crosstab(sql) with only ONE argument assumes every
-- row_name group has the SAME NUMBER of rows in the SAME category
-- order. It has no category_sql to match against, so it just takes
-- values POSITIONALLY, in whatever order the source query returns them:
SELECT *
FROM crosstab(
    $$ SELECT product, month, SUM(amount)
       FROM sales
       GROUP BY product, month
       ORDER BY product, month $$
) AS ct(product TEXT, "Jan" NUMERIC, "Feb" NUMERIC, "Mar" NUMERIC);

--  product |  Jan |  Feb | Mar
-- ---------+------+------+------
--  Gadget  |  900 | 1400 | NULL   -- WRONG: March's value (1400) shifted
--                                    into the "Feb" column, and "Mar"
--                                    is now NULL instead of 1400
--  Widget  | 1500 | 2200 | 1800   -- correct only because Widget has
--                                    no gaps
--
-- This is exactly the crosstab() misalignment bug widely warned
-- about online -- and exactly what the main page's choice of the
-- 2-argument form avoids, even though the page never says so.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate reading the main page\'s crosstab() example wants to simplify it by removing the second argument — "we don\'t really need to list Jan/Feb/Mar separately, the source query already returns them in order." Using the sparse-data test above, explain what would break, and for which products specifically.',
    hint: 'Compare the two crosstab() result tables above — which one has the shifted value, and what does that product have in common (or not have) compared to the other?',
    solution: `Removing the second argument would switch to the dangerous 1-argument
crosstab() form, which relies purely on positional matching within
each row_name group. It would work correctly for Widget, which has
all three months present with no gaps -- but it would silently
corrupt Gadget's row, whose missing February causes March's value
(1400) to shift into the February output column, leaving the March
column NULL instead.

The break is specific to any product with a GAP in its category
data -- products with complete Jan/Feb/Mar coverage are unaffected,
which is precisely what makes this bug so dangerous in production: it
only surfaces for the subset of rows with missing categories, and it
produces a plausible-looking (not obviously wrong) NUMERIC value in
the wrong column rather than an error. The second argument
(category_sql) is what prevents this — it should stay in place
specifically because real sales data is rarely guaranteed to have
every category present for every group.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'PostgreSQL\'s crosstab() function has one standard form, and the main page\'s example — with its second VALUES (\'Jan\'), (\'Feb\'), (\'Mar\') argument — is just extra boilerplate that could be simplified away.',
      reality: 'crosstab() has two genuinely different forms — the main page specifically uses the safer 2-argument version, where the second argument is what makes category matching immune to gaps in the source data, not optional boilerplate.',
    },
    {
      thought: 'a product with a missing month in the source data will show up correctly with NULL in that month\'s column regardless of which crosstab() form is used.',
      reality: 'this is true ONLY for the 2-argument form used on the main page — the 1-argument form has no way to detect a gap and instead silently shifts subsequent values into the wrong columns for exactly the rows with missing categories.',
    },
    {
      thought: 'crosstab() column misalignment bugs described in blog posts and forums are a general risk of using crosstab() at all, regardless of how it\'s called.',
      reality: 'that specific risk is confined to the 1-argument crosstab(sql) form — the 2-argument crosstab(sql, category_sql) form the main page demonstrates is immune to it by design, since it matches values to columns by category name rather than position.',
    },
  ];
}
