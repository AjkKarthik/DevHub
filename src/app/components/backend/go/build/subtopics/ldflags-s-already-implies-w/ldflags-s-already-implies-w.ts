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
  templateUrl: './ldflags-s-already-implies-w.html',
  styleUrl: './ldflags-s-already-implies-w.scss'
})
export class LdflagsSAlreadyImpliesWSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page writes "-s -w" everywhere as a fixed pair — the linker documents a relationship between them it never mentions',
      points: [
        'Every single code tab on the main page that strips a binary uses the exact same two-flag combination: -ldflags="-s -w". Its theory says only "\'-ldflags \\"-s -w\\"\' strips the symbol table and DWARF debug info," treating -s and -w as two independent, unrelated flags that happen to always be used together.',
        'The official linker documentation for -s states directly: "Omit the symbol table and debug information. Implies the -w flag, which can be negated with -w=0." The -w flag on its own is documented separately: "Omit the DWARF symbol table."',
        'This means -s already turns on everything -w does — the two flags are not independent options that happen to be commonly combined; -s is the broader flag, and -w is effectively a strict subset of what -s already accomplishes. Writing -ldflags="-s -w" is not wrong, but the -w is redundant given -s is present — per the documentation\'s own wording, -s "implies" it.',
      ]
    },
    {
      heading: 'Why this matters beyond a purely cosmetic detail',
      points: [
        'The documentation also reveals the one case this distinction becomes meaningfully useful: "-s... Implies the -w flag, which can be negated with -w=0." This means -ldflags="-s -w=0" is a valid, meaningful combination — strip the symbol table (-s) while explicitly KEEPING DWARF debug info, something -ldflags="-s -w" (as the main page always writes it) cannot express at all, since the plain -w in that combination is already redundant with -s and there is no way to "un-strip" anything with the main page\'s own pattern.',
        'A team that reads the main page\'s own code and assumes -s and -w are two separately toggleable, independent knobs (rather than one implying the other) would not think to reach for -w=0 as the way to get "stripped binary size, but keep DWARF for a debugger" — a real, useful middle ground between "-s -w" (smallest, no debug info at all) and no stripping flags at all (largest, full debug info).',
        'This is purely a linker-documentation fact, not a change in recommended practice — -ldflags="-s -w" remains a perfectly correct, working way to produce a fully stripped binary; the gap is only that the main page never explains WHY both flags are conventionally written together, or that there is a documented, useful alternative (-s -w=0) for a case the plain pairing cannot express.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own pattern -- both flags, every time',
      language: 'typescript',
      code: `# Exactly the main page's own Build Commands code tab:
go build -ldflags="-s -w" -o ./bin/myapp ./cmd/myapp

# Per the linker's own documentation:
# -s: "Omit the symbol table and debug information.
#      Implies the -w flag, which can be negated with -w=0."
# -w: "Omit the DWARF symbol table."
#
# Since -s ALREADY implies -w, this command is functionally
# IDENTICAL to just:
go build -ldflags="-s" -o ./bin/myapp ./cmd/myapp

# Both produce a binary with the symbol table AND DWARF info
# both stripped -- "-w" adds nothing that "-s" doesn't already do
# on its own, per the documentation's own "implies" wording.`,
    },
    {
      label: 'The one thing the plain pairing cannot express',
      language: 'typescript',
      code: `# "-s -w" (the main page's own pattern): smallest binary,
# zero symbol table, zero DWARF debug info -- no debugger support.
go build -ldflags="-s -w" -o ./bin/myapp-min ./cmd/myapp

# "-s -w=0": per the linker's own documentation -- "-w, which
# can be negated with -w=0" -- this strips the symbol table (-s)
# while explicitly KEEPING DWARF debug info (-w=0 cancels the
# implied -w). Delve (dlv) can still attach to this binary and
# resolve source lines, unlike the fully-stripped version above.
go build -ldflags="-s -w=0" -o ./bin/myapp-debuggable ./cmd/myapp

# ls -lh comparison (illustrative -- exact sizes vary by binary):
# myapp-full           12.4 MB   (no stripping flags at all)
# myapp-debuggable      9.8 MB   (-s -w=0: symtab gone, DWARF kept)
# myapp-min             8.1 MB   (-s -w: both gone)
#
# This middle ground -- smaller than unstripped, but still
# debuggable with dlv -- is invisible if -s and -w are assumed to
# be two independent flags that must both be present or absent
# together, rather than -s implying -w with an explicit override.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team follows the main page\'s own convention exactly, always building production binaries with -ldflags="-s -w". After an incident, they need to attach Delve to a core dump from one of these production binaries to diagnose a crash, and discover Delve cannot resolve any source lines or variable names — the debug info is completely gone. A teammate proposes rebuilding with -ldflags="-s -w=0" instead for future releases, to keep the binary small while preserving debuggability. Using this subtopic\'s theory, explain precisely what changes (and does not change) between these two flag combinations, and confirm whether the teammate\'s proposed fix is well-founded.',
    hint: 'Per this subtopic\'s theory, what does "-s" alone already strip, and what does the documented relationship between "-s" and "-w" say about what "-w=0" specifically restores? Does changing "-w" to "-w=0" affect what "-s" strips at all?',
    solution: 'The teammate\'s proposed fix is well-founded, and this subtopic\'s theory explains precisely why. -s "implies the -w flag" per the linker\'s own documentation, meaning the main page\'s own -ldflags="-s -w" pairing strips BOTH the symbol table (via -s) AND the DWARF debug info (via the -w that -s already implies) — this is exactly why Delve found nothing to work with in the original build. Changing to -ldflags="-s -w=0" does not affect what -s strips at all (the symbol table is still gone either way) — per the documentation\'s own wording, "-w=0" specifically NEGATES the implied -w, meaning DWARF debug info is explicitly KEPT rather than stripped. This subtopic\'s second code example shows this produces a binary smaller than an entirely unstripped build (symbol table still gone) but with DWARF info intact, meaning Delve CAN resolve source lines and variable names against it — exactly the middle ground the team needs for production binaries that must stay debuggable via post-mortem analysis of core dumps.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '-s and -w are two independent linker flags that happen to conventionally be written together — omitting one while keeping the other produces a binary somewhere "between" fully stripped and fully unstripped.',
      reality: 'This subtopic\'s theory quotes the documentation directly: -s "implies the -w flag" — they are not independent. Writing just -ldflags="-s" alone already strips both the symbol table AND DWARF info, exactly as if -w had also been written explicitly.'
    },
    {
      thought: 'There is no way to strip a Go binary\'s symbol table while keeping its DWARF debug information intact for a debugger like Delve — stripping is all-or-nothing.',
      reality: 'This subtopic\'s theory and second code example show the documented -w=0 negation exists specifically for this case: -ldflags="-s -w=0" strips the symbol table via -s while explicitly canceling the implied -w, keeping DWARF debug info intact and the binary still debuggable with dlv.'
    },
    {
      thought: 'Since -s already implies -w, explicitly writing "-s -w" (as the main page always does) is a meaningful mistake that should be corrected to just "-s".',
      reality: 'This subtopic\'s theory frames this as a documentation gap, not a code mistake — -ldflags="-s -w" and -ldflags="-s" are functionally identical outputs, so the main page\'s own convention is not wrong. The gap is only that neither the main page nor most Go code written this way explains WHY both are conventionally present, or that -w=0 offers a documented alternative outcome the plain pairing cannot express.'
    }
  ];
}
