import { Component, signal, computed } from '@angular/core';

interface AspnetError {
  code: string;
  title: string;
  cause: string;
  fix: string;
  example: string;
  solution: string;
  tag: 'startup' | 'routing' | 'auth' | 'efcore' | 'async' | 'http';
}

@Component({
  selector: 'app-aspnet-errors',
  standalone: true,
  imports: [],
  templateUrl: './errors.html',
  styleUrl: './errors.scss',
})
export class AspnetErrors {
  activeTag = signal<string>('all');
  tags = ['all', 'startup', 'routing', 'auth', 'efcore', 'async', 'http'];

  errors: AspnetError[] = [
    {
      code: 'DI001',
      title: 'Cannot consume scoped service from singleton',
      cause: 'A Singleton service injects a Scoped service. Scoped services are created per request; holding one in a Singleton leaks it for the app lifetime.',
      fix: 'Inject IServiceScopeFactory into the Singleton and create a scope manually, or change the Singleton to Scoped.',
      example: `// BAD — OrderService is Scoped, but EmailSender is Singleton
public class EmailSender(OrderService orders) { }  // InvalidOperationException`,
      solution: `// GOOD — inject IServiceScopeFactory
public class EmailSender(IServiceScopeFactory factory) {
    public void Send() {
        using var scope  = factory.CreateScope();
        var orders = scope.ServiceProvider.GetRequiredService<OrderService>();
    }
}`,
      tag: 'startup',
    },
    {
      code: 'DI002',
      title: 'No service registered for type X',
      cause: 'GetRequiredService<T>() or constructor injection was used but the service was never registered in Program.cs.',
      fix: 'Add the missing registration. Use GetService<T>() (returns null) when the service is optional.',
      example: `// Missing registration — throws at runtime:
builder.Build();  // IMyService not in DI → InvalidOperationException`,
      solution: `builder.Services.AddScoped<IMyService, MyService>(); // register before Build()
var app = builder.Build();`,
      tag: 'startup',
    },
    {
      code: 'MW001',
      title: 'Middleware order: auth before routing (404/401 confusion)',
      cause: 'UseAuthentication / UseAuthorization placed after UseEndpoints, or UseRouting not called before UseAuthentication.',
      fix: 'Follow the canonical order: UseRouting → UseAuthentication → UseAuthorization → UseEndpoints.',
      example: `app.MapControllers();
app.UseAuthentication();  // Too late — endpoints already matched, auth ignored`,
      solution: `app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();`,
      tag: 'startup',
    },
    {
      code: 'RT001',
      title: 'AmbiguousMatchException — multiple routes match',
      cause: 'Two endpoints match the same URL and HTTP method without sufficient differentiation.',
      fix: 'Add route constraints, remove the duplicate, or use different HTTP verbs.',
      example: `app.MapGet("/products/{id}", GetById);
app.MapGet("/products/{name}", GetByName);  // AmbiguousMatchException`,
      solution: `app.MapGet("/products/{id:int}",    GetById);    // constraint: integer
app.MapGet("/products/{slug:regex(^[a-z-]+$)}", GetBySlug);  // constraint: slug`,
      tag: 'routing',
    },
    {
      code: 'RT002',
      title: 'Route parameter not bound (400 Bad Request)',
      cause: 'Minimal API or controller parameter name does not match the route template placeholder name.',
      fix: 'Ensure the parameter name in the handler matches the placeholder in the route template exactly (case-insensitive).',
      example: `app.MapGet("/orders/{orderId}", (int id) => id);  // {orderId} ≠ id`,
      solution: `app.MapGet("/orders/{orderId}", (int orderId) => orderId);  // names match`,
      tag: 'routing',
    },
    {
      code: 'AUTH001',
      title: '401 Unauthorized — missing UseAuthentication()',
      cause: 'Authorization policy applied but UseAuthentication() not added to the pipeline, so HttpContext.User is never populated.',
      fix: 'Call UseAuthentication() before UseAuthorization() in Program.cs.',
      example: `app.UseAuthorization();  // User is always anonymous — 401 on every [Authorize] request
app.MapControllers();`,
      solution: `app.UseAuthentication();  // must come first
app.UseAuthorization();
app.MapControllers();`,
      tag: 'auth',
    },
    {
      code: 'AUTH002',
      title: 'JWT validation fails — clock skew / algorithm mismatch',
      cause: 'Token rejected due to (1) server clock drift vs issuer, (2) algorithm in token header not matching AddJwtBearer config, or (3) wrong signing key.',
      fix: 'Set ClockSkew = TimeSpan.Zero (or small value) and ensure ValidAlgorithms matches the token. Log the exact SecurityTokenException message.',
      example: `// Default ClockSkew is 5 minutes — tokens still valid for 5 min after expiry
opts.TokenValidationParameters = new() { /* no ClockSkew set */ };`,
      solution: `opts.TokenValidationParameters = new()
{
    ValidateLifetime = true,
    ClockSkew        = TimeSpan.Zero,    // strict expiry
    ValidAlgorithms  = ["HS256"],         // match your token
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret))
};`,
      tag: 'auth',
    },
    {
      code: 'EF001',
      title: 'DbContext accessed after it was disposed',
      cause: 'Captured a Scoped DbContext in a lambda, background task, or static field that outlives the request scope.',
      fix: 'Never capture DbContext across scope boundaries. Use IServiceScopeFactory in background services.',
      example: `// BAD — dbContext captured in a Task.Run that runs after response ends:
app.MapGet("/", async (AppDbContext db) => {
    _ = Task.Run(() => db.Products.ToList());  // ObjectDisposedException
    return Results.Ok();
});`,
      solution: `// GOOD — create a new scope for the background work:
app.MapGet("/", async (IServiceScopeFactory factory) => {
    _ = Task.Run(async () => {
        using var scope = factory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var list = await db.Products.ToListAsync();
    });
    return Results.Ok();
});`,
      tag: 'efcore',
    },
    {
      code: 'EF002',
      title: 'Migration pending — database out of sync',
      cause: 'Model changed but migration not applied, or connection string points to the wrong database.',
      fix: 'Run dotnet ef database update. In production, apply migrations at startup or via a migration job.',
      example: `// App starts but returns 500 on queries:
// Microsoft.Data.SqlClient.SqlException: Invalid column name 'NewColumn'`,
      solution: `# Apply migration:
dotnet ef database update

# Or apply in startup code (small apps / dev):
using var scope = app.Services.CreateScope();
scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();`,
      tag: 'efcore',
    },
    {
      code: 'ASYNC001',
      title: 'async void — unhandled exceptions crash the process',
      cause: 'async void methods cannot be awaited. Any exception thrown propagates to the synchronization context and usually crashes the app or is silently swallowed.',
      fix: 'Always use async Task (or async Task<T>). Only async void is acceptable for event handlers.',
      example: `// BAD:
public async void SendEmailAsync(string to) {
    await _smtp.SendAsync(to);  // exception crashes process silently
}`,
      solution: `// GOOD:
public async Task SendEmailAsync(string to) {
    await _smtp.SendAsync(to);  // exception propagates normally via await
}`,
      tag: 'async',
    },
    {
      code: 'ASYNC002',
      title: 'Deadlock — .Result or .Wait() on async code',
      cause: 'Calling .Result or .Wait() on an async Task in an environment with a synchronization context (e.g. older ASP.NET, STA thread) causes a deadlock.',
      fix: 'Never block on async code. Propagate async/await up the call stack. Use .GetAwaiter().GetResult() only in synchronous entry points where there is no sync context.',
      example: `// BAD — can deadlock in ASP.NET with sync context:
var data = GetDataAsync().Result;  // blocks thread waiting for context that is blocked`,
      solution: `// GOOD — async all the way:
var data = await GetDataAsync();`,
      tag: 'async',
    },
    {
      code: 'HTTP001',
      title: 'HttpClient socket exhaustion',
      cause: 'Creating new HttpClient() in a loop or in every request. Each instance creates a new socket pool; old sockets linger in TIME_WAIT.',
      fix: 'Use IHttpClientFactory or a static/shared HttpClient. Never use new HttpClient() in hot paths.',
      example: `// BAD — new socket pool per request:
app.MapGet("/weather", async () => {
    using var client = new HttpClient();          // socket leak
    return await client.GetStringAsync("https://api.weather.com");
});`,
      solution: `// GOOD — factory manages socket lifetime:
app.MapGet("/weather", async (IHttpClientFactory factory) => {
    var client = factory.CreateClient("weather");
    return await client.GetStringAsync("/current");
});`,
      tag: 'http',
    },
    {
      code: 'HTTP002',
      title: 'HttpRequestException — HTTPS certificate error in development',
      cause: 'The ASP.NET Core dev HTTPS certificate is not trusted by the OS or container.',
      fix: 'Run dotnet dev-certs https --trust once per machine. In Docker, use http:// instead of https:// or mount certs.',
      example: `// Startup logs: Unable to connect to the remote server
// Inner: The SSL connection could not be established`,
      solution: `# Trust the dev certificate (Windows/macOS):
dotnet dev-certs https --trust

# Docker — disable HTTPS for local dev containers:
ASPNETCORE_HTTP_PORTS=8080`,
      tag: 'http',
    },
  ];

  filtered = computed(() => {
    const tag = this.activeTag();
    return tag === 'all' ? this.errors : this.errors.filter(e => e.tag === tag);
  });
}
