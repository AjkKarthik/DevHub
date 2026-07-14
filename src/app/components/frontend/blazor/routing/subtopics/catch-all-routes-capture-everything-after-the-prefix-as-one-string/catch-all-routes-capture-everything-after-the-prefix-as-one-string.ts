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
  templateUrl: './catch-all-routes-capture-everything-after-the-prefix-as-one-string.html',
  styleUrl: './catch-all-routes-capture-everything-after-the-prefix-as-one-string.scss'
})
export class CatchAllRoutesCaptureEverythingAfterThePrefixAsOneStringSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A catch-all parameter is fundamentally different from a normal route parameter — it spans MULTIPLE path segments, not just one',
      points: [
        'The main page states that {*path} "captures the remainder of the URL path as a single string parameter," worth making precise: a NORMAL route parameter like {id} in /products/{id} matches exactly ONE path segment — it cannot contain a literal "/" character, since that would start a new segment.',
        'A catch-all parameter (the leading "*" is the key syntax) instead matches EVERY remaining segment after the fixed prefix, including any "/" characters between them, and delivers the whole thing as ONE string value — /docs/{*path} matched against /docs/guides/setup/install captures "guides/setup/install" as a single string, not three separate values.',
      ]
    },
    {
      heading: 'Practical consequences worth knowing before building a catch-all route: leading slashes, URL decoding, and matching precedence',
      points: [
        'The captured string does NOT include a leading slash — for /docs/{*path} matched against /docs/guides/setup, the path parameter is "guides/setup", not "/guides/setup"; code that concatenates a leading slash back on (e.g. to build a file-system lookup path) needs to add it explicitly rather than assume it is already present.',
        'Ordinary URL-encoded characters within a segment ARE decoded before the string reaches the component — a URL like /docs/getting%20started delivers "getting started" (a literal space) as part of the captured path, not the raw percent-encoded text, which matters if the captured value is later used to construct a NEW url that needs re-encoding.',
        'A catch-all route is matched with LOWER priority than a more specific route matching the same prefix — if both @page "/docs/faq" and @page "/docs/{*path}" exist, a request for exactly /docs/faq resolves to the specific route, not the catch-all, even though the catch-all pattern would technically also match that URL; the router always prefers the more specific match when one exists.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Capturing a multi-segment path as one string',
      language: 'csharp',
      code: `@page "/docs/{*path}"

<h1>Docs: @Path</h1>

@code {
    [Parameter] public string Path { get; set; } = "";

    // URL: /docs/guides/setup/install
    // Path receives: "guides/setup/install"  — one string, three
    // segments joined by "/", NOT three separate parameters.

    // URL: /docs  (no trailing segments at all)
    // Path receives: ""  — an empty string, still successfully
    // matched by the catch-all rather than falling through to a 404.
}`,
    },
    {
      label: 'No leading slash — a common concatenation bug',
      language: 'csharp',
      code: `@page "/docs/{*path}"

@code {
    [Parameter] public string Path { get; set; } = "";

    protected override async Task OnParametersSetAsync()
    {
        // BUG: Path does NOT include a leading "/" — for URL
        // /docs/guides/setup, Path is "guides/setup", so this
        // produces "content/guides/setup" (missing the intended
        // leading slash before "guides"), not "content/guides/setup"
        // as might be assumed by casual string concatenation.
        var wrongLookup = "content" + Path;

        // CORRECT: explicitly add the separator.
        var correctLookup = "content/" + Path;
        content = await DocsService.LoadAsync(correctLookup);
    }

    private string? content;
}`,
    },
    {
      label: 'A more specific route wins over the catch-all',
      language: 'csharp',
      code: `// DocsFaq.razor
@page "/docs/faq"
<h1>Frequently Asked Questions</h1>

// DocsCatchAll.razor
@page "/docs/{*path}"
<h1>Docs: @Path</h1>
@code { [Parameter] public string Path { get; set; } = ""; }

// A request for exactly /docs/faq resolves to DocsFaq.razor —
// even though "/docs/{*path}" would ALSO technically match that
// URL (with Path = "faq"). The router always prefers the more
// specific, non-catch-all route when one exists for the exact
// same URL, so DocsCatchAll only actually handles paths that don't
// match any more specific /docs/... route defined elsewhere.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A documentation site defines @page "/docs/{*path}" to render markdown files from a folder structure, mapping Path directly to a file system lookup like Path.Combine("content", "/" + path + ".md") — with an explicit leading slash the developer added out of caution. A teammate points out this specific line has a bug regardless of what URL is visited. What is it?',
    hint: 'Think about what this subtopic\'s theory says the captured Path value looks like at the START — does it already have a leading slash, or does the code\'s own "/" + path add a SECOND one relative to what a naive concatenation without any slash would have produced?',
    solution: 'The bug is a doubled path separator, not a missing one — the opposite of the naive mistake this subtopic\'s theory warns about. Since Path never includes a leading slash (confirmed: /docs/guides/setup captures "guides/setup", not "/guides/setup"), Path.Combine("content", "/" + path + ".md") produces "content" combined with "/guides/setup.md" — and because the second argument to Path.Combine already starts with "/", Path.Combine treats it as an ABSOLUTE path and DISCARDS the "content" prefix entirely (this is documented .NET Path.Combine behavior: when a later argument is rooted/absolute, all earlier segments are dropped). The lookup silently resolves to "/guides/setup.md" at the filesystem root, not "content/guides/setup.md" as intended. The fix is the same one this subtopic\'s second code example already shows: use "content/" + path (a plain string concatenation with the separator built in) rather than routing the captured path through Path.Combine with a manually-prepended leading slash.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A catch-all parameter like {*path} works the same way as a normal route parameter, just with a different name convention — it still matches exactly one path segment.',
      reality: 'This subtopic\'s first code example shows a catch-all parameter genuinely spans MULTIPLE path segments, including the "/" characters between them, delivering the whole remainder as one string — fundamentally different from a normal {id}-style parameter, which cannot contain a "/" at all.'
    },
    {
      thought: 'The captured catch-all string always includes a leading slash matching how it appeared in the original URL, since that is how the segments were separated.',
      reality: 'This subtopic\'s second code example shows the captured value does NOT include a leading slash — /docs/guides/setup captures "guides/setup", not "/guides/setup" — a real, easy-to-miss detail when concatenating the captured path into a new string for a file-system or API lookup.'
    },
    {
      thought: 'If both a specific route (/docs/faq) and a catch-all route (/docs/{*path}) exist for overlapping URLs, which one handles a given request depends on the ORDER the routes happen to be declared or discovered in.',
      reality: 'This subtopic\'s third code example shows the router always prefers the MORE SPECIFIC, non-catch-all route for an exact match, regardless of declaration order — a catch-all route only actually handles requests that do not match any more specific route, by design, not by an accident of ordering.'
    }
  ];
}
