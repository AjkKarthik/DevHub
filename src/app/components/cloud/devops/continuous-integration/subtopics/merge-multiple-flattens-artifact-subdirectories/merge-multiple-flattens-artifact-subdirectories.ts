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
  templateUrl: './merge-multiple-flattens-artifact-subdirectories.html',
  styleUrl: './merge-multiple-flattens-artifact-subdirectories.scss'
})
export class MergeMultipleFlattensArtifactSubdirectoriesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own merge-coverage job downloads four shards\' artifacts into one directory, using two options it never explains',
      points: [
        'The main page\'s own "Test Parallelisation" code tab has a `merge-coverage` job that runs `actions/download-artifact@v4` with `pattern: \'coverage-shard-*\', merge-multiple: true`, then immediately runs `npx nyc merge .` against the result — treating every downloaded file as if it landed in one flat folder. Neither option is explained, and the next line only works because both are set exactly right.',
        'GitHub\'s own `download-artifact` documentation defines `pattern` plainly: "A glob pattern to the artifacts that should be downloaded." That much is guessable from the name. `merge-multiple` is the less obvious one: "When multiple artifacts are matched, this changes the behavior of the destination directories. If true, the downloaded artifacts will be in the same directory specified by path. If false, the downloaded artifacts will be extracted into individual named directories within the specified path."',
      ]
    },
    {
      heading: 'Why the merge-coverage job would silently fail to find anything without merge-multiple: true',
      points: [
        'The default behavior (`merge-multiple: false`, or simply omitting it) extracts each matched artifact into its OWN named subdirectory — downloading `coverage-shard-1`, `coverage-shard-2`, `coverage-shard-3`, and `coverage-shard-4` would produce `coverage-shard-1/coverage/`, `coverage-shard-2/coverage/`, and so on, each nested under its own artifact name.',
        'The main page\'s own next line, `npx nyc merge . merged-coverage.json`, looks for coverage files directly in the current directory (`.`) — it has no idea those four separate subdirectory names even exist. Without `merge-multiple: true` flattening everything into one shared directory first, exactly as the main page\'s own step sets it, `nyc merge` would find nothing to merge at all, and the job would either silently produce an empty/broken merged report or fail outright depending on how `nyc` handles an empty input set.',
        'This is a case where TWO separate, individually-terse options (`pattern` to select the right artifacts, `merge-multiple` to control where they land) have to be correct TOGETHER for the very next shell command to work — the main page\'s own code is correct, but reads as an unexplained "just copy this" recipe rather than something whose pieces a reader could adapt confidently to a different merge step.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Default (merge-multiple omitted) -- four separate subdirectories',
      language: 'bash',
      code: `# download-artifact:
# - uses: actions/download-artifact@v4
#   with: { pattern: 'coverage-shard-*' }
#   # merge-multiple NOT set -- defaults to false

# Per GitHub's own docs: "If false, the downloaded artifacts will
# be extracted into individual named directories within the
# specified path." Downloading four shards produces:
#
# ./coverage-shard-1/coverage/lcov.info
# ./coverage-shard-2/coverage/lcov.info
# ./coverage-shard-3/coverage/lcov.info
# ./coverage-shard-4/coverage/lcov.info

# The main page's own very next line:
# npx nyc merge . merged-coverage.json
#
# nyc looks for coverage data files directly under '.' -- it does
# NOT know to recurse into four differently-named subdirectories
# looking for them. This combination finds nothing to merge.`,
    },
    {
      label: 'merge-multiple: true -- exactly what the main page\'s own job sets',
      language: 'bash',
      code: `# download-artifact:
# - uses: actions/download-artifact@v4
#   with:
#     pattern: 'coverage-shard-*'
#     merge-multiple: true

# Per GitHub's own docs: "If true, the downloaded artifacts will be
# in the same directory specified by path." Downloading the same
# four shards now produces:
#
# ./lcov.info          (from shard 1 -- or whatever nyc's own
#                        temp-file naming convention actually is;
#                        the key point is all four land in '.',
#                        not in four separate named folders)

# The main page's own next line now finds real work to do:
# npx nyc merge . merged-coverage.json
#
# nyc merge scans '.' directly -- since merge-multiple flattened
# every shard's output into that same directory, all four shards'
# coverage data is genuinely visible to it in one pass.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer copies the main page\'s own Test Parallelisation pattern into a different pipeline, but simplifies the download-artifact step by removing `merge-multiple: true`, reasoning "that option looks optional, the pattern is the important part." The merge-coverage job\'s `nyc merge` step now silently reports an empty merged file with 0% coverage instead of erroring. Using this subtopic\'s theory, explain why removing that one option broke the step without producing an obvious error.',
    hint: 'Per this subtopic\'s theory, without merge-multiple: true, where do the four shards\' coverage files actually end up on disk — and does `nyc merge .` know to look there?',
    solution: 'Removing `merge-multiple: true` reverted the download step to its default behavior, which per GitHub\'s own docs extracts "the downloaded artifacts... into individual named directories within the specified path" — so the four coverage shards ended up nested inside four separate, differently-named subdirectories (one per artifact name) instead of landing together in the current directory. The very next step, `npx nyc merge .`, only scans the current directory (`.`) directly — it has no built-in awareness of the artifact-name subdirectories `download-artifact` created, so it finds zero coverage files to merge. Because `nyc merge` doesn\'t treat "found nothing to merge" as a hard error, the job produces an empty, technically-successful merged report showing 0% coverage rather than failing loudly — exactly the kind of silent, hard-to-diagnose break this subtopic\'s theory warns about when `pattern` and `merge-multiple` aren\'t both set correctly together. The fix is restoring `merge-multiple: true`, exactly as the main page\'s own original job has it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'download-artifact\'s pattern option is the important, load-bearing part of downloading multiple artifacts — merge-multiple is a minor, optional detail that mostly affects folder tidiness.',
      reality: 'Per this subtopic\'s theory, `merge-multiple` is just as load-bearing as `pattern` for the main page\'s own merge-coverage job specifically — without it, the downloaded files land in subdirectories the very next `nyc merge .` command has no way to find, breaking the step even though `pattern` alone correctly selected the right artifacts.'
    },
    {
      thought: 'If a step that depends on merge-multiple: true is misconfigured (option removed or left at default), the pipeline will fail loudly and obviously, making the mistake easy to catch.',
      reality: 'This subtopic\'s exercise shows the opposite — `nyc merge` finding zero files to merge doesn\'t error, it just produces an empty, technically-successful report. A misconfigured merge-multiple option can silently produce a meaningless 0%-coverage result rather than an obvious pipeline failure.'
    },
    {
      thought: 'merge-multiple: true is a universally correct default that should always be set whenever downloading more than one artifact.',
      reality: 'This subtopic\'s theory ties the choice specifically to what the DOWNSTREAM step expects — the main page\'s own `nyc merge .` needs a single flat directory, so merge-multiple: true is correct here, but a different downstream step that specifically wants each artifact kept in its own named subdirectory (to know which shard a given file came from, for example) would need the opposite, default (false) setting instead.'
    }
  ];
}
