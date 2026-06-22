import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-linux-vim',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './vim.html',
  styleUrl: './vim.scss'
})
export class LinuxVim {

  quickRef: QuickRefItem[] = [
    { name: 'i / a / o', type: 'keyword', desc: 'Insert before cursor / after cursor / new line below' },
    { name: 'Esc', type: 'keyword', desc: 'Return to Normal mode from any mode' },
    { name: ':w / :q / :wq / :q!', type: 'keyword', desc: 'Write / quit / write+quit / quit without saving' },
    { name: 'dd / yy / p', type: 'keyword', desc: 'Delete line / yank (copy) line / paste' },
    { name: 'u / Ctrl+r', type: 'keyword', desc: 'Undo / redo' },
    { name: '/ pattern then n / N', type: 'keyword', desc: 'Search forward; n=next match, N=previous' },
    { name: ':%s/old/new/g', type: 'keyword', desc: 'Replace all occurrences in file' },
    { name: 'gg / G', type: 'keyword', desc: 'Go to first / last line' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Vim Modes',
      points: [
        'Normal mode: the default. Movement, deletion, yanking, pasting. Press Esc to return here from any mode.',
        'Insert mode: type text. Enter with i (before), a (after), o (new line below), O (new line above), I (line start), A (line end).',
        'Visual mode: select text. v = character-wise, V = line-wise, Ctrl+v = block. Then operate on selection (d=delete, y=yank, >=indent).',
        'Command mode: :commands. Access from Normal mode with :. Examples: :w (save), :q (quit), :set number, :%s/old/new/g.',
        'Replace mode: R. Types replace existing characters. Rare but useful for fixing typos without inserting.',
      ],
    },
    {
      heading: 'Navigation',
      points: [
        'h j k l: left, down, up, right (works without arrow keys — home row navigation).',
        'w = move forward one word, b = back one word, e = end of word. W/B/E use whitespace-only boundaries.',
        '0 = line start, $ = line end, ^ = first non-whitespace. gg = file start, G = file end. :N = jump to line N.',
        'Ctrl+f / Ctrl+b = page forward / back. Ctrl+d / Ctrl+u = half page down / up.',
        '{ } = jump between blank lines (paragraph movement). % = jump to matching bracket.',
      ],
    },
    {
      heading: 'Editing Operations',
      points: [
        'Operators: d (delete), y (yank/copy), c (change = delete + insert), > (indent), < (dedent). Combine with motions: dw = delete word, d$ = delete to line end.',
        'Numbers prefix repeat: 3dd = delete 3 lines, 5j = move down 5 lines, 2dw = delete 2 words.',
        'p (lowercase) pastes after cursor. P (uppercase) pastes before. Vim has multiple registers — "0p pastes the last yank.',
        'ci" = change inside quotes (delete between quotes, enter insert). vi) = select inside parentheses. da[ = delete around brackets.',
      ],
    },
    {
      heading: 'Search, Replace, and Config',
      points: [
        '/ pattern searches forward; ? searches backward. n jumps to next match, N to previous. * searches for word under cursor.',
        ':%s/old/new/g replaces all. :5,10s/old/new/g replaces in lines 5-10. /g = global (all occurrences per line). /i = case-insensitive.',
        ':set number (:set nu) shows line numbers. :set syntax=yaml sets syntax highlighting. :set tabstop=4 shiftwidth=4 expandtab for spaces.',
        '~/.vimrc is your personal config. Minimal useful vimrc: set number, syntax on, set tabstop=4 expandtab.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Essential Commands',
      language: 'bash',
      code: `# Opening files
vim filename.txt
vim +20 filename.txt          # open at line 20
vim +/pattern filename.txt    # open at first match
vim -d file1 file2            # diff mode

# In vim — Normal mode commands
# i       = insert before cursor
# a       = insert after cursor
# o       = new line below + insert
# O       = new line above + insert
# Esc     = back to Normal mode
# :w      = save
# :q      = quit (fails if unsaved changes)
# :wq     = save and quit
# :q!     = quit without saving
# :w !sudo tee %  = save with sudo (when you forgot)

# Undo/redo
# u       = undo
# Ctrl+r  = redo
# U       = undo all changes on current line`,
    },
    {
      label: 'Navigation & Selection',
      language: 'bash',
      code: `# Navigation (Normal mode)
# h j k l       = left down up right
# w / b / e     = next word / back word / end of word
# 0 / $ / ^     = line start / line end / first non-blank
# gg / G        = file start / file end
# :42           = go to line 42
# Ctrl+f / b    = page forward / back
# % = jump to matching ( { [

# Selection (Visual mode)
# v             = character visual
# V             = line visual
# Ctrl+v        = block visual
# after selection:
#   d = delete, y = yank, > = indent, < = dedent

# Text objects (operator + i/a + delimiter)
# ciw    = change inner word
# ci"    = change inside "quotes"
# ca(    = change around (parentheses)
# di{    = delete inside {braces}
# yip    = yank inner paragraph`,
    },
    {
      label: 'Search & Replace',
      language: 'bash',
      code: `# Search
# /pattern       = search forward
# ?pattern       = search backward
# n / N          = next / previous match
# *              = search for word under cursor
# :noh           = clear search highlight

# Replace
# :%s/old/new/g           = replace all in file
# :%s/old/new/gc          = confirm each replacement
# :5,15s/old/new/g        = replace in lines 5-15
# :%s/\\bword\\b/newword/g  = whole word only
# :%s/^/# /g              = prepend # to every line
# :%s/\\s\\+$//             = remove trailing whitespace

# Multiple files
# :args *.yaml             = open all yaml files
# :argdo %s/old/new/g | w  = replace in all open files

# .vimrc settings
# set number
# syntax on
# set tabstop=4
# set shiftwidth=4
# set expandtab      " spaces not tabs
# set autoindent
# set ignorecase smartcase   " case-insensitive unless uppercase`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Not knowing how to exit vim',
      wrong: 'Closing the terminal because you cannot exit vim',
      right: 'Esc then :q! to force quit without saving, or :wq to save and quit',
      explanation: 'Esc returns to Normal mode. From Normal mode, :q! quits discarding changes. :wq saves then quits. If you are in insert mode, Esc first. This is the #1 vim beginner question.',
    },
    {
      title: 'Using arrow keys for navigation in older terminals',
      wrong: 'Pressing arrow keys in insert mode which may insert escape sequences',
      right: 'Esc to Normal mode, then h/j/k/l for navigation',
      explanation: 'Arrow keys work in modern vim/terminals but insert escape sequences in some older setups. h/j/k/l navigation is always reliable and keeps fingers on the home row — faster once learned.',
    },
    {
      title: 'Forgetting the s flag in search-replace for global replacement',
      wrong: ':%s/old/new (replaces only the first occurrence per line)',
      right: ':%s/old/new/g (g = global: all occurrences per line)',
      explanation: 'Without /g, vim replaces only the first occurrence on each line. Use /g for all occurrences. Add /i for case-insensitive, /c for confirmation prompt.',
    },
    {
      title: 'Editing files owned by root without sudo',
      wrong: 'vim /etc/nginx/nginx.conf (can view but cannot save)',
      right: 'sudo vim /etc/nginx/nginx.conf  OR  vim then :w !sudo tee %',
      explanation: 'vim the-file as a regular user allows reading but :w fails on save with "E212: Can\'t open file for writing". If you forgot sudo: from inside vim: :w !sudo tee % (saves via sudo tee).',
    },
  ];

  challenge: Challenge = {
    title: 'Vim Command Interpreter',
    language: 'typescript',
    description: 'Implement a simplified vim-like command interpreter that processes a sequence of Normal mode commands against a text buffer and returns the final state. Support: i (insert mode text), Esc (exit insert), dd (delete line), p (paste), :wq (return result).',
    hints: [
      'Track current line, cursor position, and clipboard',
      'i followed by text then Esc inserts at current position',
      'dd removes the current line and copies to clipboard; p pastes below',
    ],
    starterCode: `function vimSim(initialText: string, commands: string[]): string {
  // Simulate vim: process commands against text
  // Return final buffer content after :wq
  // Supported: "i<text><Esc>", "dd", "p", ":wq"
  return initialText;
}

console.log(vimSim("hello\\nworld", ["dd", "p", ":wq"]));
// Deletes "hello", pastes below "world" -> "world\\nhello"`,
    solution: `function vimSim(initialText: string, commands: string[]): string {
  let lines = initialText.split('\\n');
  let row = 0;
  let clipboard = '';

  for (const cmd of commands) {
    if (cmd === ':wq') break;
    if (cmd === 'dd') {
      clipboard = lines[row] ?? '';
      lines.splice(row, 1);
      row = Math.min(row, lines.length - 1);
    } else if (cmd === 'p') {
      lines.splice(row + 1, 0, clipboard);
      row++;
    } else if (cmd.startsWith('i') && cmd.endsWith('<Esc>')) {
      const text = cmd.slice(1, -5);
      lines[row] = (lines[row] ?? '') + text;
    }
  }

  return lines.join('\\n');
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which command in vim saves and quits?',
      options: ['Ctrl+S', ':wq or ZZ', ':save+exit', 'Esc+q'],
      answer: 1,
      explanation: ':wq writes (saves) the file and quits. ZZ is the shortcut for the same. :w saves without quitting. :q! quits without saving. You must be in Normal mode — press Esc first if unsure.',
    },
    {
      q: 'What does the command ciw do in vim?',
      options: [
        'Comment inner word',
        'Change inner word (delete word under cursor and enter insert mode)',
        'Copy inner word to clipboard',
        'Check inner word syntax',
      ],
      answer: 1,
      explanation: 'c = change (delete + enter insert mode), i = inner, w = word. ciw deletes the word under cursor and immediately enters insert mode so you can type the replacement.',
    },
    {
      q: 'How do you replace all occurrences of "foo" with "bar" in the entire file?',
      options: [
        ':replace foo bar',
        ':%s/foo/bar/g',
        ':/foo/bar/all',
        ':global/foo/bar/',
      ],
      answer: 1,
      explanation: ':%s/foo/bar/g — % = entire file, s = substitute, /g = global (all occurrences per line). Without /g, only the first occurrence per line is replaced.',
    },
    {
      q: 'What does pressing * in Normal mode do?',
      options: [
        'Enter visual block mode',
        'Search for the word currently under the cursor',
        'Multiply the current number',
        'Select all text',
      ],
      answer: 1,
      explanation: '* searches forward for the exact word under the cursor (with word boundaries). # does the same backward. Then n/N navigates between matches. Faster than typing /word manually.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do I save a file in vim when I forgot to use sudo?',
      a: 'From inside vim, use :w !sudo tee %. This writes the buffer to stdout, which is piped to sudo tee (which writes to the file as root). The % is the current filename. You\'ll be prompted for your sudo password. Alternatively :w! /tmp/copy.txt then sudo mv /tmp/copy.txt /etc/target.',
    },
    {
      q: 'What is a .vimrc and what should I put in it?',
      a: '~/.vimrc is your vim configuration file. Minimal useful settings: set number (line numbers), syntax on (highlighting), set tabstop=4 shiftwidth=4 expandtab (4-space tabs), set autoindent, set hlsearch (highlight search), set ignorecase smartcase (case-insensitive unless uppercase). Create it: vim ~/.vimrc.',
    },
    {
      q: 'How do I edit multiple files with vim and switch between them?',
      a: 'Open multiple: vim file1.txt file2.txt. :n or :next goes to next file, :prev to previous. :args *.conf opens all conf files. :buffers lists open buffers; :b2 switches to buffer 2. :bn / :bp = next/previous buffer. For split windows: :split file2 (horizontal) or :vsplit file2 (vertical). Ctrl+w followed by hjkl moves between splits.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Esc for Normal mode; :wq to save+quit; :q! to quit without saving; dd/yy/p for cut/copy/paste; :%s/old/new/g for global replace.',
    mustKnow: [
      'Modes: Normal (Esc), Insert (i/a/o), Visual (v/V/Ctrl+v), Command (:)',
      ':wq = save and quit; :q! = quit without saving; :w = save only',
      'dd = delete line (to clipboard); yy = yank line; p = paste below',
      ':%s/old/new/g = replace all in file; /g = all occurrences per line',
      'ciw = change inner word; ci" = change inside quotes (text objects)',
      'gg = first line; G = last line; :42 = jump to line 42',
    ],
    interviewFocus: [
      'How do you exit vim?',
      'How do you replace a string across all occurrences in a file?',
      'How do you save a file with root permissions when you forgot sudo?',
      'What are text objects in vim and why are they useful?',
    ],
  };
}
