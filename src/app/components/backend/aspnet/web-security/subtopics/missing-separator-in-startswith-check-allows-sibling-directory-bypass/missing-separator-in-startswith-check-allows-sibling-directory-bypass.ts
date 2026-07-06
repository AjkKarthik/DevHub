import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-missing-separator-startswith-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './missing-separator-in-startswith-check-allows-sibling-directory-bypass.html',
  styleUrl: './missing-separator-in-startswith-check-allows-sibling-directory-bypass.scss',
})
export class MissingSeparatorInStartswithCheckAllowsSiblingDirectoryBypassSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "safe" path-traversal check includes a detail it never explains why it matters: full.StartsWith(root + Path.DirectorySeparatorChar) — NOT just full.StartsWith(root). Dropping that trailing separator, which looks like a harmless simplification, reopens the exact vulnerability the check exists to close',
      points: [
        '<code>string.StartsWith()</code> is a pure character comparison — it has no concept of "directory boundary." <code>"C:\\uploads-secret\\file.txt".StartsWith("C:\\uploads")</code> is <code>true</code>, even though <code>uploads-secret</code> is a COMPLETELY DIFFERENT, sibling directory that merely happens to share a text prefix with <code>uploads</code>. If an attacker can get <code>Path.GetFullPath()</code> to resolve into any sibling directory whose NAME starts with the same characters as the allowed root — via a symlink, a junction, or simply because such a directory already exists on the server — a bare <code>StartsWith(root)</code> check lets the traversal through completely.',
        'Appending <code>Path.DirectorySeparatorChar</code> to the root before comparing closes this exactly: <code>"C:\\uploads-secret\\file.txt".StartsWith("C:\\uploads\\")</code> is <code>false</code> — the trailing separator forces the comparison to require a genuine path-boundary match, not just a shared text prefix. This single character is the difference between a check that looks correct in every normal test case (valid files inside <code>uploads</code>, and <code>../</code> traversal attempts that get resolved OUTSIDE any prefix match at all) and one that is actually airtight against the sibling-directory edge case specifically.',
      ],
    },
    {
      heading: 'This bug class is easy to introduce during a well-intentioned refactor — many "cleaned up" or ported versions of this check drop the trailing separator because it looks redundant, since it never triggers on any of the OBVIOUS test cases a developer would think to write',
      points: [
        'A test suite that only tries a valid filename and an obvious <code>"../../etc/passwd"</code>-style traversal attempt will pass with EITHER version of the check — <code>root</code> or <code>root + separator</code> — because neither of those inputs happens to resolve into a sibling directory sharing a text prefix with the root. The missing-separator bug is invisible to exactly the test cases people naturally think to write when testing "does path traversal prevention work" — it requires DELIBERATELY constructing (or already having) a sibling directory with a prefix-colliding name to surface at all.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug, reproduced — a sibling directory defeats the bare StartsWith check',
      language: 'csharp',
      code: `// Server has these directories side by side:
//   /var/app/uploads/            <- the intended, allowed root
//   /var/app/uploads-secret/     <- a DIFFERENT directory that
//                                   happens to exist (e.g. an
//                                   internal ops tool's staging area,
//                                   a backup folder, a misconfigured
//                                   deploy artifact) — completely
//                                   unrelated to the uploads feature

// THE SUBTLY BROKEN VERSION — looks correct, passes every "obvious"
// test case, but drops the trailing separator:
app.MapGet("/download", (string filename) =>
{
    var root = Path.GetFullPath("/var/app/uploads");
    var full = Path.GetFullPath(Path.Combine(root, filename));

    if (!full.StartsWith(root))            // <-- missing separator!
        return Results.BadRequest("Invalid filename.");

    return File.Exists(full) ? Results.File(full) : Results.NotFound();
});

// Attacker request: filename = "../uploads-secret/internal-report.csv"
// Path.GetFullPath resolves this to:
//   /var/app/uploads-secret/internal-report.csv
// "/var/app/uploads-secret/internal-report.csv".StartsWith(
//     "/var/app/uploads") → TRUE (pure string prefix match!)
// The check passes. The file outside the intended root is served.

// THE MAIN PAGE'S ACTUAL CODE — correct, with the separator:
if (!full.StartsWith(root + Path.DirectorySeparatorChar))
    return Results.BadRequest("Invalid filename.");
// "/var/app/uploads-secret/....".StartsWith("/var/app/uploads/")
//   → FALSE — correctly rejected.`,
    },
    {
      label: 'The regression test that specifically catches this — and why obvious tests miss it',
      language: 'csharp',
      code: `[Fact]
public async Task Download_Rejects_Sibling_Directory_With_Prefix_Collision()
{
    // Arrange: create a sibling directory that shares a text prefix
    // with the allowed root — this is the ONLY input shape that
    // exposes the missing-separator bug.
    var tempRoot = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
    Directory.CreateDirectory(Path.Combine(tempRoot, "uploads"));
    Directory.CreateDirectory(Path.Combine(tempRoot, "uploads-secret"));
    await File.WriteAllTextAsync(
        Path.Combine(tempRoot, "uploads-secret", "internal.csv"),
        "sensitive data");

    await using var app = new WebApplicationFactory<Program>()
        .WithWebHostBuilder(b => b.ConfigureServices(s =>
            s.AddSingleton(new UploadsRootOptions(Path.Combine(tempRoot, "uploads")))));
    var client = app.CreateClient();

    // Request a file in the SIBLING directory via a relative traversal
    // that resolves OUT of "uploads" and INTO "uploads-secret":
    var response = await client.GetAsync(
        "/download?filename=" + Uri.EscapeDataString("../uploads-secret/internal.csv"));

    // With the trailing separator present (correct): rejected.
    // With it missing (the subtle regression): 200 OK, file served.
    Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
}

// Contrast: a test using only the "obvious" traversal attempt passes
// EITHER WAY and provides zero signal about this specific bug:
[Fact]
public async Task Download_Rejects_Obvious_Etc_Passwd_Traversal()
{
    await using var app = new WebApplicationFactory<Program>();
    var client = app.CreateClient();
    var response = await client.GetAsync(
        "/download?filename=" + Uri.EscapeDataString("../../../../etc/passwd"));
    Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    // Passes with OR without the trailing separator — "/etc/passwd"
    // never shares a text prefix with the uploads root at all, so
    // this test can never distinguish the two implementations.
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A reviewer suggests an "even simpler" fix: instead of appending Path.DirectorySeparatorChar, just check full.StartsWith(root, StringComparison.OrdinalIgnoreCase) — reasoning that path comparisons should be case-insensitive on Windows anyway. Does this address the sibling-directory bug? What is this change actually fixing, and what is it NOT fixing?',
    hint: 'Does making a string comparison case-INsensitive change whether "uploads-secret" is considered to start with "uploads" as a text prefix? Are case-sensitivity and directory-boundary-awareness the same concern?',
    solution: `No — StringComparison.OrdinalIgnoreCase does not address the
sibling-directory bug at all; it fixes a COMPLETELY DIFFERENT, orthogonal
problem. Case-insensitivity only affects whether "UPLOADS" and
"uploads" are treated as the same text — it has no bearing on whether
"uploads-secret" is considered a prefix match of "uploads". The string
"/var/app/uploads-secret/file".StartsWith("/var/app/uploads",
StringComparison.OrdinalIgnoreCase) is STILL true, for exactly the
same structural reason as the ordinal comparison: it's a text-prefix
match, not a directory-boundary match, and adding a comparison mode
parameter doesn't change what "prefix" means.

This is a genuinely useful correction to layer in for Windows
deployments (where the filesystem is case-insensitive, so a purely
ordinal case-sensitive comparison could reject a legitimately-cased
path that should be allowed) — but it solves a DIFFERENT bug
(case-sensitivity mismatches between the resolved path and the
configured root) than the one this subtopic is about (prefix collision
with an unrelated sibling directory). Both fixes are worth applying
TOGETHER, since they address independent failure modes of the same
StartsWith() check: full.StartsWith(root + Path.DirectorySeparatorChar,
StringComparison.OrdinalIgnoreCase) — the separator fixes the boundary
problem, the comparison mode fixes the case-sensitivity problem, and
neither one substitutes for the other.

The broader lesson: when reviewing a security-critical string
comparison, it's worth explicitly asking "what specific attack does
THIS proposed change prevent" rather than accepting a plausible-sounding
simplification or hardening suggestion at face value — two fixes can
both sound like "path comparison correctness" improvements while
targeting entirely unrelated vulnerabilities.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'full.StartsWith(root) is a correct and complete way to verify a resolved path stays within an allowed root directory — the main page\'s extra + Path.DirectorySeparatorChar is a stylistic detail, not a functional requirement.',
      reality: 'a bare StartsWith(root) is a pure text-prefix comparison with no concept of directory boundaries — a sibling directory whose name happens to start with the same characters as the root (e.g. "uploads-secret" vs "uploads") passes the check even though it is a completely different, unrelated directory; the trailing separator is what forces a genuine boundary match.',
    },
    {
      thought: 'a test suite that tries a valid filename and an "../../etc/passwd"-style traversal attempt provides adequate coverage for a path-traversal safety check.',
      reality: 'those obvious test cases pass identically whether the trailing separator is present or missing, because neither input happens to resolve into a directory sharing a text prefix with the root — catching this specific bug requires deliberately testing against a sibling directory with a prefix-colliding name.',
    },
    {
      thought: 'using StringComparison.OrdinalIgnoreCase on the StartsWith() check is a reasonable hardening that also addresses the sibling-directory prefix-collision problem.',
      reality: 'case-sensitivity and directory-boundary-awareness are two unrelated concerns — an OrdinalIgnoreCase comparison still treats "uploads-secret" as starting with "uploads"; only the trailing separator changes what counts as a genuine prefix match, and both fixes should be applied together rather than one substituting for the other.',
    },
  ];
}
