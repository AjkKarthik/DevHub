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
  templateUrl: './awk-default-field-split-collapses-repeated-delimiters.html',
  styleUrl: './awk-default-field-split-collapses-repeated-delimiters.scss'
})
export class AwkDefaultFieldSplitCollapsesRepeatedDelimitersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats awk\'s field splitting as one uniform mechanism',
      points: [
        'The main page\'s own theory states: "awk processes fields... FS sets field separator (-F\',\')" — presenting the default whitespace behavior and a custom -F separator as the same mechanism with just a different character plugged in.',
        'Its own code example reinforces this: awk -F: \'{print $1, $3}\' /etc/passwd sets a custom single-character separator, right next to awk \'{print $1}\' access.log using the plain default — with nothing suggesting these two forms behave fundamentally differently when the input has REPEATED delimiters back to back.',
      ]
    },
    {
      heading: 'Confirmed via awk\'s own documentation: the default separator is special-cased, a single-character -F is not',
      points: [
        'Per the GNU Awk User\'s Guide, the default field separator behavior is explicit and deliberately special: "when the value of FS is \' \', awk first strips leading and trailing whitespace from the record" and treats any RUN of spaces/tabs as ONE separator — "multiple spaces and tabs count as a single separator." Critically, this same source states plainly: "two spaces in a row do not delimit an empty field."',
        'The instant a single literal character is supplied via -F (e.g. -F\' \' or -F\',\'), that special collapsing behavior is gone — the character is now treated LITERALLY as a delimiter, and consecutive occurrences DO produce empty fields between them, exactly the behavior the default whitespace mode is specifically designed to avoid.',
        'This means -F\' \' (a single space passed explicitly to -F) is NOT equivalent to awk\'s own default whitespace-splitting behavior, even though they look like they should do the same thing — the default (no -F at all, or the two-character string " ") gets the collapsing special case; an explicitly-specified single-space separator does not.',
      ]
    },
    {
      heading: 'Where this actually bites in practice',
      points: [
        'Log files and command output are frequently padded with variable amounts of whitespace for human readability — ls -l output, ps output, and many other tools align columns with runs of multiple spaces that vary in width depending on the content. Parsing this kind of output with the DEFAULT awk field splitting works correctly specifically because of the collapsing behavior — $2, $3, etc. land on the intended columns regardless of how many spaces separate them.',
        'The moment someone "fixes" what looks like an awkward default by switching to an explicit -F\' \' — perhaps trying to be more precise, or copying a pattern that uses -F\':\' for /etc/passwd and assuming the same -F approach generalizes cleanly to space-padded output — every extra alignment space becomes its own empty field, and $2 no longer points at the second real value; it points at whatever empty or partial fragment fell into that position instead.',
        'The correct way to explicitly request the SAME collapsing whitespace behavior as the default (if a script needs to set FS to something else temporarily and later restore whitespace-splitting) is FS=" " — the literal two-character string with a single space between the quotes — which awk continues to treat as the special multi-whitespace case, not as a literal single-character separator, per the same documented special-casing.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Default splitting handles variable-width padding correctly',
      language: 'bash',
      code: `# Realistic column-aligned input with VARIABLE amounts of padding
# between fields (like ls -l or ps output):
cat sample.txt
# alice     42     active
# bob       7      inactive
# charlotte 103    active

# Main page's own default-splitting form:
awk '{print $2}' sample.txt
# 42
# 7
# 103
# -- correct, because awk's own documented default FS behavior
#    treats ANY run of spaces/tabs as ONE separator: "multiple
#    spaces and tabs count as a single separator," and per the
#    same source, "two spaces in a row do not delimit an empty
#    field."`,
    },
    {
      label: 'An explicit -F\' \' breaks on the SAME input',
      language: 'bash',
      code: `# The SAME input, but now with an EXPLICIT single-space -F --
# looks like it should mean the same thing as the default, but
# per awk's own documentation it is NOT the same special case:

awk -F' ' '{print $2}' sample.txt
# (empty)
# (empty)
# (empty)
# -- every run of alignment spaces after the first name now
#    produces its own EMPTY field. $2 for "alice     42     active"
#    is now an empty string (the space immediately after "alice"),
#    not "42" -- the real value has shifted several field positions
#    to the right depending on how much padding preceded it.

# To restore the SAME collapsing behavior as awk's own default,
# explicitly set FS to the special two-character string " " --
# NOT a bare single-character separator:
awk 'BEGIN{FS=" "} {print $2}' sample.txt
# 42
# 7
# 103
# -- correct again, because FS=" " (a literal space assigned this
#    specific way) is documented as retaining the special
#    multi-whitespace-collapsing behavior, unlike -F applied to
#    any OTHER single character (including a space passed via -F
#    rather than via a BEGIN-block FS assignment in some awk
#    implementations -- always verify behavior against the actual
#    awk in use when precision matters).`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A script parses ps aux output (whose columns are separated by a variable number of spaces depending on how long each value is) using awk \'{print $2}\' to extract the PID column, and it has always worked correctly. A teammate "cleans up" the script by making the field separator explicit — changing it to awk -F\' \' \'{print $2}\' — reasoning that being explicit about a single-space separator is clearer and more correct than relying on an implicit default. After the change, the script starts extracting garbage instead of PIDs. What went wrong?',
    hint: 'Check whether awk\'s own documented default field-splitting behavior for a plain space is a special case, or whether an explicitly-specified -F\' \' single-character separator gets that same special treatment.',
    solution: 'The teammate\'s change replaced a special-cased behavior with a literal one that only looks equivalent. Per awk\'s own documentation, the DEFAULT field separator (no -F at all) is deliberately special: "multiple spaces and tabs count as a single separator," and "two spaces in a row do not delimit an empty field" — this is exactly what made the original script work correctly against ps aux output, whose columns are padded with a variable number of spaces. An explicitly-specified single-character separator via -F\' \' does NOT get that same collapsing treatment — each individual space becomes its own delimiter, so a run of five alignment spaces produces four empty fields in between. $2, which used to reliably land on the PID column regardless of padding width, now lands on whatever empty or partial fragment happens to fall into that position, varying unpredictably depending on how much padding preceded it for each line. The fix is either reverting to no -F flag at all (the actual default), or if FS genuinely needs to be set explicitly for some other reason, using FS=" " (the documented special two-character string) rather than a bare -F\' \' single-character separator, to retain the same collapsing behavior.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Passing -F\' \' (a single space) to awk is just a more explicit way of writing awk\'s own default field-splitting behavior — they should produce identical results.',
      reality: 'Per this subtopic\'s theory, awk\'s own documentation confirms these are genuinely different behaviors — the default FS value is special-cased to collapse runs of whitespace and never produce empty fields between them, while an explicitly-specified single-character separator (including a space passed via -F) is treated literally, with consecutive occurrences producing empty fields.'
    },
    {
      thought: 'awk\'s field-splitting behavior for whitespace is consistent regardless of how the separator is specified — via -F, via a BEGIN-block FS= assignment, or by leaving it at the default.',
      reality: 'Per this subtopic\'s theory, only the actual DEFAULT (unset FS, equivalent to the special string " ") reliably gets the whitespace-collapsing special case — any explicit override needs to specifically use that same " " string (not a bare space via -F) to preserve the same behavior.'
    },
    {
      thought: 'Column-aligned command output like ps or ls -l is unreliable to parse with awk because the padding varies, so a custom field separator is always needed to handle it correctly.',
      reality: 'Per this subtopic\'s theory, awk\'s own DEFAULT field splitting is specifically designed to handle exactly this case correctly — variable-width whitespace padding between columns collapses into a single separator automatically, with no custom -F needed at all for whitespace-delimited output.'
    }
  ];
}
