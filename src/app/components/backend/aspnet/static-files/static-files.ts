import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../../shared/prerequisites/prerequisites';

@Component({
  selector: 'app-aspnet-static-files',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent,
            CommonMistakesComponent, RevisionCardComponent, PrerequisitesComponent],
  templateUrl: './static-files.html',
  styleUrl: './static-files.scss',
})
export class AspnetStaticFiles {

  prerequisites: Prerequisite[] = [
    { label: 'Middleware', route: '/aspnet/middleware' },
    { label: 'Web Security', route: '/aspnet/web-security' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'UseStaticFiles()',      type: 'method',    desc: 'Serves files from wwwroot (or a custom provider)' },
    { name: 'StaticFileOptions',     type: 'class',     desc: 'Configures content type provider, request path, file provider' },
    { name: 'UseDirectoryBrowser()', type: 'method',    desc: 'Enables directory listing — dev/internal use only' },
    { name: 'UseDefaultFiles()',     type: 'method',    desc: 'Maps / to index.html — must be called before UseStaticFiles' },
    { name: 'PhysicalFileProvider',  type: 'class',     desc: 'Maps a physical folder to a request path prefix' },
    { name: 'IFormFile',             type: 'interface', desc: 'Buffered upload — suitable for small files (< ~1 MB)' },
    { name: 'IFormFileCollection',   type: 'interface', desc: 'Multiple file upload in one request' },
    { name: 'Request.BodyReader',    type: 'accessor',  desc: 'PipeReader for streaming large uploads without buffering' },
    { name: 'Response.BodyWriter',   type: 'accessor',  desc: 'PipeWriter for streaming downloads' },
    { name: 'FileStreamResult',      type: 'class',     desc: 'Returns a file stream with content-type and filename headers' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Serving Static Files',
      points: [
        '<code>app.UseStaticFiles()</code> serves any file under <code>wwwroot/</code> by matching the request URL path to the file system path. It <strong>short-circuits</strong> — once a matching file is found, the response is sent immediately and no further middleware executes. This makes it very fast and ensures static files bypass authentication middleware if placed before it.',
        'Call <code>UseDefaultFiles()</code> <em>before</em> <code>UseStaticFiles()</code> to rewrite <code>/</code> to <code>/index.html</code> (or <code>/default.html</code>). <code>UseDefaultFiles</code> only rewrites the path — the actual file serving is done by the subsequent <code>UseStaticFiles()</code>. Reversing the order means the rewrite never happens.',
        'Middleware order determines security: placing <code>UseStaticFiles()</code> before <code>UseAuthentication()</code> means static files are served without auth checks. This is usually correct for truly public assets (JS, CSS, images). Move it after <code>UseAuthorization()</code> only if you need to gate all static assets — but a controller action is cleaner for protected files.',
        'Use <code>StaticFileOptions.OnPrepareResponse</code> to set <strong>Cache-Control</strong> headers: <code>ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=31536000,immutable")</code> for versioned assets. This callback fires for every static file response, letting you vary headers by file type or path.',
        'Content type auto-detection: <code>UseStaticFiles</code> uses <code>FileExtensionContentTypeProvider</code> to map extensions to MIME types. Add custom mappings with <code>StaticFileOptions { ContentTypeProvider = new FileExtensionContentTypeProvider { Mappings = { [".wasm"] = "application/wasm" } } }</code>.',
        '<code>UseStaticFiles()</code> sets <code>ETag</code> and <code>Last-Modified</code> headers automatically for conditional request support (<code>If-None-Match</code>, <code>If-Modified-Since</code>). This enables 304 Not Modified responses for unchanged files, reducing bandwidth even when clients re-request cached assets.',
      ],
    },
    {
      heading: 'Custom File Providers',
      points: [
        'Mount a folder outside <code>wwwroot</code> with <code>StaticFileOptions { FileProvider = new PhysicalFileProvider(absolutePath), RequestPath = "/media" }</code>. Call <code>UseStaticFiles(options)</code> with this configuration in addition to (or instead of) the default <code>UseStaticFiles()</code>.',
        '<code>UseDirectoryBrowser()</code> exposes a clickable folder listing at the specified path. Only enable in development environments: <code>if (app.Environment.IsDevelopment()) app.UseDirectoryBrowser(...)</code>. In production, directory listing leaks the structure of your file system to attackers.',
        'Multiple <code>UseStaticFiles()</code> registrations coexist: the first one registered that matches the request path wins. Register more specific paths (e.g., <code>/uploads</code>) before the general <code>wwwroot</code> registration.',
        '<code>CompositeFileProvider</code> merges multiple providers into one logical virtual file system: <code>new CompositeFileProvider(new PhysicalFileProvider(path1), new PhysicalFileProvider(path2))</code>. Useful for overlaying an embedded resource provider with a physical one (e.g., overridable templates).',
        '<code>ManifestEmbeddedFileProvider</code> serves files embedded into the assembly (<code>&lt;EmbeddedResource&gt;</code> items). Useful for NuGet packages shipping UI assets or for single-executable apps that must not rely on the file system.',
        'Use <code>IWebHostEnvironment.WebRootFileProvider</code> to access the current wwwroot provider programmatically — useful for checking whether a file exists before serving or for composing custom providers at startup.',
      ],
    },
    {
      heading: 'File Uploads — IFormFile vs Streaming',
      points: [
        '<code>IFormFile</code> buffers the entire upload — first to memory, then to a temp file when the buffer threshold is exceeded (default 64 KB). This is fine for small files (< 1–2 MB) but causes significant memory pressure and disk I/O for large uploads.',
        'For large files, stream the multipart body directly using <code>MultipartReader</code> against <code>Request.Body</code>. Decorate the action with <code>[DisableRequestSizeLimit]</code> and <code>[RequestFormLimits(MultipartBodyLengthLimit = long.MaxValue)]</code> to prevent ASP.NET Core from buffering the form before your action runs.',
        '<strong>Always validate uploaded files</strong>: (1) extension whitelist — reject anything not in <code>[".jpg", ".png", ".pdf"]</code>; (2) size limit — check <code>file.Length</code> before saving; (3) content inspection — read the first few bytes to verify the magic number (JPEG starts with <code>FF D8 FF</code>) rather than trusting the client Content-Type.',
        'Sanitize stored filenames: use <code>Path.GetRandomFileName()</code> (collision-resistant, unpredictable) instead of user-supplied names. Storing user-supplied filenames risks overwriting existing files, path traversal when serving, and XSS if the filename ends up in HTML without escaping.',
        'Upload to a temporary location first, validate, then move to the final destination. If validation fails, delete the temp file. This prevents partially written or invalid files from polluting the upload directory.',
        'For cloud storage (Azure Blob, S3), generate a pre-signed URL on the server and have the client upload directly — bypassing your server entirely. This removes the server as a bandwidth bottleneck and eliminates the need to stream large files through your application.',
      ],
    },
    {
      heading: 'File Downloads and Security',
      points: [
        'Return <code>PhysicalFile(absolutePath, contentType, fileDownloadName)</code> to stream a file from disk. ASP.NET Core opens a <code>FileStream</code> and pipes it to the response without loading the entire file into memory — safe for large files.',
        'Set <code>enableRangeProcessing: true</code> to support HTTP Range requests (<code>Range: bytes=0-1023</code>). The response returns <code>206 Partial Content</code> with the requested byte range. Required for video seeking, audio scrubbing, and resumable downloads from download managers.',
        '<strong>Path traversal prevention</strong>: always sanitize user-supplied file identifiers. Use <code>Path.GetFileName(userInput)</code> to strip directory separators, then compute the full path and assert it starts with the expected root: <code>if (!fullPath.StartsWith(uploadRoot)) return BadRequest()</code>. Never use user input directly in <code>Path.Combine()</code>.',
        'Content-Disposition header: <code>attachment; filename="report.pdf"</code> triggers a browser download dialog. <code>inline</code> tells the browser to display the file in-page (images, PDFs). Use <code>Content-Disposition-UTF8</code> encoding for filenames with non-ASCII characters.',
        'Do NOT serve user-uploaded files from the same origin as your app. An uploaded HTML or SVG file served from <code>app.example.com/uploads/evil.html</code> executes JavaScript in your origin — enabling stored XSS. Serve user content from a dedicated subdomain or CDN with <code>Content-Security-Policy: sandbox</code>.',
        'For generated files (CSV exports, PDF reports), use <code>File(bytes, contentType, downloadName)</code> or pipe to <code>Response.Body</code> for large generated files. Set <code>Response.ContentLength</code> so the browser shows download progress.',
      ],
    },
    {
      heading: 'Cache-Control and HTTP Caching for Static Files',
      points: [
        'Cache-Control strategy: use <strong>long TTL + cache busting</strong> for versioned assets. Set <code>Cache-Control: public, max-age=31536000, immutable</code> (1 year) on files whose URL contains a content hash (e.g., <code>app.a1b2c3d4.js</code>). When the file changes, the URL changes — forcing a fresh download.',
        'For files without a cache-busting URL (e.g., <code>favicon.ico</code>, <code>robots.txt</code>), use a shorter TTL: <code>Cache-Control: public, max-age=86400</code> (1 day). The ETags and Last-Modified headers set by <code>UseStaticFiles</code> enable conditional requests so unchanged files return 304.',
        'Use ASP.NET Core\'s <code>TagHelper</code> <code>asp-append-version="true"</code> on <code>&lt;script&gt;</code> and <code>&lt;link&gt;</code> tags. It computes the file hash and appends it as a query string (<code>?v=h1a2s3h4</code>), enabling long TTL caching with automatic cache busting on file change.',
        'For API responses (not static files), set <code>Cache-Control: no-store</code> on sensitive endpoints (user data, financial records) and <code>Cache-Control: no-cache</code> (must revalidate) for content that should be fresh. Avoid <code>no-cache</code> on static files — it forces a round-trip on every request.',
        '<code>Vary: Accept-Encoding</code> should accompany compressed responses. ASP.NET Core sets this automatically when response compression middleware is enabled. Without <code>Vary</code>, a proxy might serve a gzip-compressed response to a client that does not support gzip.',
        'CDN integration: set <code>Cache-Control: public</code> and appropriate <code>max-age</code> so CDN edge nodes can cache static files. For dynamic content served through a CDN, use <code>Surrogate-Control</code> or CDN-specific cache headers to give the CDN a different TTL than the browser.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Basic Setup',
      language: 'csharp',
      code: `// Program.cs — SPA + static files
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
var app = builder.Build();

app.UseDefaultFiles();   // rewrite / → /index.html
app.UseStaticFiles();    // serve wwwroot files

app.UseRouting();
app.MapControllers();
app.Run();`,
    },
    {
      label: 'Custom Provider',
      language: 'csharp',
      code: `// Mount uploads/ folder at /uploads URL prefix
var uploadsPath = Path.Combine(builder.Environment.ContentRootPath, "uploads");

app.UseStaticFiles(new StaticFileOptions {
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath  = "/uploads",
    OnPrepareResponse = ctx =>
        ctx.Context.Response.Headers.Append(
            "Cache-Control", "public,max-age=86400")
});

// Directory browsing (dev only)
if (app.Environment.IsDevelopment())
    app.UseDirectoryBrowser(new DirectoryBrowserOptions {
        FileProvider = new PhysicalFileProvider(uploadsPath),
        RequestPath  = "/uploads"
    });`,
    },
    {
      label: 'IFormFile Upload',
      language: 'csharp',
      code: `[ApiController, Route("api/[controller]")]
public class FilesController : ControllerBase
{
    private static readonly string[] _allowed = [".jpg", ".png", ".pdf"];

    [HttpPost]
    [RequestSizeLimit(10 * 1024 * 1024)]    // 10 MB max
    public async Task<IActionResult> Upload(IFormFile file)
    {
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_allowed.Contains(ext)) return BadRequest("Type not allowed");

        var saveName = \$"{Guid.NewGuid()}{ext}";
        var path = Path.Combine("wwwroot/uploads", saveName);
        Directory.CreateDirectory("wwwroot/uploads");

        await using var stream = new FileStream(path, FileMode.Create);
        await file.CopyToAsync(stream);

        return Ok(new { url = \$"/uploads/{saveName}" });
    }
}`,
    },
    {
      label: 'Streaming Upload',
      language: 'csharp',
      code: `[HttpPost("stream")]
[DisableRequestSizeLimit]
[RequestFormLimits(MultipartBodyLengthLimit = long.MaxValue)]
public async Task<IActionResult> StreamUpload()
{
    if (!Request.ContentType?.Contains("multipart/") ?? true)
        return BadRequest("Multipart required");

    var boundary = HeaderUtilities.RemoveQuotes(
        MediaTypeHeaderValue.Parse(Request.ContentType).Boundary).Value!;

    var reader  = new MultipartReader(boundary, Request.Body);
    var section = await reader.ReadNextSectionAsync(HttpContext.RequestAborted);

    while (section is not null)
    {
        if (ContentDispositionHeaderValue.TryParse(
                section.ContentDisposition, out var cd) && cd.IsFileDisposition())
        {
            var name = Path.Combine("uploads", Path.GetRandomFileName());
            await using var fs = File.Create(name);
            await section.Body.CopyToAsync(fs);
        }
        section = await reader.ReadNextSectionAsync(HttpContext.RequestAborted);
    }
    return Accepted();
}`,
    },
    {
      label: 'Download Response',
      language: 'csharp',
      code: `[HttpGet("{id:guid}")]
public async Task<IActionResult> Download(Guid id)
{
    var record = await _db.Files.FindAsync(id);
    if (record is null) return NotFound();

    // Path traversal guard
    var safePath = Path.GetFullPath(
        Path.Combine("uploads", record.StoredName));
    if (!safePath.StartsWith(Path.GetFullPath("uploads")))
        return BadRequest();

    return PhysicalFile(safePath,
        record.ContentType,
        fileDownloadName:      record.OriginalName,
        enableRangeProcessing: true);   // supports video seek + resume
}`,
    },
  ];

  challenge: Challenge = {
    title: 'Safe Upload Endpoint',
    language: 'csharp',
    description: 'Write a minimal API endpoint POST /upload that: accepts an IFormFile, rejects files larger than 2 MB, rejects files that are not .jpg or .png, saves the file to an "uploads" folder with a random filename, and returns a JSON object with the saved filename.',
    hints: [
      'Use app.MapPost("/upload", async ([FromForm] IFormFile file) => ...)',
      'Path.GetExtension(file.FileName).ToLowerInvariant() gives the extension',
      'Path.GetRandomFileName() generates a collision-resistant name',
      'Ensure the uploads directory exists before writing',
    ],
    starterCode: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapPost("/upload", async ([FromForm] IFormFile file) =>
{
    // TODO: validate size (max 2 MB)
    // TODO: validate extension (.jpg or .png only)
    // TODO: save to "uploads/" folder with random filename
    // TODO: return { filename: "..." }
});

app.Run();`,
    solution: `var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapPost("/upload", async ([FromForm] IFormFile file) =>
{
    const long maxSize = 2 * 1024 * 1024;
    if (file.Length > maxSize)
        return Results.BadRequest("Max 2 MB");

    var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
    if (ext is not (".jpg" or ".png"))
        return Results.BadRequest("Only .jpg and .png allowed");

    Directory.CreateDirectory("uploads");
    var saveName = Path.GetRandomFileName() + ext;
    var path = Path.Combine("uploads", saveName);

    await using var stream = File.Create(path);
    await file.CopyToAsync(stream);

    return Results.Ok(new { filename = saveName });
})
.DisableAntiforgery();

app.Run();`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'Which middleware must be called BEFORE UseStaticFiles() to make requests for "/" serve "index.html"?',
      options: ['UseRouting()', 'UseDefaultFiles()', 'UseEndpoints()', 'UseAuthorization()'],
      answer: 1,
      explanation: 'UseDefaultFiles() rewrites the path from "/" to "/index.html" before UseStaticFiles() handles it. Order matters.',
    },
    {
      q: 'IFormFile buffers the upload. What is the recommended alternative for files larger than ~1 MB?',
      options: ['IFormFileCollection', 'Request.BodyReader (streaming multipart)', 'HttpContext.Request.Form', 'FormFile from Microsoft.AspNetCore.Http'],
      answer: 1,
      explanation: 'Request.BodyReader gives a PipeReader over the raw body, letting you stream without ever fully buffering.',
    },
    {
      q: 'You want to serve files from a folder named "assets/" at the URL path "/public". Which class configures the custom root?',
      options: ['EmbeddedFileProvider', 'ManifestEmbeddedFileProvider', 'PhysicalFileProvider', 'CompositeFileProvider'],
      answer: 2,
      explanation: 'PhysicalFileProvider maps a physical disk path to a virtual file-system path used by static file middleware.',
    },
    {
      q: 'A controller action should return a file for download. Which method is most appropriate?',
      options: ['Ok(fileBytes)', 'Content(base64)', 'PhysicalFile(path, contentType, fileDownloadName)', 'StatusCode(200, stream)'],
      answer: 2,
      explanation: 'PhysicalFile() sets Content-Disposition: attachment with the download name and streams the file efficiently.',
    },
    {
      q: 'To prevent path traversal attacks when constructing a file path from user input, what should you do?',
      options: [
        'URLDecode the filename',
        'Replace ".." with ""',
        'Use Path.GetFileName() to strip directory components, then verify the full path stays within the allowed root',
        'Limit the filename to 50 characters',
      ],
      answer: 2,
      explanation: 'Path.GetFileName() strips directory separators, and comparing Path.GetFullPath() against the uploads root catches any remaining traversal attempts.',
    },
    {
      q: 'What Cache-Control strategy should you use for JavaScript bundles with content-hash filenames?',
      options: [
        'Cache-Control: no-store — JS always needs to be fresh',
        'Cache-Control: public, max-age=31536000, immutable — long TTL because the URL changes when the file changes',
        'Cache-Control: private, max-age=3600 — only the user\'s browser should cache it',
        'Cache-Control: no-cache — force revalidation on every request',
      ],
      answer: 1,
      explanation: 'When files have content hashes in their URLs (app.abc123.js), the URL itself changes when the content changes. This means clients will always download the latest version. Setting max-age=31536000 (1 year) with immutable tells browsers and CDNs to cache aggressively without ever revalidating — optimal performance.',
    },
    {
      q: 'Why should you NOT serve user-uploaded files from the same origin as your application?',
      options: [
        'It increases bandwidth costs',
        'An uploaded HTML or SVG file executes JavaScript in your origin, enabling stored XSS',
        'Static file middleware cannot serve user-uploaded files',
        'File uploads always require a separate file server',
      ],
      answer: 1,
      explanation: 'An attacker can upload an HTML file with JavaScript. When served from app.example.com, the browser executes the script in your origin — giving it access to cookies, localStorage, and making same-origin API requests. Serve user content from a sandboxed subdomain or CDN with Content-Security-Policy: sandbox.',
    },
    {
      q: 'What does UseStaticFiles() automatically set that enables 304 Not Modified responses?',
      options: [
        'Content-Length and Content-Type only',
        'Cache-Control: must-revalidate',
        'ETag and Last-Modified headers — enabling conditional request support',
        'Vary: Accept-Encoding',
      ],
      answer: 2,
      explanation: 'UseStaticFiles() automatically computes and sets ETag (based on file content) and Last-Modified (from file system timestamp). When a client resends the request with If-None-Match or If-Modified-Since, the middleware compares them and returns 304 Not Modified if unchanged — saving bandwidth without any extra code.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Why does UseDefaultFiles() have to come before UseStaticFiles()?',
      a: 'UseDefaultFiles() is purely a URL rewriter — it changes the request path but does not serve any file. UseStaticFiles() then uses the already-rewritten path to locate index.html. Reversing them means UseStaticFiles() sees the original "/" path and finds no file at that location.',
    },
    {
      q: 'What is the default request size limit in ASP.NET Core?',
      a: 'The default is 30 MB for Kestrel. Use [RequestSizeLimit] on a specific action to change it, or [DisableRequestSizeLimit] to remove it. For streaming uploads you also need [RequestFormLimits(MultipartBodyLengthLimit = long.MaxValue)] to stop form binding from buffering.',
    },
    {
      q: 'Should I enable UseDirectoryBrowser() in production?',
      a: 'No. Directory browsing exposes the full folder structure publicly. Wrap it in: if (app.Environment.IsDevelopment()) { app.UseDirectoryBrowser(...); }',
    },
    {
      q: 'How do I serve static files that require authentication?',
      a: 'UseStaticFiles() does not participate in the auth pipeline — it short-circuits before authorization middleware. To protect files, serve them through a controller action (after UseAuthorization()), or store them outside wwwroot and stream them through an authenticated endpoint.',
    },
    {
      q: 'What is enableRangeProcessing in PhysicalFile()?',
      a: 'When true, ASP.NET Core handles HTTP Range requests (e.g., Range: bytes=0-1023). This enables video seeking and resumable downloads, adding support for the 206 Partial Content status and the Accept-Ranges: bytes response header.',
    },
    {
      q: 'How do I add Cache-Control headers for static files?',
      a: 'Use StaticFileOptions.OnPrepareResponse callback: ctx.Context.Response.Headers.Append("Cache-Control", "public,max-age=31536000"). This runs before each static file response is sent.',
    },
    {
      q: 'How do I validate an uploaded file\'s actual type rather than trusting the Content-Type header?',
      a: 'Read the first few bytes and check against known magic numbers — the binary signatures that identify file formats. For example: JPEG files start with <code>FF D8 FF</code>, PNG with <code>89 50 4E 47</code>, PDF with <code>25 50 44 46</code>. Read with <code>using var reader = new BinaryReader(file.OpenReadStream()); var header = reader.ReadBytes(4);</code>. A client can send any Content-Type header — magic number validation is the only reliable check.',
    },
    {
      q: 'How can large file downloads avoid loading the entire file into memory?',
      a: 'Use <code>PhysicalFile(absolutePath, contentType, downloadName)</code> which opens a FileStream and pipes it in chunks to the response body — ASP.NET Core uses a 80 KB buffer internally. For dynamically generated large files, write directly to <code>Response.Body</code> (a PipeWriter) in chunks rather than building a large byte array first. Setting <code>Response.ContentLength</code> allows the browser to show a progress indicator.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Calling UseDefaultFiles() after UseStaticFiles()',
      wrong: `app.UseStaticFiles();    // Serves files — "/" not rewritten, returns 404
app.UseDefaultFiles();  // Too late — static files already ran and short-circuited`,
      right: `app.UseDefaultFiles();   // Rewrites "/" to "/index.html" first
app.UseStaticFiles();    // Now serves /index.html correctly`,
      explanation: 'UseDefaultFiles() is a path rewriter, not a file server. It must run before UseStaticFiles() so the path is already rewritten to "index.html" when static files are served. Reversing the order means UseStaticFiles() sees "/" and finds nothing.',
    },
    {
      title: 'Trusting client-supplied Content-Type without magic number validation',
      wrong: `// Only checks MIME type from the form — trivially spoofed
if (file.ContentType != "image/jpeg")
    return BadRequest("Must be a JPEG");
// Attacker uploads evil.php with Content-Type: image/jpeg — bypass!`,
      right: `// Read first 3 bytes — JPEG magic number: FF D8 FF
await using var stream = file.OpenReadStream();
var header = new byte[3];
await stream.ReadExactlyAsync(header);
if (header is not [0xFF, 0xD8, 0xFF])
    return BadRequest("Not a valid JPEG file");
stream.Seek(0, SeekOrigin.Begin); // rewind before saving`,
      explanation: 'The Content-Type header is sent by the client and can be set to anything. An attacker can upload malicious PHP/HTML with Content-Type: image/jpeg. Magic number validation checks the actual bytes — file format signatures that cannot be easily faked for valid-looking files.',
    },
    {
      title: 'Enabling UseDirectoryBrowser() in production',
      wrong: `// No environment check — exposes file listing publicly!
app.UseDirectoryBrowser(new DirectoryBrowserOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath  = "/uploads"
});`,
      right: `if (app.Environment.IsDevelopment())
{
    app.UseDirectoryBrowser(new DirectoryBrowserOptions
    {
        FileProvider = new PhysicalFileProvider(uploadsPath),
        RequestPath  = "/uploads"
    });
}`,
      explanation: 'Directory listing exposes your entire file system structure to anyone who visits the URL. Attackers use this for reconnaissance — discovering upload paths, configuration files, and sensitive documents. Always restrict UseDirectoryBrowser() to development environments.',
    },
    {
      title: 'Using user-supplied filenames for stored files',
      wrong: `// User uploads "../../appsettings.json" as filename
var path = Path.Combine("uploads", file.FileName);  // Path traversal!
await using var stream = File.Create(path);`,
      right: `// Generate a random, unpredictable filename
var ext      = Path.GetExtension(file.FileName).ToLowerInvariant();
var saveName = Path.GetRandomFileName() + ext;
var path     = Path.Combine("uploads", saveName);
// Store original name in DB if needed for display purposes`,
      explanation: 'User-supplied filenames are a path traversal risk when used directly in Path.Combine. A filename like "../../appsettings.json" can overwrite critical files. Path.GetRandomFileName() generates a cryptographically secure random name — store the original name in the database separately for display.',
    },
    {
      title: 'Serving user-uploaded files from the same origin as the application',
      wrong: `// Serving uploads from the same domain as the app
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath  = "/uploads"
});
// Attacker uploads evil.html — browser executes JS in your origin!`,
      right: `// Option 1: serve from a separate subdomain (uploads.example.com)
// Option 2: use Azure Blob Storage / S3 with a different origin
// Option 3: add Content-Security-Policy and X-Content-Type-Options headers
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        ctx.Context.Response.Headers["Content-Security-Policy"] = "sandbox";
    }
});`,
      explanation: 'An uploaded HTML or SVG file served from your origin runs JavaScript with full access to cookies, localStorage, and same-origin API calls — a stored XSS attack. Serve user content from a separate origin (subdomain or CDN) or add Content-Security-Policy: sandbox to neutralize any embedded scripts.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'UseStaticFiles() serves files from wwwroot (or custom providers) and short-circuits; UseDefaultFiles() must come first to map "/" to index.html; file uploads need extension whitelist + magic number validation; downloads need path traversal guards.',
    mustKnow: [
      '<code>UseDefaultFiles()</code> must come BEFORE <code>UseStaticFiles()</code> — it rewrites the path, not serves the file',
      '<code>StaticFileOptions.OnPrepareResponse</code> sets Cache-Control headers; <code>ETag</code> and <code>Last-Modified</code> are set automatically (304 support)',
      '<code>PhysicalFileProvider</code> mounts a physical path at a URL prefix; never use directory browser in production',
      'Uploads: validate extension whitelist AND magic number bytes — never trust client Content-Type',
      'Store uploaded files with <code>Path.GetRandomFileName()</code>, not user-supplied names',
      'Path traversal guard: <code>Path.GetFileName()</code> + verify <code>Path.GetFullPath()</code> starts within upload root',
      'Never serve user-uploaded HTML/SVG from the same origin — XSS risk; use a separate origin or CDN with <code>Content-Security-Policy: sandbox</code>',
    ],
    interviewFocus: [
      'UseDefaultFiles vs UseStaticFiles order and why it matters',
      'Path traversal attacks: how they work and how to prevent them',
      'IFormFile buffering vs streaming multipart — when to use each',
      'Cache-Control strategy for versioned static assets (long TTL + cache busting)',
    ],
  };
}
