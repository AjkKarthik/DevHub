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
  templateUrl: './go-embed-excludes-dot-and-underscore-files.html',
  styleUrl: './go-embed-excludes-dot-and-underscore-files.scss'
})
export class GoEmbedExcludesDotAndUnderscoreFilesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions go:embed in one QnA line — with no mention of what silently gets left out',
      points: [
        'The main page\'s own QnA answer for embedding static files says only: "add //go:embed static/* above a variable of type embed.FS... The embedded files become part of the compiled binary." It shows the directive and one directory-glob pattern, but says nothing about which files inside that directory the pattern actually captures.',
        'The official embed package documentation is explicit about a default exclusion built into directory patterns: "all files in the subtree rooted at that directory are embedded (recursively), except that files with names beginning with \'.\' or \'_\' are excluded." This applies to files AND directories with those prefixes — a dot-file or underscore-prefixed subdirectory is skipped entirely, along with everything inside it.',
        'This default exists because dot-files and underscore-prefixed files are conventionally build artifacts, editor swap files, or private/internal directories (.git, .DS_Store, _archived) — go:embed assumes a pattern like static/* means "the public content of this directory," not literally every filesystem entry present.',
      ]
    },
    {
      heading: 'The escape hatch: the all: prefix',
      points: [
        'The documentation describes exactly one way to opt back in: "If a pattern begins with the prefix \'all:\', then the rule for walking directories is changed to include those files beginning with \'.\' or \'_\'. For example, \'all:image\' embeds both \'image/.tempfile\' and \'image/dir/.tempfile\'."',
        'Applied to the main page\'s own example: //go:embed static/* silently skips any static/.htaccess or static/_drafts/ directory that happens to exist; //go:embed all:static includes them. The two directives look almost identical but capture a genuinely different set of files.',
        'This matters most for exactly the kind of content people embed with go:embed — web assets, templates, config bundles — where a stray dot-file (a .gitkeep, a .env.example accidentally left in a static/ folder) silently vanishes from the compiled binary with no error, warning, or build-time signal that anything was skipped.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own go:embed line -- what it actually captures',
      language: 'typescript',
      code: `package main

import (
    "embed"
    "fmt"
    "io/fs"
)

// This mirrors the main page's own QnA example exactly.
//go:embed static/*
var staticFiles embed.FS

func main() {
    // Directory layout on disk before building:
    //   static/index.html
    //   static/style.css
    //   static/.htaccess       <- starts with "."
    //   static/_drafts/notes.md <- starts with "_"
    //
    // Per the embed package's own documented default, ONLY
    // index.html and style.css end up inside staticFiles.
    // .htaccess and the entire _drafts/ subtree are silently
    // excluded -- no error, no build warning.
    fs.WalkDir(staticFiles, ".", func(path string, d fs.DirEntry, err error) error {
        fmt.Println(path)
        return nil
    })
    // Output:
    // static
    // static/index.html
    // static/style.css
    // (".htaccess" and "_drafts" never appear)
}`,
    },
    {
      label: 'Opting back in with the all: prefix',
      language: 'typescript',
      code: `package main

import (
    "embed"
    "fmt"
    "io/fs"
)

// Same directory layout as before, but "all:" changes the walk rule
// per the embed package's own documented behavior: "the rule for
// walking directories is changed to include those files beginning
// with '.' or '_'."
//go:embed all:static
var everyStaticFile embed.FS

func main() {
    fs.WalkDir(everyStaticFile, ".", func(path string, d fs.DirEntry, err error) error {
        fmt.Println(path)
        return nil
    })
    // Output now includes everything:
    // static
    // static/index.html
    // static/style.css
    // static/.htaccess
    // static/_drafts
    // static/_drafts/notes.md
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team follows the main page\'s own QnA example exactly: //go:embed static/* above var staticFiles embed.FS, to bundle their web app\'s assets into the binary. Locally, everything works — the app serves index.html and style.css correctly from staticFiles. After deploying, a support engineer discovers that static/_locales/en.json (a directory of translation files with an underscore-prefixed name, added by a teammate last month) was never actually served — fs.ReadFile(staticFiles, "static/_locales/en.json") returns a "file does not exist" error in production, even though the file is clearly present in the repository and the build succeeded with no errors. Using this subtopic\'s theory, explain the root cause and the one-line fix.',
    hint: 'Per this subtopic\'s theory, does the directory pattern static/* embed literally every file and subdirectory under static/, or does it apply a default exclusion? What specifically triggers that exclusion, and what does the directory name _locales start with?',
    solution: 'The root cause is exactly the default exclusion this subtopic\'s theory describes: the embed package documentation states plainly that a directory pattern embeds "all files in the subtree rooted at that directory... except that files with names beginning with \'.\' or \'_\' are excluded." Since _locales begins with an underscore, the ENTIRE _locales directory — including en.json nested inside it — was silently skipped by //go:embed static/*, exactly as this subtopic\'s first code example demonstrates for _drafts/. The build succeeds and gives no warning because, from go:embed\'s own perspective, this is not an error — it is the documented default behavior, working exactly as designed. The fix is the one-line change this subtopic\'s theory describes: change the directive to //go:embed all:static, which per the documentation "changes the rule for walking directories to include those files beginning with \'.\' or \'_\'" — restoring _locales (and any other underscore- or dot-prefixed content) to the embedded filesystem without needing to rename the directory or restructure the project.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A go:embed directory pattern like static/* embeds literally every file and subdirectory that physically exists under static/ on disk — the pattern is a plain filesystem glob with no hidden exceptions.',
      reality: 'This subtopic\'s theory quotes the embed package documentation directly: directory patterns embed everything in the subtree "except that files with names beginning with \'.\' or \'_\' are excluded" by default. This is a deliberate, documented exception baked into how go:embed walks directories — not an edge case of a generic glob implementation.'
    },
    {
      thought: 'If a dot-file or underscore-prefixed file is accidentally excluded from an embedded filesystem, the build will fail or at least print a warning, since the file clearly exists in the source tree.',
      reality: 'This subtopic\'s exercise shows the opposite: the build succeeds silently, with no warning of any kind, because from go:embed\'s perspective this exclusion is the intended default behavior, not an error condition. The gap only surfaces at runtime, when code tries to read a path that was never actually embedded.'
    },
    {
      thought: 'The all: prefix is a completely separate, unrelated embed feature (e.g. for embedding from multiple directories at once) rather than specifically an opt-in for dot/underscore files.',
      reality: 'This subtopic\'s theory and second code example show all: has exactly one documented purpose: per the embed package docs, it "changes the rule for walking directories to include those files beginning with \'.\' or \'_\'." It does not change which directories can be embedded — only whether dot/underscore-prefixed entries inside them are included.'
    }
  ];
}
