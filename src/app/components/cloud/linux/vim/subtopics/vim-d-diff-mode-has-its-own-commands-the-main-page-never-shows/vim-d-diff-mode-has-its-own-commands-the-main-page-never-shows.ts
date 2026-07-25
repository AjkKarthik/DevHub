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
  templateUrl: './vim-d-diff-mode-has-its-own-commands-the-main-page-never-shows.html',
  styleUrl: './vim-d-diff-mode-has-its-own-commands-the-main-page-never-shows.scss'
})
export class VimDDiffModeHasItsOwnCommandsTheMainPageNeverShowsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions diff mode exists, but stops there entirely',
      points: [
        'The main page\'s own Essential Commands code tab includes exactly one line about it: <code>vim -d file1 file2 # diff mode</code>. Nothing else on the page explains what actually becomes possible once diff mode is open, or the specific keybindings diff mode adds on top of everything the main page already covers.',
      ]
    },
    {
      heading: 'Diff mode adds its own transfer commands: do (obtain) and dp (put)',
      points: [
        'With two files open side by side in diff mode, <code>do</code> ("diff obtain") pulls the diff hunk under the cursor FROM the OTHER window INTO the current one — effectively "accept their version of this change." <code>dp</code> ("diff put") does the reverse, pushing the current window\'s hunk under the cursor TO the other window — "apply my version of this change to the other file."',
        'Both are single-keystroke shortcuts for the underlying Ex commands <code>:diffget</code> and <code>:diffput</code> respectively — <code>do</code>/<code>dp</code> exist specifically so a hunk can be resolved without ever leaving Normal mode or typing a full command, which matters when working through many small hunks in sequence.',
      ]
    },
    {
      heading: 'Navigating between hunks: ]c and [c',
      points: [
        '<code>]c</code> jumps FORWARD to the start of the next change (hunk), and <code>[c</code> jumps BACKWARD to the previous one — this is how you move through a multi-hunk diff systematically, resolving each with <code>do</code>/<code>dp</code> as you go, rather than manually scrolling to find where the files actually differ.',
        'Put together, the main page\'s own bare <code>vim -d file1 file2</code> becomes a genuinely usable, keyboard-only merge-conflict-resolution workflow once these four commands are known: open in diff mode, <code>]c</code> to the first hunk, <code>do</code> or <code>dp</code> to resolve it, <code>]c</code> again to the next one, repeat — a real, everyday use case for developers resolving git merge conflicts directly in vim (<code>git mergetool</code> commonly launches exactly this diff-mode setup, three or four-way).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Opening diff mode -- the main page\'s own starting point',
      language: 'bash',
      code: `# The main page's own single line on this:
vim -d config-old.yaml config-new.yaml

# Two windows open side by side, differences highlighted --
# but the main page never says what to actually DO once here.
# Confirm you're genuinely in diff mode:
# :set diff?
#   diff                  <-- confirms diff mode is active for
#                              the current window

# Also usable on an already-running vim, without the -d flag:
# :vertical diffsplit config-new.yaml`,
    },
    {
      label: 'The commands the main page never mentions: do, dp, ]c, [c',
      language: 'bash',
      code: `" Navigate to the first difference in the file:
]c
" jumps forward to the start of the next hunk (change)

" Decide, per hunk, which version to keep:
do
" "diff obtain" -- pulls the OTHER window's version of this
" hunk into the current window ("accept theirs")

dp
" "diff put" -- pushes the CURRENT window's version of this
" hunk to the other window ("apply mine to the other file")

" Continue to the next hunk and repeat:
]c
do    " or dp, depending on which version is correct here

" [c jumps BACKWARD to the previous hunk, if you need to
" revisit a decision:
[c

" A real, common workflow: resolving a git merge conflict
" directly in vim's diff mode (git mergetool commonly opens
" exactly this setup):
" git mergetool
" -- opens a 3 or 4-way diff; ]c / do / dp resolve each
"    conflicting hunk one at a time, entirely from the keyboard`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own example, a developer opens two config file versions with `vim -d config-old.yaml config-new.yaml` to compare them before a deployment. They can see the highlighted differences clearly, but need to merge a few specific changes from the new file into the old one, keeping most of the old file\'s structure intact. What commands (not mentioned anywhere on the main page) would let them do this entirely from the keyboard, one change at a time?',
    hint: 'Diff mode adds its own set of commands on top of everything the main page already covers — think about what single-keystroke commands would let you both NAVIGATE between the differences and TRANSFER a specific change from one file to the other.',
    solution: 'The commands needed are `]c` to jump forward to each successive difference (hunk) in sequence, and `do` ("diff obtain") to pull a specific hunk\'s content FROM the new file\'s window INTO the old file\'s window when that particular change should be merged in — used together, `]c` then `do` (repeated for each hunk that should be merged) lets the developer walk through the differences one at a time and selectively pull in just the changes that are actually wanted, leaving the rest of the old file\'s structure untouched. `[c` is available to jump backward if a decision needs revisiting, and `dp` (the reverse of `do`) would push a change from the old file\'s window TO the new file\'s window, for the less common case of merging in the opposite direction.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'vim -d (diff mode) is purely a read-only, side-by-side comparison view — actually merging changes between the two files requires manually editing and copy-pasting text.',
      reality: 'Per this subtopic\'s theory, diff mode has its own dedicated transfer commands — do (obtain from the other window) and dp (put to the other window) — that resolve a specific hunk with a single keystroke, no manual copy-paste needed.'
    },
    {
      thought: 'Navigating between differences in diff mode requires manually scrolling or searching to find where the files actually differ.',
      reality: 'Per this subtopic\'s theory, ]c and [c jump directly forward and backward between hunks (the actual points of difference), letting you walk through every change in the diff systematically without any manual scrolling or searching.'
    },
    {
      thought: 'The commands used to resolve git merge conflicts in an editor are unrelated to vim\'s own diff mode.',
      reality: 'Per this subtopic\'s theory, git mergetool commonly launches exactly this vim diff-mode setup (a 3 or 4-way diff) — the same ]c/do/dp commands used for comparing two arbitrary files are the actual mechanism for resolving merge conflicts directly in vim.'
    }
  ];
}
