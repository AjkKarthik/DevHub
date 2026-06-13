import { Component, signal, computed } from '@angular/core';

type AnSection = 'middleware' | 'minimal' | 'di' | 'auth' | 'efcore' | 'httpclient' | 'cli';

interface CheatEntry { name: string; desc: string; example: string; tag?: string; }

@Component({
  selector: 'app-aspnet-cheatsheet',
  standalone: true,
  imports: [],
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class AspnetCheatsheet {
  active     = signal<AnSection>('middleware');
  searchTerm = signal('');

  sections: { key: AnSection; label: string; icon: string }[] = [
    { key: 'middleware',  label: 'Middleware',      icon: '🔗' },
    { key: 'minimal',    label: 'Minimal APIs',    icon: '🚀' },
    { key: 'di',         label: 'DI & Config',     icon: '⚙️' },
    { key: 'auth',       label: 'Auth & Security', icon: '🔐' },
    { key: 'efcore',     label: 'EF Core',         icon: '🗄️' },
    { key: 'httpclient', label: 'HTTP Client',     icon: '🌐' },
    { key: 'cli',        label: 'dotnet CLI',      icon: '💻' },
  ];

  middlewareEntries: CheatEntry[] = [
    { name: 'app.Use()',         desc: 'Add inline middleware. Call next(ctx) to pass through, or omit to short-circuit.', example: 'app.Use(async (ctx, next) => { await next(ctx); });' },
    { name: 'app.Run()',         desc: 'Terminal middleware — never calls next. Ends the pipeline.', example: 'app.Run(ctx => ctx.Response.WriteAsync("done"));' },
    { name: 'app.UseWhen()',     desc: 'Branch the pipeline conditionally. Main pipeline resumes after the branch.', example: 'app.UseWhen(ctx => ctx.Request.Path.StartsWith("/api"), b => b.UseMiddleware<ApiMiddleware>());' },
    { name: 'app.Map()',         desc: 'Branch permanently on a path prefix. The branch is a separate pipeline.', example: 'app.Map("/admin", b => b.Run(ctx => ctx.Response.WriteAsync("admin")));' },
    { name: 'UseAuthentication()', desc: 'Must come before UseAuthorization. Populates HttpContext.User.', example: 'app.UseAuthentication();\napp.UseAuthorization();' },
    { name: 'UseExceptionHandler()', desc: 'Catches unhandled exceptions and re-executes to an error path.', example: 'app.UseExceptionHandler("/error");', tag: 'Production' },
    { name: 'UseDeveloperExceptionPage()', desc: 'Detailed exception page — for Development only.', example: 'if (app.Environment.IsDevelopment()) app.UseDeveloperExceptionPage();' },
    { name: 'UseHsts()',         desc: 'Adds Strict-Transport-Security header. Production only.', example: 'if (!app.Environment.IsDevelopment()) app.UseHsts();' },
    { name: 'UseHttpsRedirection()', desc: 'Redirects HTTP to HTTPS.', example: 'app.UseHttpsRedirection();' },
    { name: 'UseStaticFiles()',  desc: 'Serves files from wwwroot. Call before UseRouting.', example: 'app.UseStaticFiles();' },
    { name: 'UseRouting()',      desc: 'Matches requests to endpoints. Implicit in .NET 7+ with MapXxx.', example: 'app.UseRouting(); app.UseEndpoints(e => e.MapControllers());' },
    { name: 'UseResponseCompression()', desc: 'Compresses responses. Must come before UseStaticFiles.', example: 'app.UseResponseCompression();', tag: 'Performance' },
  ];

  minimalEntries: CheatEntry[] = [
    { name: 'MapGet / MapPost / MapPut / MapDelete', desc: 'Map HTTP verbs to route handlers.', example: 'app.MapGet("/products/{id:int}", (int id) => Results.Ok(id));' },
    { name: 'Results.Ok / Created / NoContent',     desc: 'Typed result helpers with correct status codes.', example: 'return Results.Created($"/products/{p.Id}", p);' },
    { name: 'Results.NotFound / Problem',            desc: 'Return 404 or RFC 7807 problem details.', example: 'return item is null ? Results.NotFound() : Results.Ok(item);' },
    { name: 'TypedResults.*',                        desc: 'Strongly-typed variants of Results — better for OpenAPI/Swagger inference.', example: 'return TypedResults.Ok(product);', tag: '.NET 7+' },
    { name: 'MapGroup()',                            desc: 'Group routes under a prefix with shared filters/auth.', example: 'var api = app.MapGroup("/api/v1").RequireAuthorization();', tag: '.NET 7+' },
    { name: '[FromBody] / [FromRoute] / [FromQuery]', desc: 'Explicit binding source attributes.', example: 'app.MapPost("/", ([FromBody] Order o) => o);' },
    { name: 'AddEndpointFilter()',                   desc: 'Add a filter to an individual route or group.', example: 'app.MapGet("/", handler).AddEndpointFilter<ValidationFilter>();', tag: '.NET 7+' },
    { name: 'WithName()',                            desc: 'Assign a route name for link generation.', example: 'app.MapGet("/products/{id}", GetProduct).WithName("GetProduct");' },
    { name: 'WithOpenApi()',                         desc: 'Attach OpenAPI metadata to the endpoint.', example: 'app.MapPost("/", handler).WithOpenApi();', tag: '.NET 9+' },
    { name: 'RequireAuthorization()',                desc: 'Apply an auth policy to a route or group.', example: 'app.MapDelete("/orders/{id}", ...).RequireAuthorization("Admin");' },
    { name: 'ProducesProblem()',                     desc: 'Declare error response types for OpenAPI.', example: 'app.MapGet("/", Get).Produces<Product>().ProducesProblem(404);' },
    { name: 'IResult / IValueHttpResult',            desc: 'Return type for strongly-typed minimal API handlers.', example: 'static IResult Get(int id) => Results.Ok(id);' },
  ];

  diEntries: CheatEntry[] = [
    { name: 'AddSingleton<T>()',   desc: 'One instance for the app lifetime. Use for stateless, thread-safe services.', example: 'builder.Services.AddSingleton<ICache, MemoryCache>();' },
    { name: 'AddScoped<T>()',      desc: 'One instance per HTTP request. Safe for EF Core DbContext.', example: 'builder.Services.AddScoped<IOrderService, OrderService>();' },
    { name: 'AddTransient<T>()',   desc: 'New instance every time it is requested. Use for lightweight, stateless services.', example: 'builder.Services.AddTransient<IEmailSender, SmtpEmailSender>();' },
    { name: 'TryAddSingleton<T>()', desc: 'Register only if not already registered — for library code.', example: 'services.TryAddSingleton<IMyService, DefaultService>();' },
    { name: 'IOptions<T>',         desc: 'Access a strongly-typed config section injected at startup.', example: 'builder.Services.Configure<SmtpOptions>(config.GetSection("Smtp"));', tag: 'Options' },
    { name: 'IOptionsSnapshot<T>', desc: 'Scoped — re-reads config per request. Supports hot reload for appsettings.', example: '// inject IOptionsSnapshot<T> in a Scoped service', tag: 'Options' },
    { name: 'IOptionsMonitor<T>',  desc: 'Singleton — notified when config changes via OnChange callback.', example: 'monitor.OnChange(opts => _logger.LogInformation("Config changed"));', tag: 'Options' },
    { name: 'builder.Configuration.GetSection()', desc: 'Read a named section from appsettings.json.', example: 'var conn = builder.Configuration.GetConnectionString("Default");' },
    { name: 'ValidateDataAnnotations()', desc: 'Validate options with attributes at startup.', example: 'services.AddOptions<MyOptions>().BindConfiguration("MySection").ValidateDataAnnotations().ValidateOnStart();' },
    { name: 'KeyedService (.NET 8+)',   desc: 'Register multiple implementations of one interface, resolve by key.', example: 'services.AddKeyedSingleton<ICache, RedisCache>("redis");\n// resolve: [FromKeyedServices("redis")] ICache cache', tag: '.NET 8+' },
  ];

  authEntries: CheatEntry[] = [
    { name: 'AddAuthentication()',   desc: 'Register auth services and set the default scheme.', example: 'builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)\n    .AddJwtBearer(opts => { opts.Authority = "..."; });' },
    { name: 'AddJwtBearer()',        desc: 'Configure JWT validation — authority, audience, key.', example: 'opts.TokenValidationParameters = new() { ValidateIssuer = true, ValidIssuer = "..." };' },
    { name: '[Authorize]',           desc: 'Require authenticated user on controller/action/endpoint.', example: '[Authorize] public IActionResult Secret() => Ok("hello");' },
    { name: '[Authorize(Policy="")]', desc: 'Require a named authorization policy.', example: '[Authorize(Policy = "AdminOnly")] public IActionResult Admin() => Ok();' },
    { name: 'AddPolicy()',           desc: 'Define a named policy with requirements.', example: 'services.AddAuthorization(o => o.AddPolicy("AdminOnly",\n    p => p.RequireRole("Admin")));' },
    { name: 'RequireAuthorization()', desc: 'Apply auth to minimal API route or group.', example: 'app.MapGet("/secret", ...).RequireAuthorization("AdminOnly");' },
    { name: '[AllowAnonymous]',       desc: 'Bypass global auth policy for a specific endpoint.', example: '[AllowAnonymous] public IActionResult Health() => Ok();' },
    { name: 'HttpContext.User',       desc: 'ClaimsPrincipal for the current request.', example: 'var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;' },
    { name: 'Data Protection API',   desc: 'Encrypt/decrypt opaque tokens (cookie protection, anti-forgery).', example: 'var token = protector.Protect("secret");\nvar plain  = protector.Unprotect(token);' },
    { name: 'AddCors() / UseCors()',  desc: 'Configure cross-origin resource sharing policies.', example: 'builder.Services.AddCors(o => o.AddPolicy("AllowFE",\n    p => p.WithOrigins("https://app.example.com")));' },
    { name: 'AddRateLimiter()',       desc: 'Register rate limiting policies. Call UseRateLimiter() in pipeline.', example: 'builder.Services.AddRateLimiter(o =>\n    o.AddFixedWindowLimiter("fixed", opts => { opts.PermitLimit = 10; }));', tag: '.NET 7+' },
  ];

  efcoreEntries: CheatEntry[] = [
    { name: 'AddDbContext<T>()',  desc: 'Register DbContext as Scoped with a connection string.', example: 'builder.Services.AddDbContext<AppDbContext>(o =>\n    o.UseSqlServer(conn));' },
    { name: 'DbSet<T>',          desc: 'Represents a table — supports LINQ queries.', example: 'public DbSet<Product> Products { get; set; }' },
    { name: 'AsNoTracking()',     desc: 'Skip change tracking for read-only queries — faster.', example: 'var list = await db.Products.AsNoTracking().ToListAsync();' },
    { name: 'Include()',          desc: 'Eager-load a navigation property.', example: 'db.Orders.Include(o => o.Items).ThenInclude(i => i.Product)' },
    { name: 'SaveChangesAsync()', desc: 'Persist tracked changes to the database.', example: 'db.Products.Add(product);\nawait db.SaveChangesAsync();' },
    { name: 'dotnet ef migrations add', desc: 'Create a new migration from model changes.', example: 'dotnet ef migrations add AddProductCategory', tag: 'CLI' },
    { name: 'dotnet ef database update', desc: 'Apply pending migrations to the database.', example: 'dotnet ef database update', tag: 'CLI' },
    { name: 'ExecuteSqlRawAsync()', desc: 'Run raw SQL for bulk updates/deletes — bypasses EF tracking.', example: 'await db.Database.ExecuteSqlRawAsync("DELETE FROM Logs WHERE Date < {0}", cutoff);' },
    { name: 'IQueryable vs IEnumerable', desc: 'IQueryable translates to SQL; IEnumerable loads then filters in memory.', example: '// IQueryable — translated to SQL WHERE:\ndb.Products.Where(p => p.Price > 10)' },
    { name: 'Owned entity',        desc: 'Value object stored in the same table as the owner.', example: '[Owned] public class Address { public string Street { get; set; } = ""; }', tag: 'EF 2+' },
  ];

  httpclientEntries: CheatEntry[] = [
    { name: 'AddHttpClient<T>()',   desc: 'Register a typed HttpClient — handles lifetime/socket reuse.', example: 'builder.Services.AddHttpClient<WeatherClient>(c =>\n    c.BaseAddress = new Uri("https://api.weather.com"));' },
    { name: 'AddHttpClient("name")', desc: 'Register a named HttpClient resolved via IHttpClientFactory.', example: 'builder.Services.AddHttpClient("github", c =>\n    c.DefaultRequestHeaders.Add("User-Agent", "MyApp"));' },
    { name: 'IHttpClientFactory',  desc: 'Create short-lived HttpClient instances that reuse sockets.', example: 'var client = _factory.CreateClient("github");\nawait client.GetStringAsync("/repos");' },
    { name: 'AddStandardResilienceHandler()', desc: 'Polly-backed retry + circuit breaker + timeout policy.', example: 'builder.Services.AddHttpClient<ApiClient>().AddStandardResilienceHandler();', tag: '.NET 8+' },
    { name: 'GetFromJsonAsync<T>()', desc: 'GET and deserialise JSON in one call.', example: 'var product = await client.GetFromJsonAsync<Product>("/api/products/1");' },
    { name: 'PostAsJsonAsync()',     desc: 'POST a serialised object as JSON.', example: 'var response = await client.PostAsJsonAsync("/api/orders", order);' },
    { name: 'EnsureSuccessStatusCode()', desc: 'Throw HttpRequestException if the response is not 2xx.', example: 'response.EnsureSuccessStatusCode();' },
    { name: 'CancellationToken',    desc: 'Pass through from endpoint to HttpClient calls for client-disconnect propagation.', example: 'app.MapGet("/", async (HttpClient http, CancellationToken ct) =>\n    await http.GetFromJsonAsync<Product[]>("/api/products", ct));' },
    { name: 'DelegatingHandler',    desc: 'Custom message handler for cross-cutting concerns (auth headers, logging).', example: 'services.AddHttpClient<Client>().AddHttpMessageHandler<AuthHandler>();' },
  ];

  cliEntries: CheatEntry[] = [
    { name: 'dotnet new webapi',         desc: 'Scaffold a new ASP.NET Core Web API project.', example: 'dotnet new webapi -n MyApi --use-minimal-apis' },
    { name: 'dotnet add package',         desc: 'Add a NuGet package to the project.', example: 'dotnet add package Microsoft.EntityFrameworkCore.SqlServer' },
    { name: 'dotnet build',               desc: 'Compile the project.', example: 'dotnet build -c Release' },
    { name: 'dotnet run',                 desc: 'Build and run the app. Uses launchSettings.json.', example: 'dotnet run --launch-profile https' },
    { name: 'dotnet watch',               desc: 'Run with hot reload — restarts on file changes.', example: 'dotnet watch run' },
    { name: 'dotnet test',                desc: 'Run xUnit / NUnit tests.', example: 'dotnet test --logger trx --results-directory TestResults' },
    { name: 'dotnet publish',             desc: 'Publish for deployment.', example: 'dotnet publish -c Release -r linux-x64 --self-contained -o ./out' },
    { name: 'dotnet ef migrations add',   desc: 'Create an EF Core migration.', example: 'dotnet ef migrations add InitialCreate -p DataProject -s ApiProject' },
    { name: 'dotnet ef database update',  desc: 'Apply pending EF Core migrations.', example: 'dotnet ef database update' },
    { name: 'dotnet user-secrets set',    desc: 'Store a secret for local development (not committed).', example: 'dotnet user-secrets set "Jwt:Key" "super-secret-dev-key"' },
    { name: 'dotnet-counters monitor',    desc: 'Live process metrics (CPU, GC, requests).', example: 'dotnet-counters monitor --process-id 12345 System.Runtime' },
    { name: 'dotnet-trace collect',       desc: 'Collect a CPU/allocation trace for offline analysis.', example: 'dotnet-trace collect --process-id 12345 --profile cpu-sampling' },
  ];

  activeEntries = computed(() => {
    const all = this.entriesBySection[this.active()];
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) return all;
    return all.filter(e =>
      e.name.toLowerCase().includes(term) ||
      e.desc.toLowerCase().includes(term) ||
      e.example.toLowerCase().includes(term)
    );
  });

  private entriesBySection: Record<AnSection, CheatEntry[]> = {
    middleware:  this.middlewareEntries,
    minimal:     this.minimalEntries,
    di:          this.diEntries,
    auth:        this.authEntries,
    efcore:      this.efcoreEntries,
    httpclient:  this.httpclientEntries,
    cli:         this.cliEntries,
  };
}
