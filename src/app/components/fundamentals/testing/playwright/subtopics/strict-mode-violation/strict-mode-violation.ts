import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-test-strict-mode-violation',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './strict-mode-violation.html',
  styleUrl: './strict-mode-violation.scss'
})
export class StrictModeViolationSubtopic {
  theory: TheoryPoint[] = [
    {
      "heading": "Verified in Chromium",
      "points": [
        "A page with two <code>Save</code> buttons made <code>page.getByRole('button', { name: 'Save' }).click()</code> fail with \"strict mode violation: getByRole('button', { name: 'Save' }) resolved to 2 elements\".",
        "The same locator with <code>.first()</code> clicked without error, and <code>.count()</code> returned 2.",
        "Strictness is deliberate: a test that clicks \"some\" matching element can pass while clicking the wrong one.",
        "The page already uses <code>items.first()</code> in one assertion; that is fine there because it checks the first item on purpose."
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      "label": "Ambiguous",
      "language": "typescript",
      "code": "// Two dialogs both have a Save button\nawait page.getByRole('button', { name: 'Save' }).click();\n// Error: strict mode violation: ... resolved to 2 elements"
    },
    {
      "label": "Unique",
      "language": "typescript",
      "code": "const dialog = page.getByRole('dialog', { name: 'Edit profile' });\nawait dialog.getByRole('button', { name: 'Save' }).click();\n\n// Or filter a list down to one row\nawait page.getByRole('row').filter({ hasText: 'Widget' })\n  .getByRole('button', { name: 'Delete' }).click();"
    }
  ];

  exercise: TryItExercise = {
    "prompt": "A table has a Delete button in every row. You want to delete the row containing \"Gadget\". Why is <code>getByRole('button', { name: 'Delete' }).nth(1)</code> a weak choice?",
    "hint": "What decides which row is second?",
    "solution": "It depends on row order, not on the data. If sorting changes or a row is added above, nth(1) deletes a different item and the test may still pass. Scope to the row instead: getByRole(\"row\").filter({ hasText: \"Gadget\" }).getByRole(\"button\", { name: \"Delete\" })."
  };

  misconceptions: Misconception[] = [
    {
      "thought": "Playwright clicks the first match when several elements match.",
      "reality": "Actions fail with a strict mode violation unless the locator resolves to exactly one element."
    },
    {
      "thought": "<code>first()</code> is the standard fix.",
      "reality": "It works but hides ambiguity; scoping or filtering expresses which element you mean."
    }
  ];
}
