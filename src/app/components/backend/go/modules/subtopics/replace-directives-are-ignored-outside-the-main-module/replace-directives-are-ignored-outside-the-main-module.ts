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
  templateUrl: './replace-directives-are-ignored-outside-the-main-module.html',
  styleUrl: './replace-directives-are-ignored-outside-the-main-module.scss'
})
export class ReplaceDirectivesAreIgnoredOutsideTheMainModuleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page explains WHY not to ship a replace directive in a library, but not WHAT actually happens if you do',
      points: [
        'The main page\'s own mistake entry warns: "replace directives in a library\'s go.mod affect everyone who imports that library — they inherit your local path replacement, which does not exist on their machine." This describes a plausible-sounding danger, but its "wrong" code comment goes further, claiming "Users of mylib get your local fork forced on them!" — stated as if the replace directive actively propagates outward to consumers.',
        'The official Go modules reference states the opposite mechanism precisely: "replace directives only apply in the main module\'s go.mod file and are ignored in other modules." A "main module" here means whichever module is at the root of the current build — i.e. YOUR application\'s own go.mod when you run go build, not any dependency\'s go.mod, no matter how deep in the graph it sits.',
        'Applied directly to the main page\'s own scenario: if github.com/alice/mylib\'s own go.mod contains replace github.com/upstream/pkg => ./local-fork, and some other application imports mylib as a dependency, that replace line is read and then completely ignored the moment mylib stops being the main module — it never reaches, let alone gets "forced on," that application\'s build.',
      ]
    },
    {
      heading: 'The real danger is narrower — and different — than "forced on everyone"',
      points: [
        'Since a replace-to-local-path directive is ignored once mylib becomes a dependency rather than the main module, the actual failure mode for consumers is not inheriting a fork they don\'t have — it is a build error. mylib\'s go.mod still lists github.com/upstream/pkg as a require, and since the replace pointing it at ./local-fork is ignored, Go falls back to trying to fetch the ORIGINAL github.com/upstream/pkg from its real source — which may not exist, may be a different (possibly incompatible) version, or may simply not contain whatever local-only changes ./local-fork had.',
        'This means the main page\'s own "wrong" comment is directionally right (shipping a replace in a library is a real, well-documented mistake) but overstates the mechanism — it is not that other people\'s builds silently use your fork; it is that other people\'s builds either fail outright or silently fall back to the wrong upstream version, since the fork your code was actually built and tested against is invisible to them by design.',
        'This same "main module only" rule is exactly why the main page\'s own QnA correctly recommends go.work workspaces over replace directives for local multi-module development in the FIRST place — a go.work file\'s use directives apply regardless of which module in the workspace is "main," giving predictable local resolution without relying on a mechanism that is deliberately scoped to disappear the moment a module is consumed as a dependency.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own "wrong" example -- what its replace directive actually does',
      language: 'typescript',
      code: `// mylib/go.mod -- a public library, matching the main page's own
// "wrong" example verbatim
module github.com/alice/mylib

go 1.22

require github.com/upstream/pkg v1.5.0

// The main page's own comment claims: "Users of mylib get your
// local fork forced on them!" -- but per the Go modules reference,
// "replace directives only apply in the main module's go.mod file
// and are ignored in other modules."
replace github.com/upstream/pkg => ./local-fork

// When YOU build mylib directly (mylib IS the main module here):
// $ cd mylib && go build ./...
// -> uses ./local-fork, exactly as intended during development`,
    },
    {
      label: 'What a consumer of mylib actually experiences',
      language: 'typescript',
      code: `// consumer-app/go.mod -- some other application depending on mylib
module github.com/bob/consumer-app

go 1.22

require github.com/alice/mylib v1.0.0
// consumer-app has its OWN require for upstream/pkg, resolved
// through mylib's require -- mylib's replace line is simply never
// consulted, because consumer-app is the main module here, not mylib.

// $ cd consumer-app && go build ./...
//
// Per the modules reference's own rule -- "ignored in other
// modules" -- mylib's "replace github.com/upstream/pkg =>
// ./local-fork" line has ZERO effect on this build. Go instead
// tries to resolve github.com/upstream/pkg from its real,
// published source at whatever version the module graph selects.
//
// The actual risk to Bob is NOT "my local-fork is forced on Bob's
// machine" (that fork does not exist on Bob's machine, and Go
// never tries to fetch it there) -- it is one of:
//
//   (a) upstream/pkg's real published module resolves fine, but
//       lacks whatever fix ./local-fork had -- mylib may then
//       behave incorrectly for Bob, silently, with no error at all
//   (b) upstream/pkg's real module doesn't exist publicly at all
//       (e.g. it was a private, unpublished fork used only for
//       mylib's own local development) -- Bob's build fails with
//       a "cannot find module" error instead`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own mistake entry\'s "wrong" example precisely, a maintainer ships github.com/alice/mylib v1.0.0 to the public Go module proxy with a replace github.com/upstream/pkg => ./local-fork line still present in its go.mod — the exact scenario the main page warns against. A user, Bob, adds mylib as a dependency to his own application and runs go build. Using this subtopic\'s theory, explain precisely what Bob\'s build actually does with that replace line, and why the main page\'s own "Users of mylib get your local fork forced on them!" comment describes the wrong mechanism for what will actually go wrong for Bob.',
    hint: 'Per this subtopic\'s theory, whose go.mod is the "main module" when Bob runs go build inside his own consumer-app — Bob\'s, or mylib\'s? Does the documented rule about where replace directives apply mean Bob\'s build even attempts to use ./local-fork at all?',
    solution: 'Bob\'s build completely ignores mylib\'s replace line — per this subtopic\'s theory, "replace directives only apply in the main module\'s go.mod file and are ignored in other modules," and when Bob runs go build inside consumer-app, consumer-app is the main module, not mylib. Go never attempts to resolve ./local-fork at all, since that path only has meaning relative to mylib\'s own directory on the original maintainer\'s machine — a path Bob\'s machine has no knowledge of and never tries to reach. The main page\'s own "Users of mylib get your local fork forced on them!" comment therefore describes the wrong failure mode: nothing is "forced on" Bob, because the replace directive simply does not run for him at all. What Bob actually experiences, per this subtopic\'s theory, is one of two outcomes instead: either Go successfully resolves the REAL, published github.com/upstream/pkg (and mylib may misbehave if it depended on fixes that only existed in ./local-fork and were never actually merged upstream), or the build fails outright with a "cannot find module" error if upstream/pkg\'s real published version does not exist at all (which is common when a replace pointed at a local-only, never-published fork in the first place).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A replace directive left in a published library\'s go.mod actively propagates to every consumer\'s build — as the main page\'s own "wrong" comment puts it, "Users of mylib get your local fork forced on them."',
      reality: 'This subtopic\'s theory quotes the Go modules reference directly: "replace directives only apply in the main module\'s go.mod file and are ignored in other modules." A consumer\'s build never even attempts to use the library\'s replace target — the directive is read and then discarded the instant the library stops being the main module.'
    },
    {
      thought: 'Since Bob\'s build "ignores" mylib\'s replace directive, shipping one in a library is essentially harmless — worst case, it just does nothing for consumers.',
      reality: 'This subtopic\'s exercise shows a real, silent consequence: consumers fall back to resolving the REAL upstream/pkg module, which may lack fixes the library was actually developed and tested against (silent misbehavior) or may not exist publicly at all (a hard "cannot find module" build failure) — "ignored" does not mean "harmless," just that the failure mode is different from what the main page\'s own comment describes.'
    },
    {
      thought: 'The "main module only" rule for replace directives is a special case specific to library-vs-application distinctions — application go.mod files are exempt from it.',
      reality: 'This subtopic\'s theory states the rule applies to whichever module is the MAIN module for a given build — any module, application or library, has its replace directives ignored the moment it is consumed as someone else\'s dependency rather than built directly. The library-vs-application framing in the main page\'s own mistake entry describes a common CONSEQUENCE of this rule (libraries are consumed as dependencies far more often than built directly), not a separate rule limited to libraries.'
    }
  ];
}
