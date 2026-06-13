import { Component, signal } from '@angular/core';

interface Step { title: string; body: string; code?: string; }
interface Project { title: string; icon: string; desc: string; tags: string[]; steps: Step[]; }

@Component({
  selector: 'app-aspnet-mini-projects',
  standalone: true,
  imports: [],
  templateUrl: './mini-projects.html',
  styleUrl: './mini-projects.scss',
})
export class AspnetMiniProjects {
  openIndex = signal<number | null>(null);
  toggle(i: number) { this.openIndex.update(n => n === i ? null : i); }

  projects: Project[] = [
    {
      title: 'Todo REST API',
      icon: '✅',
      desc: 'A complete CRUD REST API using Minimal APIs + EF Core SQLite — a realistic starting point for any new service.',
      tags: ['Minimal APIs', 'EF Core', 'SQLite', 'Validation'],
      steps: [
        { title: 'Scaffold & install packages', body: 'Create the project and add EF Core SQLite.',
          code: `dotnet new webapi -n TodoApi --use-minimal-apis
cd TodoApi
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design` },
        { title: 'Define the model and DbContext', body: 'Simple Todo entity with a required Title field.',
          code: `public class Todo {
    public int    Id        { get; set; }
    public string Title     { get; set; } = "";
    public bool   IsComplete { get; set; }
}

public class TodoDb(DbContextOptions<TodoDb> options) : DbContext(options) {
    public DbSet<Todo> Todos => Set<Todo>();
}

// Program.cs
builder.Services.AddDbContext<TodoDb>(opt => opt.UseSqlite("Data Source=todos.db"));` },
        { title: 'Map CRUD endpoints', body: 'Map all five endpoints using MapGroup for a clean /api/todos prefix.',
          code: `var todos = app.MapGroup("/api/todos");

todos.MapGet("/",      async (TodoDb db) => await db.Todos.ToListAsync());
todos.MapGet("/{id}", async (int id, TodoDb db) =>
    await db.Todos.FindAsync(id) is { } todo ? Results.Ok(todo) : Results.NotFound());
todos.MapPost("/", async (Todo todo, TodoDb db) => {
    db.Todos.Add(todo);
    await db.SaveChangesAsync();
    return Results.Created($"/api/todos/{todo.Id}", todo);
});
todos.MapPut("/{id}", async (int id, Todo input, TodoDb db) => {
    var todo = await db.Todos.FindAsync(id);
    if (todo is null) return Results.NotFound();
    todo.Title = input.Title;
    todo.IsComplete = input.IsComplete;
    await db.SaveChangesAsync();
    return Results.NoContent();
});
todos.MapDelete("/{id}", async (int id, TodoDb db) => {
    if (await db.Todos.FindAsync(id) is { } todo) {
        db.Todos.Remove(todo);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
    return Results.NotFound();
});` },
        { title: 'Run migrations and test', body: 'Create the database and test with curl.',
          code: `dotnet ef migrations add Init
dotnet ef database update
dotnet run

# Test:
curl -X POST http://localhost:5000/api/todos \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Buy milk","isComplete":false}'

curl http://localhost:5000/api/todos` },
      ],
    },
    {
      title: 'JWT Auth API',
      icon: '🔐',
      desc: 'Register → Login → protected endpoint pattern. Covers JWT generation, Bearer validation, and password hashing.',
      tags: ['JWT', 'Authentication', 'BCrypt', 'Minimal APIs'],
      steps: [
        { title: 'Install packages', body: 'JWT bearer authentication and a password hashing library.',
          code: `dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next` },
        { title: 'Configure JWT bearer', body: 'Register and validate JWTs using a symmetric key from config.',
          code: `var jwtKey = builder.Configuration["Jwt:Key"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts => {
        opts.TokenValidationParameters = new() {
            ValidateIssuer           = false,
            ValidateAudience         = false,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
// ...
app.UseAuthentication();
app.UseAuthorization();` },
        { title: 'Register and login endpoints', body: 'Hash passwords with BCrypt, issue JWTs on login.',
          code: `// Simple in-memory user store (replace with EF Core in prod)
var users = new List<(string Email, string Hash)>();

app.MapPost("/register", (RegisterDto dto) => {
    if (users.Any(u => u.Email == dto.Email)) return Results.Conflict("Email taken");
    users.Add((dto.Email, BCrypt.Net.BCrypt.HashPassword(dto.Password)));
    return Results.Ok("Registered");
});

app.MapPost("/login", (LoginDto dto) => {
    var user = users.FirstOrDefault(u => u.Email == dto.Email);
    if (user == default || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Hash))
        return Results.Unauthorized();

    var claims  = new[] { new Claim(ClaimTypes.Email, dto.Email) };
    var key     = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
    var creds   = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var token   = new JwtSecurityToken(expires: DateTime.UtcNow.AddHours(1), claims: claims, signingCredentials: creds);
    return Results.Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
});

app.MapGet("/me", (ClaimsPrincipal user) =>
    Results.Ok(new { email = user.FindFirst(ClaimTypes.Email)?.Value }))
   .RequireAuthorization();` },
        { title: 'Test with curl', body: 'Register, login, and hit the protected endpoint.',
          code: `# Register
curl -X POST http://localhost:5000/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"alice@example.com","password":"secret123"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:5000/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"alice@example.com","password":"secret123"}' | jq -r .token)

# Protected endpoint
curl http://localhost:5000/me -H "Authorization: Bearer \$TOKEN"` },
      ],
    },
    {
      title: 'Real-Time Notifications with SignalR',
      icon: '📡',
      desc: 'Push live notifications to connected browser clients from an API endpoint using SignalR hubs and IHubContext.',
      tags: ['SignalR', 'Real-time', 'JavaScript', 'IHubContext'],
      steps: [
        { title: 'Add SignalR and configure', body: 'SignalR is built into ASP.NET Core — no extra package needed.',
          code: `builder.Services.AddSignalR();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

app.MapHub<NotificationHub>("/hubs/notifications");` },
        { title: 'Create the hub', body: 'A simple hub that broadcasts to groups based on user ID.',
          code: `public class NotificationHub : Hub {
    public async Task Subscribe(string userId) {
        await Groups.AddToGroupAsync(Context.ConnectionId, userId);
        await Clients.Caller.SendAsync("Connected", $"Subscribed to {userId}");
    }
    public override async Task OnDisconnectedAsync(Exception? ex) {
        // Groups cleaned up automatically by SignalR on disconnect
        await base.OnDisconnectedAsync(ex);
    }
}` },
        { title: 'Push from an API endpoint', body: 'Use IHubContext<T> to push messages from any controller or endpoint.',
          code: `app.MapPost("/notify/{userId}", async (
    string userId, [FromBody] string message,
    IHubContext<NotificationHub> hub) =>
{
    await hub.Clients.Group(userId)
        .SendAsync("Notification", new { message, sentAt = DateTime.UtcNow });
    return Results.Ok();
}).RequireAuthorization("Admin");` },
        { title: 'JavaScript client', body: 'Connect from the browser using @microsoft/signalr.',
          code: `// npm install @microsoft/signalr
const conn = new signalR.HubConnectionBuilder()
    .withUrl("/hubs/notifications", { accessTokenFactory: () => getToken() })
    .withAutomaticReconnect()
    .build();

conn.on("Notification", ({ message, sentAt }) => {
    showToast(message, sentAt);
});

conn.on("Connected", (msg) => console.log(msg));

await conn.start();
await conn.invoke("Subscribe", currentUserId);` },
      ],
    },
    {
      title: 'Background Order Processor',
      icon: '⚙️',
      desc: 'A BackgroundService that reads orders from a Channel<T> queue and processes them asynchronously — the foundation of any in-process work queue.',
      tags: ['BackgroundService', 'Channel', 'IServiceScopeFactory', 'Queue'],
      steps: [
        { title: 'Define the channel and queue service', body: 'A singleton Channel<T> acts as the in-memory queue.',
          code: `public record OrderRequest(int OrderId, string CustomerId);

public class OrderQueue {
    private readonly Channel<OrderRequest> _channel =
        Channel.CreateBounded<OrderRequest>(new BoundedChannelOptions(500) {
            FullMode = BoundedChannelFullMode.Wait
        });

    public ChannelWriter<OrderRequest>  Writer => _channel.Writer;
    public ChannelReader<OrderRequest>  Reader => _channel.Reader;
}

// Registration (singleton — same channel instance everywhere)
builder.Services.AddSingleton<OrderQueue>();` },
        { title: 'Enqueue from an endpoint', body: 'Write to the channel from the API — fire and forget.',
          code: `app.MapPost("/orders", async ([FromBody] OrderRequest req, OrderQueue queue) => {
    await queue.Writer.WriteAsync(req);
    return Results.Accepted($"/orders/{req.OrderId}", new { queued = true });
});` },
        { title: 'Implement the BackgroundService', body: 'Read from the channel, create a DI scope per item, process.',
          code: `public class OrderProcessor(
    OrderQueue queue,
    IServiceScopeFactory factory,
    ILogger<OrderProcessor> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct) {
        await foreach (var req in queue.Reader.ReadAllAsync(ct)) {
            using var scope = factory.CreateScope();
            var processor   = scope.ServiceProvider
                .GetRequiredService<IOrderProcessingService>();
            try {
                await processor.ProcessAsync(req, ct);
                logger.LogInformation("Processed order {Id}", req.OrderId);
            }
            catch (Exception ex) {
                logger.LogError(ex, "Failed order {Id}", req.OrderId);
            }
        }
    }
}

builder.Services.AddHostedService<OrderProcessor>();
builder.Services.AddScoped<IOrderProcessingService, OrderProcessingService>();` },
        { title: 'Test the queue under load', body: 'Send 100 orders and watch the background service consume them.',
          code: `# Send 100 orders in parallel
for i in {1..100}; do
  curl -s -X POST http://localhost:5000/orders \\
    -H "Content-Type: application/json" \\
    -d "{\"orderId\": \$i, \"customerId\": \"cust-\$((i%10))\"}" &
done
wait

# Watch logs — the processor runs concurrently:
# info: Processed order 1
# info: Processed order 3
# info: Processed order 2` },
      ],
    },
  ];
}
