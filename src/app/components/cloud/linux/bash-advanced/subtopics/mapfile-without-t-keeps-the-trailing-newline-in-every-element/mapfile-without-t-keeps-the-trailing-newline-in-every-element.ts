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
  templateUrl: './mapfile-without-t-keeps-the-trailing-newline-in-every-element.html',
  styleUrl: './mapfile-without-t-keeps-the-trailing-newline-in-every-element.scss'
})
export class MapfileWithoutTKeepsTheTrailingNewlineInEveryElementSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page always writes mapfile -t, but never explains what -t actually does or what happens without it',
      points: [
        'The main page\'s own Arrays code tab uses <code>mapfile -t HOSTS < /etc/hosts</code> — the <code>-t</code> flag is present in every example, but nothing on the page ever explains what it does, or what the array would look like if it were omitted. A reader copying the pattern without understanding -t has no idea it is doing anything at all.',
      ]
    },
    {
      heading: 'Without -t, every array element keeps its trailing newline character',
      points: [
        '<code>mapfile</code> (and its alias <code>readarray</code>) reads input one line at a time and stores each line as an array element. By DEFAULT — without <code>-t</code> — the newline character that terminated each line in the source file is kept as part of that element\'s string value, not stripped.',
        'This means an array element that LOOKS like it should just be <code>"web1"</code> is actually the four-character string <code>"web1"</code> followed by a literal newline character — invisible when the element is inspected casually, but present in the actual string data.',
        '<code>-t</code> strips exactly that trailing newline from every element as it is read, giving the clean, newline-free strings almost every practical use case actually wants — which is exactly why the main page\'s own examples always include it, without ever saying so.',
      ]
    },
    {
      heading: 'The concrete symptom: doubled blank lines and broken string comparisons',
      points: [
        'The most common visible symptom: printing an element that still has its embedded newline produces an EXTRA blank line, since <code>echo</code> itself already adds a trailing newline — <code>echo "${HOSTS[0]}"</code> on an un-stripped element outputs the host name, then a blank line, then echo\'s own newline, visually doubling the line spacing in output that should be single-spaced.',
        'A subtler, easy-to-miss symptom: string comparisons silently fail. <code>[[ "${HOSTS[0]}" == "web1" ]]</code> evaluates to FALSE even when the line clearly reads "web1" in the source file, because the actual stored value is <code>"web1\\n"</code>, which is never equal to the plain string <code>"web1"</code> — a very confusing bug to track down without knowing to suspect a stray trailing newline.',
        'The fix is always the same, and is exactly what the main page\'s own examples already do correctly (just without explaining why): use <code>mapfile -t</code>, never bare <code>mapfile</code>, whenever the goal is a clean array of line CONTENTS rather than an array of raw, newline-terminated chunks.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the doubled-blank-line and comparison bugs',
      language: 'bash',
      code: `#!/usr/bin/env bash

cat > /tmp/hosts.txt << 'EOF'
web1
web2
db1
EOF

# WITHOUT -t -- each element keeps its trailing newline
mapfile HOSTS < /tmp/hosts.txt

echo "Element 0 is: [\${HOSTS[0]}]"
# Element 0 is: [web1
# ]                        <-- the closing bracket lands on its OWN
#                               line -- proof the newline is embedded
#                               inside the string value itself

if [[ "\${HOSTS[0]}" == "web1" ]]; then
    echo "Match"
else
    echo "No match"        # <-- THIS prints, even though the file
fi                          #     clearly contains the line "web1"

echo "\${HOSTS[0]}"
echo "next line"
# web1
#                           <-- extra blank line from the embedded \\n
# next line`,
    },
    {
      label: 'The fix: always use -t',
      language: 'bash',
      code: `#!/usr/bin/env bash

# WITH -t -- exactly the main page's own established pattern
mapfile -t HOSTS < /tmp/hosts.txt

echo "Element 0 is: [\${HOSTS[0]}]"
# Element 0 is: [web1]     <-- clean, no embedded newline

if [[ "\${HOSTS[0]}" == "web1" ]]; then
    echo "Match"           # <-- correctly matches now
else
    echo "No match"
fi

echo "\${HOSTS[0]}"
echo "next line"
# web1
# next line                <-- no extra blank line

# Same rule applies to readarray (a synonym for mapfile):
readarray -t HOSTS < /tmp/hosts.txt`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A script reads a list of allowed usernames with `mapfile ALLOWED < /etc/app/allowed-users.txt` (note: no -t flag), then checks `if [[ " ${ALLOWED[@]} " == *" $USER "* ]]; then` to decide whether to grant access. Testing shows a user named exactly "alice" (with no trailing characters) present on its own line in the file is still denied access. Why, and what is the one-character fix?',
    hint: 'Think about what mapfile actually stores in each array element without the -t flag — is it exactly the text of the line, or does it include something extra picked up from the source file?',
    solution: 'Without `-t`, `mapfile` stores each line INCLUDING its trailing newline character as part of the array element\'s string value — so the element for "alice" is actually the string `"alice\\n"`, not the plain string `"alice"`. When that gets embedded into the space-joined `"${ALLOWED[@]}"` string and pattern-matched against `*" $USER "*`, the embedded newline breaks the expected exact substring match, since `"alice\\n "` is not the same sequence of characters as `"alice "`. The fix is adding the `-t` flag: `mapfile -t ALLOWED < /etc/app/allowed-users.txt` — this strips the trailing newline from every element as it is read, giving clean strings that compare and pattern-match exactly as expected.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'mapfile and mapfile -t behave identically — the -t flag is just an optional style preference.',
      reality: 'Per this subtopic\'s theory, mapfile without -t keeps each line\'s trailing newline character embedded in the array element\'s string value — a functional difference, not a stylistic one, that breaks string comparisons and doubles blank lines when printed.'
    },
    {
      thought: 'If a string comparison against an array element built by mapfile fails even though the values "look the same," the comparison logic itself must be wrong.',
      reality: 'Per this subtopic\'s theory, this is a classic symptom of mapfile being used WITHOUT -t — the array element silently contains an invisible trailing newline character that makes it unequal to the plain string it visually appears to match.'
    },
    {
      thought: 'The main page\'s consistent use of mapfile -t in every example is just a stylistic habit, not something with a specific functional reason behind it.',
      reality: 'Per this subtopic\'s theory, -t is functionally necessary for the clean, newline-free array elements almost every practical script actually wants — the main page\'s consistent use of it is deliberate, even though the page itself never explains why.'
    }
  ];
}
