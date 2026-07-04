import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-startswith-path-traversal-bypass-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './startswith-path-traversal-guard-sibling-directory-bypass.html',
  styleUrl: './startswith-path-traversal-guard-sibling-directory-bypass.scss',
})
export class StartswithPathTraversalGuardSiblingDirectoryBypassSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Download action guards path traversal with <code>fullPath.StartsWith(uploadRoot)</code> — this exact pattern has a well-known sibling-directory bypass',
      points: [
        'The main Static Files page\'s "Download Response" code tab computes <code>var safePath = Path.GetFullPath(Path.Combine("uploads", record.StoredName)); if (!safePath.StartsWith(Path.GetFullPath("uploads"))) return BadRequest();</code>. This blocks the OBVIOUS traversal case (<code>../../appsettings.json</code> resolving outside <code>uploads/</code>) — but <code>string.StartsWith()</code> performs a plain character-prefix comparison with NO awareness of directory boundaries. A path that starts with the SAME CHARACTERS as the upload root, but is actually a completely different SIBLING directory, passes this check.',
      ],
    },
    {
      heading: 'A directory named "uploads-backup" (or "uploads2", "uploads_old", anything sharing the string prefix "uploads") starts with the literal string "uploads" without a trailing separator — defeating the guard entirely',
      points: [
        'If the upload root resolves to <code>C:\\app\\uploads</code> and an attacker-controlled path resolves to <code>C:\\app\\uploads-backup\\secrets.txt</code>, the string <code>"C:\\app\\uploads-backup\\secrets.txt"</code> DOES start with the string <code>"C:\\app\\uploads"</code> — because <code>StartsWith</code> only compares characters, not path segments. If ANY sibling directory sharing that character prefix exists on the server (a backup folder, a versioned folder, a totally unrelated folder that just happens to start the same way), the guard silently passes a request that should have been rejected.',
        'This is a well-known, recurring class of vulnerability across many languages and frameworks — not specific to ASP.NET Core. The fix is to append the platform directory separator to the expected root before comparing (or to use a purpose-built path-containment check), ensuring the comparison respects directory BOUNDARIES rather than raw characters.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own path traversal guard — vulnerable to a sibling-directory bypass',
      language: 'csharp',
      code: `[HttpGet("{id:guid}")]
public async Task<IActionResult> Download(Guid id)
{
    var record = await _db.Files.FindAsync(id);
    if (record is null) return NotFound();

    // THE MAIN PAGE'S OWN GUARD — looks correct, but has a gap:
    var safePath = Path.GetFullPath(
        Path.Combine("uploads", record.StoredName));
    if (!safePath.StartsWith(Path.GetFullPath("uploads")))
        return BadRequest();

    return PhysicalFile(safePath, record.ContentType,
        fileDownloadName: record.OriginalName,
        enableRangeProcessing: true);
}

// THE GAP: Path.GetFullPath("uploads") resolves to something like
// "C:\\app\\uploads" (NO trailing separator). If 'record.StoredName'
// somehow resolves to a path under a SIBLING folder that happens to
// share that character prefix — e.g. "C:\\app\\uploads-backup\\secrets.txt"
// — the string "C:\\app\\uploads-backup\\secrets.txt".StartsWith(
// "C:\\app\\uploads") returns TRUE, because StartsWith performs a raw
// character comparison with zero awareness of where a directory
// boundary actually falls.`,
    },
    {
      label: 'Demonstrating the bypass, and the fix — append the separator before comparing',
      language: 'csharp',
      code: `// A minimal reproduction of the bypass, independent of any specific
// attacker input mechanism — this is purely about the STRING COMPARISON
// LOGIC itself being insufficient:

var uploadRoot = Path.GetFullPath("uploads");          // "C:\\app\\uploads"
var siblingFile = Path.GetFullPath("uploads-backup/secrets.txt");
// siblingFile == "C:\\app\\uploads-backup\\secrets.txt"

Console.WriteLine(siblingFile.StartsWith(uploadRoot));
// Prints: True  — THE BUG. "uploads-backup\\secrets.txt" is NOT actually
// inside the "uploads" directory at all — it is a completely separate
// sibling directory that merely shares a character prefix.

// ── THE FIX: append the directory separator to the expected root
// BEFORE comparing, so the check respects directory BOUNDARIES ──
public static bool IsWithinRoot(string candidatePath, string root)
{
    var normalizedRoot = Path.GetFullPath(root);
    // Ensure the root ends with a separator — this is what turns a raw
    // character-prefix comparison into a genuine directory-boundary
    // comparison:
    if (!normalizedRoot.EndsWith(Path.DirectorySeparatorChar))
        normalizedRoot += Path.DirectorySeparatorChar;

    var normalizedCandidate = Path.GetFullPath(candidatePath);

    // Also handle the exact-match case (candidate IS the root itself)
    // separately, since that legitimately should not have a trailing
    // separator appended to it:
    return normalizedCandidate.Equals(Path.GetFullPath(root), StringComparison.OrdinalIgnoreCase)
        || normalizedCandidate.StartsWith(normalizedRoot, StringComparison.OrdinalIgnoreCase);
}

// Re-running the same bypass attempt against the FIXED check:
Console.WriteLine(IsWithinRoot("uploads-backup/secrets.txt", "uploads"));
// Prints: False — correctly rejected, because "C:\\app\\uploads-backup\\..."
// does NOT start with "C:\\app\\uploads\\" (note the trailing separator
// now present in the comparison root), even though it DID start with
// the separator-less "C:\\app\\uploads".`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The fixed <code>IsWithinRoot</code> method in this subtopic appends a directory separator before comparing. Identify one additional real-world scenario — beyond a sibling directory sharing a character prefix — where relying purely on string comparison (even with the separator fix) could still be insufficient on certain file systems, and explain briefly why.',
    hint: 'Consider case sensitivity across different operating systems, or the existence of symbolic links / junction points that could make a path LOOK like it is inside the root while actually resolving elsewhere on disk.',
    solution: `Two real scenarios worth knowing, beyond the sibling-directory prefix bug
this subtopic focuses on:

1. CASE SENSITIVITY DIFFERENCES ACROSS FILE SYSTEMS: Windows and macOS
   (by default) treat file paths as case-INSENSITIVE, while Linux
   treats them as case-SENSITIVE. The fixed IsWithinRoot method in this
   subtopic already accounts for this by using
   StringComparison.OrdinalIgnoreCase — but a naive implementation using
   plain StartsWith() (with the CLR's default ordinal comparison) could
   behave inconsistently: a path differing only in case
   ("C:\\App\\Uploads\\file.txt" vs the root "C:\\app\\uploads") might
   incorrectly be rejected on a case-sensitive deployment target even
   though it points to the exact same file on a case-insensitive one.
   The specific fix in this subtopic's second code tab already handles
   this correctly by explicitly ignoring case — but it's worth knowing
   WHY that specific StringComparison choice matters here.

2. SYMBOLIC LINKS AND JUNCTION POINTS: a string-based path check operates
   entirely on the TEXT of a path — it has no way to know that a
   directory or file within the "uploads" folder might actually be a
   symbolic link (or Windows junction point) pointing OUTSIDE the
   upload root entirely. A path like "uploads/link-to-secrets" could
   pass every string-based containment check while the operating
   system transparently resolves it to a completely different location
   on disk when the file is actually opened. Closing this gap requires
   checking the RESOLVED, canonical path (e.g., using
   File.ResolveLinkTarget() in modern .NET, or refusing to follow
   symbolic links within the upload directory at all) rather than
   relying on string comparison of the path as written — a
   fundamentally different class of check than anything a StartsWith-
   style fix, however careful, can address on its own.

The broader lesson: path-containment security checks based purely on
string comparison — even a correctly separator-aware one — assume the
file system resolves paths literally. Symbolic links break that
assumption, which is why defense-in-depth for untrusted file access
often also restricts write permissions on the upload directory itself
(preventing an attacker from ever placing a symlink there in the first
place) rather than relying solely on read-time path validation.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'string.StartsWith(uploadRoot) is a sufficient path traversal guard as long as Path.GetFullPath() has already been called to resolve ".." segments.',
      reality: 'StartsWith performs a raw character-prefix comparison with no awareness of directory boundaries — a sibling directory whose name shares the same character prefix (like "uploads-backup" versus "uploads") passes the check even though it is a completely different, unrelated directory.',
    },
    {
      thought: 'the fix for the sibling-directory bypass is to reject any path containing a hyphen or unusual character after the expected root name.',
      reality: 'the actual fix is to append the platform directory separator to the expected root before comparing, turning a character-prefix comparison into a genuine directory-boundary comparison — this handles ANY sibling directory name, not just ones matching a specific character blocklist.',
    },
    {
      thought: 'a correctly separator-aware path-containment check (like the fixed IsWithinRoot in this subtopic) is a complete defense against all forms of path traversal.',
      reality: 'a string-based check, however correct, cannot detect a symbolic link or junction point within the allowed directory that resolves to a location OUTSIDE it at the file-system level — that requires resolving the canonical path or restricting write access to the upload directory entirely.',
    },
  ];
}
