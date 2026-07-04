import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-how-usestaticfiles-etag-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './how-usestaticfiles-computes-etag-touching-file-busts-cache.html',
  styleUrl: './how-usestaticfiles-computes-etag-touching-file-busts-cache.scss',
})
export class HowUsestaticfilesComputesEtagTouchingFileBustsCacheSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states ETag and Last-Modified are set "automatically" and enable 304 responses — but never explains WHAT the ETag value actually is, or where it comes from',
      points: [
        'The main Static Files page says <code>UseStaticFiles()</code> "sets <code>ETag</code> and <code>Last-Modified</code> headers automatically for conditional request support," enabling 304 responses. What it does not explain: ASP.NET Core\'s built-in static file middleware computes the ETag as a WEAK VALIDATOR derived from the file\'s LENGTH and LAST-WRITE TIMESTAMP — specifically, a hash combining <code>FileInfo.Length</code> and <code>FileInfo.LastWriteTimeUtc</code> — NOT a hash of the file\'s actual byte content.',
      ],
    },
    {
      heading: 'Because the ETag is derived from the file system timestamp rather than content, any operation that updates LastWriteTimeUtc WITHOUT changing a single byte of content produces a brand-new ETag — busting every client\'s cache',
      points: [
        'A deployment process that extracts files from a zip archive, copies files during a build step, or runs <code>git checkout</code> on a fresh clone can all reset a file\'s <code>LastWriteTimeUtc</code> to the moment of the operation — even when the file\'s CONTENT is byte-for-byte identical to what was already deployed. Since the ETag depends on that timestamp, EVERY client with the file cached now receives a DIFFERENT ETag on their next conditional request, fails the <code>If-None-Match</code> comparison, and re-downloads a file that never actually changed.',
        'This directly undercuts the main page\'s own Cache-Control guidance: a long-TTL, content-hashed URL (<code>app.a1b2c3d4.js</code>) sidesteps this entirely, because the client never even sends a conditional request within the TTL window. But for the SHORTER-TTL files the main page also recommends (<code>favicon.ico</code>, <code>robots.txt</code>) — which rely specifically on ETag/304 behavior to stay efficient — a deployment process that resets file timestamps silently defeats that efficiency on every single deploy, even when nothing in those files changed.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the ETag actually depends on — length + last-write time, NOT content bytes',
      language: 'csharp',
      code: `// Conceptually, ASP.NET Core's static file middleware computes something
// equivalent to this for every served file (simplified — the real
// implementation lives in Microsoft.AspNetCore.StaticFiles internals):

public static string ComputeWeakETag(FileInfo file)
{
    // The ETag is derived from LENGTH and LAST-WRITE TIME —
    // NOT a hash of the file's actual bytes:
    var etagHash = Convert.ToBase64String(
        BitConverter.GetBytes(file.LastWriteTimeUtc.ToFileTime())
            .Concat(BitConverter.GetBytes(file.Length))
            .ToArray());

    return $"\\"{etagHash}\\"";   // wrapped in quotes per the ETag header spec
}

// PROOF: two files with IDENTICAL byte content but DIFFERENT
// LastWriteTimeUtc values produce DIFFERENT ETags:
var original = new FileInfo("wwwroot/robots.txt");
File.Copy("wwwroot/robots.txt", "wwwroot/robots-recopied.txt");
var recopied = new FileInfo("wwwroot/robots-recopied.txt");

Console.WriteLine(ComputeWeakETag(original));   // e.g. "abc123=="
Console.WriteLine(ComputeWeakETag(recopied));   // e.g. "xyz789==" — DIFFERENT,
                                                  // despite byte-identical content,
                                                  // because File.Copy sets a fresh
                                                  // LastWriteTimeUtc on the copy`,
    },
    {
      label: 'The deployment scenario that silently busts every client cache — zero content changes',
      language: 'csharp',
      code: `// A TYPICAL DEPLOYMENT PIPELINE STEP:
//
//   1. CI builds the app, producing wwwroot/robots.txt (unchanged content
//      since the last release — this file hasn't been edited in months).
//   2. The deployment step extracts a fresh zip archive onto the
//      production server, OR runs 'git checkout' on a clean working tree.
//   3. Either operation sets robots.txt's LastWriteTimeUtc to "now" —
//      the moment of extraction/checkout — REGARDLESS of whether the
//      file's actual content differs from the previous deployment.
//
// THE CONSEQUENCE FOR EVERY CLIENT WITH robots.txt CACHED:
//
//   Client's next request:
//     GET /robots.txt
//     If-None-Match: "abc123=="        (ETag from BEFORE this deploy)
//
//   Server's response (content is byte-identical, but the file's
//   LastWriteTimeUtc changed during deployment):
//     200 OK                            (NOT 304 — the ETag comparison
//     ETag: "xyz789=="                   failed, because the NEW ETag
//                                         doesn't match the OLD one the
//                                         client is holding)
//     [full file body re-sent]
//
// This happens for EVERY cached client, on EVERY deployment, for EVERY
// static file whose timestamp gets reset by the deploy process — even
// files that have not changed in months. The main page's own
// Cache-Control guidance for short-TTL files ("The ETags and
// Last-Modified headers set by UseStaticFiles enable conditional
// requests so unchanged files return 304") silently stops being true
// the moment a deployment process resets file timestamps on every
// release, regardless of actual content changes.

// THE FIX: either (a) preserve original file timestamps during
// deployment (many CI/CD tools and zip extraction utilities support
// this explicitly), or (b) supply a CUSTOM ETag generator based on
// content hash instead of relying on the built-in timestamp-based one:
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Override with a content-based ETag for files where deployment
        // timestamp resets are known to happen — computed once and
        // cached, not recomputed on every request:
        var contentHash = ContentHashCache.GetOrCompute(ctx.File.PhysicalPath!);
        ctx.Context.Response.Headers.ETag = $"\\"{contentHash}\\"";
    }
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given that the built-in ETag is timestamp-based, explain why a CONTENT-HASH-based custom ETag (as sketched in the second code tab\'s fix) is immune to the deployment-timestamp-reset problem this subtopic describes, and identify one new cost that a content-hash approach introduces that the built-in timestamp-based ETag does not have.',
    hint: 'Consider what work is required to COMPUTE a content hash versus reading a file\'s LastWriteTimeUtc and Length properties — one requires reading the entire file, the other requires only metadata.',
    solution: `A content-hash-based ETag is immune to the deployment-timestamp problem
BECAUSE it is computed from the file's actual bytes, not its file-system
metadata — a deployment process that resets LastWriteTimeUtc without
changing a single byte of content produces the EXACT SAME hash before and
after deployment, so the ETag stays identical and clients correctly
receive 304 Not Modified.

The new cost this introduces: computing a content hash requires READING
THE ENTIRE FILE into memory (or streaming it through a hash algorithm like
SHA-256), whereas the built-in timestamp-based ETag only requires reading
TWO CHEAP METADATA FIELDS (FileInfo.Length and FileInfo.LastWriteTimeUtc)
— no file I/O of the actual content is needed at all. For a large file
served frequently, recomputing a content hash on every single request
would be measurably more expensive than the built-in approach.

This is exactly why the fix sketched in this subtopic's second code tab
uses a CACHE (ContentHashCache.GetOrCompute) rather than hashing the file
on every request — the hash is computed ONCE (the first time the file is
served after a process start, or the first time it's requested after a
change is detected via file-watching), then reused for all subsequent
requests until the underlying file's content actually changes. This
trades a small amount of memory (to store the cached hash) and a modest
one-time cost per file for content-based cache correctness that survives
deployment timestamp resets — a worthwhile trade for files affected by
this problem, but unnecessary overhead for files with content-hashed URLs
that already sidestep the issue entirely via long-TTL, no-revalidation
caching.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the ETag ASP.NET Core\'s static file middleware generates is a hash of the file\'s actual content bytes.',
      reality: 'the built-in ETag is a WEAK validator derived from the file\'s length and last-write timestamp — two cheap metadata fields — not a hash of the file\'s content, which means it can change even when content is byte-for-byte identical.',
    },
    {
      thought: 'if a file\'s content never changes, its ETag will never change either, guaranteeing 304 responses on every subsequent request.',
      reality: 'any operation that resets the file\'s LastWriteTimeUtc — a zip extraction, a git checkout, a deployment copy — produces a NEW ETag even with zero content changes, since the timestamp (not the content) is what the ETag is actually derived from.',
    },
    {
      thought: 'a content-hash-based custom ETag is strictly better than the built-in timestamp-based one and should always be used instead.',
      reality: 'a content-hash ETag requires reading the entire file to compute (and should be cached to avoid recomputing on every request), while the built-in approach only reads cheap metadata — the built-in default is the right choice UNLESS a deployment process is known to reset timestamps without changing content, which is exactly the specific gap a custom content-hash ETag closes.',
    },
  ];
}
