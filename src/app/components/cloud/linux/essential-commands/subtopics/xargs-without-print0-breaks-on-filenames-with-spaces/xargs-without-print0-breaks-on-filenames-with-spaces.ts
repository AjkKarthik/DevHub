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
  templateUrl: './xargs-without-print0-breaks-on-filenames-with-spaces.html',
  styleUrl: './xargs-without-print0-breaks-on-filenames-with-spaces.scss'
})
export class XargsWithoutPrint0BreaksOnFilenamesWithSpacesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA mentions the fix in one clause, without explaining the actual failure it prevents',
      points: [
        'The main page\'s own QnA on find -exec vs xargs states: "Pipe to xargs -0 when combined with find -print0 to handle filenames with special characters safely." That\'s the correct advice, delivered as a single dependent clause — but it never shows WHAT goes wrong without it, which is exactly the part that makes the advice feel optional rather than necessary.',
        'Every xargs example on the main page itself (find . -name *.tmp | xargs rm, referenced in the theory) omits -print0/-0 entirely, quietly modeling the unsafe pattern as if it were simply "the normal way to use xargs."',
      ]
    },
    {
      heading: 'Confirmed via xargs\' own man page: plain xargs splits on spaces AND newlines, not just newlines',
      points: [
        'Per xargs\' own documentation, its default input-splitting behavior is "blanks (which can be protected with double or single quotes or a backslash) or newlines" — spaces are a delimiter by default, exactly like a shell word-split, not just line breaks.',
        'The consequence is stated plainly in the same source: "because Unix filenames can contain blanks and newlines, this default behaviour is often problematic; filenames containing blanks and/or newlines are incorrectly processed by xargs." A single filename containing a space — "my report.pdf" — gets split into TWO separate arguments ("my" and "report.pdf") by plain xargs, neither of which is the file that actually exists.',
        'This is not a rare edge case in real filesystems — spaces in filenames are completely valid and common (user-downloaded files, anything named by a human rather than a script), meaning the main page\'s own bare find | xargs rm pattern is a live footgun on any directory where that\'s true, not just a theoretical concern.',
      ]
    },
    {
      heading: 'The fix, and why -exec never had this problem in the first place',
      points: [
        'The documented fix is a matched PAIR of flags, not just one: find\'s own -print0 option "produces input suitable for" xargs -0, which per xargs\' own man page means "input items are terminated by a null character instead of by whitespace, and the quotes and backslash are not special (every character is taken literally)." A null byte can never legally appear inside a Unix filename, making it a safe, unambiguous delimiter — unlike a space or newline, which can.',
        'The corrected pipeline is find . -name "*.tmp" -print0 | xargs -0 rm — both halves must change together; passing -print0 to find without -0 on the receiving xargs (or vice versa) produces garbled results just as broken as omitting both.',
        'find\'s own -exec {} + (already covered on the main page) never had this problem at all — it passes each matched path directly as a single argument internally, with no intermediate text stream to be split on whitespace in the first place. This is the real, more complete reason -exec {} + is often the simpler and safer default choice, beyond the main page\'s own framing of it purely as a performance optimization ("batches results into one invocation (much faster)").',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the failure the main page\'s own pattern is exposed to',
      language: 'bash',
      code: `# Main page's own referenced pattern (from its theory section):
#   find . -name "*.log" | xargs rm
# -- looks correct, and works fine... until a filename has a space.

# Set up a file with a space in its name (completely valid on Linux):
touch "old report.log"
ls
# old report.log

# The main page's own pattern in action:
find . -name "*.log" | xargs rm
# rm: cannot remove 'old': No such file or directory
# rm: cannot remove 'report.log': No such file or directory
#
# Per xargs' own man page: default splitting is on "blanks... or
# newlines" -- the single filename "old report.log" was split into
# TWO separate arguments, "old" and "report.log", neither of which
# is a real file. rm fails on both, and the actual file is
# untouched (in this case, harmlessly -- but the same splitting can
# also cause xargs to act on the WRONG existing file if one happens
# to share a fragment of the split name).`,
    },
    {
      label: 'The fix: a matched find -print0 / xargs -0 pair',
      language: 'bash',
      code: `# The correct, safe version -- BOTH halves change together:
find . -name "*.log" -print0 | xargs -0 rm

# Per find's own -print0 and xargs' own -0 documentation:
#   -print0  -> terminates each output filename with a NULL byte
#               instead of a newline
#   xargs -0 -> "input items are terminated by a null character
#               instead of by whitespace, and the quotes and
#               backslash are not special (every character is
#               taken literally)"
#
# A null byte can never legally appear inside a Unix filename --
# it's the ONE byte guaranteed not to be part of any real filename,
# making it a safe, unambiguous separator regardless of what
# characters (spaces, newlines, quotes) the filename itself contains.

touch "old report.log"
find . -name "*.log" -print0 | xargs -0 rm
ls
# (file correctly removed, no errors)

# find's own -exec {} + never needed any of this in the first
# place -- it passes each match as a real argument internally,
# with no intermediate whitespace-delimited text stream at all:
find . -name "*.log" -exec rm {} +`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A script runs find /uploads -name "*.tmp" | xargs rm -f nightly to clean up temporary files from a user-uploads directory. It has worked reliably in testing with synthetic filenames like report.tmp and data.tmp. In production, a user uploads a file that ends up named "vacation photo 2024.tmp" (spaces included, which the upload form allows). The cleanup script starts throwing errors and, worse, an unrelated file named "vacation" (with no extension) that happened to exist in a different directory gets unexpectedly deleted. Why did this happen, and how would the script need to change to be genuinely safe?',
    hint: 'Check exactly what characters xargs treats as delimiters by default, and what happens when a single filename gets split into multiple arguments that xargs then treats as multiple, unrelated targets.',
    solution: 'Plain xargs splits its input on blanks (spaces) as well as newlines by default — per its own man page, this makes "filenames containing blanks... incorrectly processed by xargs." The single filename "vacation photo 2024.tmp" was split into three separate arguments — "vacation", "photo", and "2024.tmp" — and each was passed to rm -f as if it were its own real filename. "photo" and "2024.tmp" didn\'t exist in the current context and errored out (relatively harmless), but "vacation" apparently DID exist as a real file somewhere xargs\' rm -f could reach it, and rm -f silently deleted it — rm -f suppresses the "no such file" errors that would otherwise appear for a nonexistent path, which is exactly why the corruption of the split filename into multiple bogus arguments went unnoticed until real damage was done. The fix is the matched pair the main page\'s own QnA mentions but never demonstrates: find /uploads -name "*.tmp" -print0 | xargs -0 rm -f — using a null-byte delimiter that can never appear inside a legal filename, so a name containing spaces (or even literal newlines) is never split into multiple pieces in the first place.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'find ... | xargs cmd is a generally safe, standard pattern — the -print0/-0 flags are an optional extra precaution needed only for unusual filenames.',
      reality: 'Per this subtopic\'s theory, xargs\' own documentation confirms plain (non-null-delimited) splitting is "often problematic" specifically because ordinary filenames containing spaces — a completely common, valid case — get silently split into multiple wrong arguments, not just some rare edge case.'
    },
    {
      thought: 'Passing -print0 to find alone is enough to make a find | xargs pipeline safe for filenames with spaces.',
      reality: 'Per this subtopic\'s theory, -print0 and xargs -0 are a MATCHED PAIR — find -print0 changes the output delimiter to a null byte, but the receiving xargs must also be told with -0 to expect that delimiter; using only one half still produces broken results.'
    },
    {
      thought: 'find -exec {} + is just a performance optimization over piping to xargs — batching invocations for speed, with no other functional difference.',
      reality: 'Per this subtopic\'s theory, find -exec {} + also sidesteps the whitespace-splitting problem entirely, since it passes each matched path as a genuine argument internally with no intermediate text stream to be word-split — a safety benefit distinct from, and in addition to, its documented speed advantage.'
    }
  ];
}
