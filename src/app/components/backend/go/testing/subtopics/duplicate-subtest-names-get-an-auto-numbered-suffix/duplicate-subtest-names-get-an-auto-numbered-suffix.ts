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
  templateUrl: './duplicate-subtest-names-get-an-auto-numbered-suffix.html',
  styleUrl: './duplicate-subtest-names-get-an-auto-numbered-suffix.scss'
})
export class DuplicateSubtestNamesGetAnAutoNumberedSuffixSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page assumes tc.name in a table-driven loop is always unique — it never has to be',
      points: [
        'The main page\'s own theory says "Name subtests descriptively: t.Run(tc.name, ...) — go test -run \\"TestAdd/adds_two_negatives\\" targets one case," and its own TestAdd table-driven example uses four hand-written, distinct case names. Nothing on the main page ever addresses what happens if two entries in the same table happen to share a name — an easy accident once a table grows past a handful of hand-typed cases, or when case names are generated programmatically.',
        'The official testing package documentation for T.Run states plainly: "Each subtest and sub-benchmark has a unique name: the combination of the name of the top-level test and the sequence of names passed to Run, separated by slashes, with an optional trailing sequence number for disambiguation." The framework itself guarantees uniqueness — it does not require the CALLER to guarantee it.',
        'The T.Name documentation confirms the mechanism directly: "If two sibling sub-tests have the same name, Name will append a suffix to guarantee the returned name is unique." In practice this suffix is #01, #02, and so on, appended to every name after the first duplicate.',
      ]
    },
    {
      heading: 'This silently changes the exact string a -run filter or CI report needs to match',
      points: [
        'Two table entries both named "negative input" become subtests literally named TestAdd/negative_input and TestAdd/negative_input#01 in go test output — not two independent tests both matching go test -run "TestAdd/negative_input". The FIRST occurrence keeps the plain name; every subsequent duplicate gets the #01, #02 suffix appended.',
        'This means the main page\'s own -run example — go test -run "TestAdd/adds_two_negatives" — would silently stop targeting "the negative case" as a whole the moment a second case with that exact name is added to the table; it would only match the first one, and the second would need the -run pattern updated to include #01 explicitly, or a broader regex.',
        'This is not a build error, a test failure, or even a warning — go test runs both subtests successfully under their disambiguated names. The only symptom is confusion later, when someone tries to re-run "the failing negative_input case" from a CI log and the exact name they copied (without the #01 suffix) matches zero, one, or the wrong subtest depending on which duplicate they meant.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own table -- accidentally introducing a duplicate name',
      language: 'typescript',
      code: `package math

import "testing"

func TestAdd(t *testing.T) {
    cases := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"both positive", 2, 3, 5},
        {"both negative", -2, -3, -5},
        {"mixed signs", -2, 3, 1},
        {"zero values", 0, 0, 0},
        // A teammate adds a new case later, reusing a name that
        // already exists earlier in the same table -- an easy
        // copy-paste accident in a table that has grown to 20+ rows:
        {"zero values", 0, 5, 5}, // duplicate name!
    }

    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            got := Add(tc.a, tc.b)
            if got != tc.expected {
                t.Errorf("Add(%d, %d) = %d; want %d", tc.a, tc.b, got, tc.expected)
            }
        })
    }
}

// go test -v -run TestAdd output:
// === RUN   TestAdd/both_positive
// === RUN   TestAdd/both_negative
// === RUN   TestAdd/mixed_signs
// === RUN   TestAdd/zero_values
// === RUN   TestAdd/zero_values#01   <- auto-disambiguated, per the
//                                        testing package's own docs
// --- PASS: TestAdd (0.00s)
//     --- PASS: TestAdd/both_positive (0.00s)
//     --- PASS: TestAdd/both_negative (0.00s)
//     --- PASS: TestAdd/mixed_signs (0.00s)
//     --- PASS: TestAdd/zero_values (0.00s)
//     --- PASS: TestAdd/zero_values#01 (0.00s)`,
    },
    {
      label: 'The consequence for -run filters',
      language: 'typescript',
      code: `// Before the duplicate was added, this correctly ran ONE subtest:
// go test -run "TestAdd/zero_values"
// === RUN   TestAdd/zero_values
// --- PASS: TestAdd (0.00s)
//     --- PASS: TestAdd/zero_values (0.00s)

// After the duplicate exists, the SAME command now only matches the
// FIRST "zero_values" subtest -- the "#01" one is a DIFFERENT string
// and go test -run uses regexp matching against the exact subtest
// name, per the testing package's own documented naming scheme:
// go test -run "TestAdd/zero_values"
// === RUN   TestAdd/zero_values
// --- PASS: TestAdd (0.00s)
//     --- PASS: TestAdd/zero_values (0.00s)
// (TestAdd/zero_values#01 never runs -- "zero_values" does not
//  match the literal substring "zero_values#01" as a regexp anchor
//  in the way someone might assume it would)

// To target the SECOND duplicate specifically, the suffix must be
// included explicitly:
// go test -run "TestAdd/zero_values#01"

// The actual fix is simply giving the table entries distinct names:
// {"zero values, a=0", 0, 0, 0},
// {"zero values, b=0 only", 0, 5, 5},
// -- eliminating the disambiguation suffix (and the fragile -run
// targeting it implies) entirely.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A table-driven test file has grown to 30 cases over many pull requests. A CI run fails one subtest, and the log shows the failure under the name TestValidate/invalid_email#01. A developer, unaware of subtest name disambiguation, searches the test file for the literal string "invalid_email#01" to find and fix the failing case, and finds nothing — no case in the table is named that. Using this subtopic\'s theory, explain what the developer should actually search for, and why "invalid_email#01" does not appear literally anywhere in the source file.',
    hint: 'Per this subtopic\'s theory, where does the "#01" suffix in a subtest name actually come from — is it something a developer types into the table\'s name field, or something the testing package appends automatically? How many table entries would need to share the same name for a "#01" duplicate to appear?',
    solution: 'The developer should search for the literal string "invalid_email" (without any suffix) — per this subtopic\'s theory, the #01 suffix is never written by a developer; it is appended automatically by the testing package itself, exactly as the documentation states: "If two sibling sub-tests have the same name, Name will append a suffix to guarantee the returned name is unique." The presence of a "#01" suffix in the failing subtest\'s name is itself a strong signal that AT LEAST TWO table entries share the literal name "invalid_email" — the failing one is specifically the SECOND (or later) occurrence of that name in the table, since per this subtopic\'s theory "the FIRST occurrence keeps the plain name; every subsequent duplicate gets the #01, #02 suffix appended." The developer\'s search for the exact string "invalid_email#01" fails because that exact string exists nowhere in the source — it is a runtime-generated display name, not source text. The correct fix, once both "invalid_email" entries are located in the table, is either renaming them to be distinct (eliminating the ambiguity going forward) or, if only investigating which one failed, checking the table\'s entry ORDER — the failing one is the second (or later) "invalid_email" row from the top.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If two table-driven test cases accidentally share the same name, go test will fail to compile or report an error, since subtest names are supposed to be unique.',
      reality: 'This subtopic\'s theory and first code example show the opposite: both subtests run and can both pass or fail independently, with zero compile error and zero warning. The testing package silently disambiguates the duplicate by appending a #01 suffix, per its own documented behavior — uniqueness is enforced automatically, not required from the caller.'
    },
    {
      thought: 'A #01 suffix appearing in a subtest name in test output or a CI log is something a developer is expected to have typed into the test case\'s own name field.',
      reality: 'This subtopic\'s exercise shows the suffix is generated entirely by the testing package at runtime — per the T.Name documentation, it is appended automatically "to guarantee the returned name is unique." Searching the source file for the literal suffixed string will never find it, since it does not exist anywhere in the source text.'
    },
    {
      thought: 'A go test -run filter targeting a subtest\'s base name (e.g. "TestAdd/zero_values") will match every subtest sharing that base name, including any auto-disambiguated #01, #02 duplicates.',
      reality: 'This subtopic\'s second code example shows -run matches the literal disambiguated name as a regexp — "zero_values" matches only the first, un-suffixed occurrence; the "#01" duplicate requires its own explicit "zero_values#01" pattern to target specifically, since it is a genuinely different string from the testing framework\'s perspective.'
    }
  ];
}
