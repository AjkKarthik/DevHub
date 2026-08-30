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
  templateUrl: './smartcase-does-nothing-unless-ignorecase-is-also-set.html',
  styleUrl: './smartcase-does-nothing-unless-ignorecase-is-also-set.scss'
})
export class SmartcaseDoesNothingUnlessIgnorecaseIsAlsoSetSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows both settings together, with no explanation of how they actually relate',
      points: [
        'The main page\'s own .vimrc example shows <code>set ignorecase smartcase</code> on a single line with the comment "case-insensitive unless uppercase" — presented as if these are two independent settings that happen to be commonly used together. They are not independent: one of them is completely inert without the other.',
      ]
    },
    {
      heading: 'smartcase is a MODIFIER of ignorecase, not a standalone setting',
      points: [
        '<code>smartcase</code> only has any effect at all when <code>ignorecase</code> is also enabled — its entire job is to selectively OVERRIDE ignorecase\'s blanket case-insensitivity when the search pattern itself contains an uppercase character. With <code>ignorecase</code> off, there is no case-insensitivity for smartcase to selectively override in the first place, so <code>smartcase</code> alone does absolutely nothing — searches remain plain case-SENSITIVE regardless of whether smartcase is set.',
        'This makes <code>set smartcase</code> (without <code>ignorecase</code>) a genuinely silent no-op — vim raises no error, no warning, nothing indicates the setting had zero effect. Someone who only copies the <code>smartcase</code> line from an example .vimrc, or comments out <code>ignorecase</code> while debugging something else and forgets to restore it, ends up with search behavior identical to having neither setting at all.',
      ]
    },
    {
      heading: 'How the pair actually behaves together, and how to verify it',
      points: [
        'With BOTH set (exactly the main page\'s own example): a search typed entirely in lowercase (like <code>/error</code>) is case-INSENSITIVE, matching "error", "Error", and "ERROR" alike — because <code>ignorecase</code> is doing its job and the pattern has no uppercase for <code>smartcase</code> to react to. A search containing ANY uppercase character (like <code>/Error</code>) becomes case-SENSITIVE, matching only the exact case typed — because <code>smartcase</code> detects the uppercase and overrides <code>ignorecase</code> for that specific search.',
        '<code>:set ignorecase?</code> and <code>:set smartcase?</code> (run separately, each with a trailing <code>?</code>) query the CURRENT value of each option directly inside vim — worth checking both together before assuming a "case-insensitive unless uppercase" .vimrc snippet copied from elsewhere is actually behaving as intended, especially in an unfamiliar or partially-customized vimrc where one of the two might have been set (or unset) independently somewhere else in the file.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the silent no-op',
      language: 'bash',
      code: `" .vimrc -- ONLY smartcase set, ignorecase left at its default
" (off) -- this looks reasonable at a glance but is a silent
" no-op for smartcase specifically
set smartcase
" (no "set ignorecase" line anywhere in this file)

" Inside vim, confirm the actual state of both options:
:set ignorecase?
" noignorecase          <-- OFF (vim's own default)
:set smartcase?
" smartcase              <-- ON, but doing NOTHING without
"                              ignorecase also being on

" Searching in the buffer:
/error
" only matches lines containing exactly "error" (lowercase) --
" NOT "Error" or "ERROR" -- despite smartcase being "on", the
" search behaves as plain case-SENSITIVE, identical to having
" neither option set at all`,
    },
    {
      label: 'The fix: both together, and how to verify the combination',
      language: 'bash',
      code: `" .vimrc -- the main page's own correct pairing
set ignorecase
set smartcase

" Confirm both are actually active:
:set ignorecase?
" ignorecase             <-- ON
:set smartcase?
" smartcase              <-- ON

" NOW the intended "case-insensitive unless uppercase" behavior
" actually works:
/error
" matches "error", "Error", "ERROR" -- all-lowercase pattern,
" ignorecase applies fully, smartcase has nothing to override

/Error
" matches ONLY "Error" -- exact case -- the uppercase E in the
" search pattern triggers smartcase, which overrides ignorecase
" for this specific search

" Quick one-off toggle without touching .vimrc at all, useful
" for verifying the exact behavior interactively:
:set ic scs      " ic = ignorecase, scs = smartcase (short forms)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer inherits a .vimrc from a colleague that includes `set smartcase` on its own line, with no `set ignorecase` anywhere in the file. Confused that searches never seem to be case-insensitive even for simple lowercase patterns like `/todo`, they assume smartcase itself must be broken or that they\'re misunderstanding what it does. What is actually going on, and what one-line addition to the .vimrc would fix it?',
    hint: 'Check whether smartcase is documented as a fully independent setting, or as something that only modifies the behavior of a DIFFERENT setting — and whether that other setting is present anywhere in this .vimrc at all.',
    solution: 'smartcase is not a standalone setting — it only has any effect when ignorecase is also enabled, since its entire job is to selectively override ignorecase\'s case-insensitivity when a search pattern contains an uppercase character. With no `set ignorecase` line anywhere in the inherited .vimrc, ignorecase remains at vim\'s own default (off), which means there is no case-insensitivity for smartcase to override in the first place — smartcase alone is a silent no-op, and every search behaves as plain case-sensitive regardless of the smartcase setting, exactly matching the observed symptom. The fix is adding `set ignorecase` to the .vimrc alongside the existing `set smartcase` line — with both present, a lowercase search pattern becomes case-insensitive as expected, while a pattern containing any uppercase character correctly stays case-sensitive.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'set smartcase is a fully independent vim setting that, on its own, makes searches case-insensitive for lowercase patterns and case-sensitive for mixed-case ones.',
      reality: 'Per this subtopic\'s theory, smartcase only modifies the behavior of ignorecase — without ignorecase also being set, smartcase does absolutely nothing, and all searches remain plain case-sensitive regardless of the smartcase setting.'
    },
    {
      thought: 'If a vim search doesn\'t behave as case-insensitive despite smartcase being set, smartcase itself must be misconfigured or not working correctly.',
      reality: 'Per this subtopic\'s theory, this is the expected, silent behavior of smartcase without its required companion setting, ignorecase — checking :set ignorecase? directly reveals whether the actual root cause is a missing ignorecase, not a broken smartcase.'
    },
    {
      thought: 'Copying just the smartcase line from an example .vimrc snippet is enough to get "case-insensitive unless uppercase" search behavior.',
      reality: 'Per this subtopic\'s theory, both ignorecase AND smartcase need to be set together for this behavior to actually work — copying only one of the two produces either plain case-sensitive search (smartcase alone) or plain case-insensitive search with no uppercase override (ignorecase alone), neither of which is the intended combined behavior.'
    }
  ];
}
