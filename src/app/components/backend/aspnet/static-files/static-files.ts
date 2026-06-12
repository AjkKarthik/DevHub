import { Component } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

@Component({
  selector: 'app-aspnet-static-files',
  standalone: true,
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent,
            QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent,
            PageMetaComponent, PageCompleteComponent],
  templateUrl: './static-files.html',
  styleUrl: './static-files.scss',
})
export class AspnetStaticFiles {

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
        '<code>app.UseStaticFiles()</code> serves any file under <code>wwwroot/</code> by matching the request path. It short-circuits — once a file is found, no further middleware runs.',
        'Call <code>UseDefaultFiles()</code> before <code>UseStaticFiles()</code> to redirect <code>/</code> to <code>index.html</code> — required for SPA hosting.',
        'Register <code>UseStaticFiles()</code> early in the pipeline, after <code>UseRouting()</code>, so static files bypass auth middleware (or place after auth if you need to protect them).',
        'Use <code>StaticFileOptions.OnPrepareResponse</code> to append <strong>Cache-Control</strong> headers before the response is sent.',
      ],
    },
    {
      heading: 'Custom File Providers',
      points: [
        'Mount a folder outside <code>wwwroot</code> with <code>StaticFileOptions { FileProvider = new PhysicalFileProvider(path), RequestPath = "/media" }</code>.',
        '<code>UseDirectoryBrowser()</code> exposes the folder listing — guard it with <code>if (app.Environment.IsDevelopment())</code>, never enable in production.',
        'Multiple <code>UseStaticFiles()</code> calls can serve different paths simultaneously: one for <code>wwwroot</code>, another for <code>uploads</code>.',
      ],
    },
    {
      heading: 'File Uploads — IFormFile vs Streaming',
      points: [
        '<code>IFormFile</code> buffers the entire upload to memory or a temp file — fine for files under ~1 MB.',
        'For large files, disable buffering and stream via <code>Request.BodyReader</code> (PipeReader). Add <code>[DisableRequestSizeLimit]</code> and <code>[RequestFormLimits(MultipartBodyLengthLimit = long.MaxValue)]</code> to the action.',
        '<strong>Always validate</strong> the file extension and Content-Type before saving. Never trust the client-reported MIME type alone.',
        'Use <code>Path.GetRandomFileName()</code> for the stored name to avoid collisions and prevent users from guessing file paths.',
      ],
    },
    {
      heading: 'File Downloads',
      points: [
        'Return <code>PhysicalFile(path, contentType, fileDownloadName)</code> to trigger a browser download dialog. ASP.NET Core streams the file without loading it fully into memory.',
        'Set <code>enableRangeProcessing: true</code> to support HTTP Range requests — required for video seeking and resumable downloads.',
        '<strong>Path traversal</strong>: always sanitise user-supplied filenames with <code>Path.GetFileName()</code> and verify <code>Path.GetFullPath()</code> stays within the upload root before serving.',
        'Use <code>File(bytes, contentType, downloadName)</code> to return generated content (CSV, PDF) directly from memory.',
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
  ];
}
