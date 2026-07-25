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
  templateUrl: './a-delete-silently-clobbers-your-yank-use-0p-to-paste-it-back.html',
  styleUrl: './a-delete-silently-clobbers-your-yank-use-0p-to-paste-it-back.scss'
})
export class ADeleteSilentlyClobbersYourYankUse0PToPasteItBackSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions the fix in passing, without ever explaining the problem it solves',
      points: [
        'The main page\'s own Editing Operations theory states, as a single throwaway clause: \'Vim has multiple registers — "0p pastes the last yank.\' It never explains WHY you would need a special register just for "the last yank" specifically, as opposed to just using plain <code>p</code> — which is exactly the gap that makes this feel like obscure trivia rather than an essential, frequently-needed fix.',
      ]
    },
    {
      heading: 'The problem: the default unnamed register is shared by BOTH yanks and deletes',
      points: [
        'Plain <code>p</code> pastes from the unnamed register (<code>""</code>) — and that register is overwritten by BOTH <code>y</code> (yank) AND <code>d</code>/<code>dd</code>/<code>x</code> (delete) operations alike. This means any delete performed AFTER a yank, even one completely unrelated to the text you meant to paste, silently replaces what <code>p</code> will actually paste.',
        'The classic, extremely common sequence this breaks: yank a line with <code>yy</code> intending to paste it somewhere later, then delete a different, unrelated line for cleanup along the way with <code>dd</code> — the unnamed register now holds the DELETED line, not the originally yanked one, and <code>p</code> pastes the wrong text entirely, with no warning or indication anything went wrong.',
      ]
    },
    {
      heading: 'The fix, and why it works: register 0 is yank-only',
      points: [
        'Vim maintains a SEPARATE register specifically for yanks — register <code>0</code> — that is updated ONLY by <code>y</code> operations and is never touched by any delete command, no matter how many deletes happen in between. <code>"0p</code> (double-quote, zero, p) explicitly pastes from THAT register instead of the unnamed one.',
        'The practical habit worth building: whenever a yank needs to survive past any intervening edits (which is most of the time something is yanked with the intent to paste it somewhere else), reach for <code>"0p</code> instead of plain <code>p</code> by default — it costs two extra keystrokes and is immune to exactly the class of "wait, why did it paste the wrong thing" confusion the plain unnamed-register behavior produces.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the clobbered-yank bug',
      language: 'bash',
      code: `# Starting buffer:
#   line one
#   line two (delete this)
#   line three

# Step 1: yank "line one" intending to paste it further down
# (cursor on "line one")
yy

# Step 2: clean up an unrelated line before pasting
# (cursor moves to "line two (delete this)")
dd
# Buffer is now:
#   line one
#   line three

# Step 3: paste, expecting "line one" to reappear
# (cursor on "line three")
p
# Buffer is now:
#   line one
#   line three
#   line two (delete this)     <-- WRONG -- this pastes the
#                                    DELETED line, not the
#                                    originally yanked one --
#                                    dd silently overwrote the
#                                    unnamed register in between`,
    },
    {
      label: 'The fix: "0p instead of plain p',
      language: 'bash',
      code: `# Same starting sequence:
yy                    # yank "line one" -- also fills register 0
dd                    # delete "line two..." -- overwrites the
                       # UNNAMED register, but register 0 is
                       # untouched by any delete

# Paste from register 0 explicitly instead of the unnamed one:
"0p
# Buffer is now:
#   line one
#   line three
#   line one              <-- CORRECT -- register 0 held the
#                              original yank the whole time,
#                              immune to the intervening delete

# Confirm what's actually in each register at any point:
:reg
# --- Registers ---
# ""   line two (delete this)^J     <-- unnamed: last delete
# "0   line one^J                    <-- register 0: last YANK,
#                                        regardless of deletes since`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'While editing a config file in vim, you yank a block of settings with `yy` intending to duplicate it further down the file. Before pasting, you delete two unrelated blank lines elsewhere in the file to tidy things up. When you finally press `p` at the target location, the wrong text appears — one of the blank lines you deleted, not the settings block you yanked. Why did this happen, and what single-character change to the paste command would have prevented it?',
    hint: 'Check which register plain p actually pastes from, and whether that specific register is affected by delete operations as well as yank operations.',
    solution: 'Plain `p` pastes from the unnamed register (`""`), which is overwritten by BOTH yank AND delete operations — the two blank-line deletions performed after the original yank each overwrote the unnamed register in turn, so by the time `p` was pressed, it held the most recently deleted blank line, not the originally yanked settings block. The fix is using `"0p` instead of plain `p` — register `0` is updated ONLY by yank operations and is never touched by deletes, so it would have still held the original settings block regardless of how many unrelated deletions happened in between, and `"0p` would have pasted the correct text.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once text is yanked in vim, it stays available to paste with plain p until something else is explicitly yanked (not deleted).',
      reality: 'Per this subtopic\'s theory, the unnamed register that plain p pastes from is overwritten by BOTH yanks AND deletes — any delete operation performed after a yank silently replaces what p will actually paste, with no warning.'
    },
    {
      thought: '"0p is obscure, rarely-needed trivia — plain p is sufficient for normal editing.',
      reality: 'Per this subtopic\'s theory, "0p directly solves one of the most common sources of vim paste confusion (a delete between a yank and a paste silently corrupting what gets pasted) — worth using by default whenever a yank is meant to survive past any intervening edits, which is most of the time.'
    },
    {
      thought: 'If p pastes unexpected text, the yank command itself must have failed or targeted the wrong text.',
      reality: 'Per this subtopic\'s theory, this symptom is the classic signature of an intervening delete overwriting the unnamed register — the original yank very likely succeeded correctly; :reg confirms this by showing register 0 still holding the originally yanked text even when the unnamed register has since been overwritten.'
    }
  ];
}
