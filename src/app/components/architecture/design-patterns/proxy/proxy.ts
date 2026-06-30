import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'Intent',          type: 'keyword',   desc: 'Provide a surrogate or placeholder for another object to control access to it.' },
  { name: 'Virtual Proxy',   type: 'keyword',   desc: 'Defers expensive object creation until it is actually needed (lazy initialization).' },
  { name: 'Caching Proxy',   type: 'keyword',   desc: 'Caches results of expensive operations and returns cached values on subsequent calls.' },
  { name: 'Protection Proxy', type: 'keyword',  desc: 'Controls access to the real subject based on caller permissions.' },
  { name: 'Remote Proxy',    type: 'keyword',   desc: 'Represents an object in a different process/machine (e.g., gRPC client stub, WCF proxy).' },
  { name: 'vs Decorator',    type: 'keyword',   desc: 'Decorator adds behaviour; Proxy controls access. Structurally similar but different intent.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Proxy Pattern?',
    points: [
      'Proxy provides a surrogate that controls access to another object (the real subject).',
      'The proxy and the real subject implement the same interface — clients cannot tell them apart.',
      'The proxy decides whether, when, and how to forward calls to the real subject.',
      'Four main proxy types: Virtual, Caching, Protection, and Remote — all share the same structure.',
    ],
  },
  {
    heading: 'Four Proxy Types',
    points: [
      'Virtual Proxy: defers creation of an expensive object until first use (lazy loading).',
      'Caching Proxy: remembers results of expensive calls; returns cached data on repeat calls.',
      'Protection Proxy: checks permissions before forwarding the call — throws if unauthorised.',
      'Remote Proxy: marshals calls to an object in a different process or machine (gRPC stubs, WCF).',
    ],
  },
  {
    heading: 'Proxy vs Decorator vs Adapter',
    points: [
      'Proxy: same interface; purpose is ACCESS CONTROL (lazy, cache, security, remote).',
      'Decorator: same interface; purpose is ADDING BEHAVIOUR (logging, retry, validation).',
      'Adapter: different interface; purpose is TRANSLATION between incompatible interfaces.',
      'Proxy often manages the real subject\'s lifetime; Decorator never does.',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'EF Core lazy loading proxies: navigation property returns a proxy that loads data on first access.',
      'gRPC client stubs: generated stub is a Remote Proxy that marshals calls over the network.',
      'IMemoryCache wrapping: CachingProxy pattern over any IService.',
      'Castle DynamicProxy / DispatchProxy: runtime-generated proxies for AOP (logging, auth).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Caching Proxy',
    language: 'csharp',
    code: `// Subject interface
public interface IProductRepository
{
    Task<IReadOnlyList<Product>> GetAllAsync();
    Task<Product?> GetByIdAsync(int id);
}

// Real subject — expensive (DB calls)
public class ProductRepository(AppDbContext db) : IProductRepository
{
    public async Task<IReadOnlyList<Product>> GetAllAsync() =>
        await db.Products.AsNoTracking().ToListAsync();

    public async Task<Product?> GetByIdAsync(int id) =>
        await db.Products.FindAsync(id);
}

// Caching Proxy — same interface, intercepts and caches
public class CachingProductRepository(
    IProductRepository inner,
    IMemoryCache       cache) : IProductRepository
{
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(5);

    public async Task<IReadOnlyList<Product>> GetAllAsync() =>
        await cache.GetOrCreateAsync("products:all", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = Ttl;
            return await inner.GetAllAsync();
        }) ?? [];

    public async Task<Product?> GetByIdAsync(int id) =>
        await cache.GetOrCreateAsync($"products:{id}", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = Ttl;
            return await inner.GetByIdAsync(id);
        });
}

// DI — transparent to clients
builder.Services.AddScoped<ProductRepository>();
builder.Services.AddScoped<IProductRepository>(sp =>
    new CachingProductRepository(
        sp.GetRequiredService<ProductRepository>(),
        sp.GetRequiredService<IMemoryCache>()));`,
  },
  {
    label: 'Protection Proxy',
    language: 'csharp',
    code: `public interface IDocumentService
{
    string Read(int docId);
    void   Delete(int docId);
}

public class DocumentService : IDocumentService
{
    public string Read(int docId)   => $"Document #{docId} contents";
    public void   Delete(int docId) => Console.WriteLine($"Deleted #{docId}");
}

// Protection Proxy — checks role before forwarding
public class SecureDocumentService(IDocumentService inner, ICurrentUser user)
    : IDocumentService
{
    public string Read(int docId)
    {
        // All authenticated users can read
        if (!user.IsAuthenticated)
            throw new UnauthorizedAccessException("Login required.");
        return inner.Read(docId);
    }

    public void Delete(int docId)
    {
        // Only admins can delete
        if (!user.IsInRole("Admin"))
            throw new UnauthorizedAccessException("Admin role required.");
        inner.Delete(docId);
    }
}

// Virtual Proxy — lazy initialization
public class LazyImageProxy(string imagePath) : IImage
{
    private Image? _realImage;

    // Image is only loaded when first displayed
    public void Display()
    {
        _realImage ??= new Image(imagePath); // expensive: load from disk
        _realImage.Display();
    }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Confusing Proxy with Decorator',
    wrong: `// "I want to add caching" → "that's a Decorator"
// "I want to control access" → "that's a Proxy"
// The structural difference is subtle — intent is what matters`,
    right: `// Proxy: controls WHETHER and WHEN the real subject is called
// Decorator: always calls through and adds behaviour around the call`,
    explanation: 'Both wrap the same interface. The key difference is intent: Proxy controls access (lazy, cache, auth, remote); Decorator adds behaviour (logging, retry, validation). Proxy often manages the subject\'s lifetime; Decorator never does.',
  },
  {
    title: 'Letting the proxy leak the real subject',
    wrong: `public class CachingProxy(IService inner) : IService {
    public IService Inner => inner; // exposes real subject — breaks encapsulation
}`,
    right: `// The proxy hides the real subject completely
// Clients should not be able to bypass the proxy`,
    explanation: 'Exposing the real subject defeats the proxy\'s purpose — callers can bypass the cache, security check, or lazy loader. The proxy must be a complete, opaque surrogate.',
  },
  {
    title: 'Using a caching proxy without cache invalidation',
    wrong: `// Cache entries never expire or get invalidated
// Stale data is returned indefinitely after updates`,
    right: `// Always set TTL: entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
// And invalidate on write: cache.Remove("products:all");`,
    explanation: 'A caching proxy without invalidation returns stale data forever. Every cached entry needs a TTL, and write operations must remove or update relevant cache entries.',
  },
  {
    title: 'Creating a new real subject for every proxy call',
    wrong: `public string Read(int docId) {
    var real = new DocumentService(); // creates a new instance every call!
    return real.Read(docId);
}`,
    right: `// Inject the real subject once via constructor
public SecureDocumentService(IDocumentService inner, ...) { _inner = inner; }`,
    explanation: 'The proxy holds ONE reference to the real subject (or lazily initialises it once). Creating a new real subject per call eliminates any benefit and defeats lazy/caching proxies.',
  },
];

const challenge: Challenge = {
  title: 'Lazy Config Proxy',
  language: 'typescript',
  description: `Implement a Virtual Proxy for a configuration loader.
IConfigService has getValue(key: string): string.
RealConfigService simulates expensive initialization (logs "Loading config...").
LazyConfigProxy defers creation of RealConfigService until first getValue() call.`,
  hints: [
    'LazyConfigProxy holds a private _real: RealConfigService | null = null',
    'On first call, create RealConfigService and store it',
    'Subsequent calls reuse the same instance',
  ],
  starterCode: `interface IConfigService {
  getValue(key: string): string;
}

class RealConfigService implements IConfigService {
  constructor() {
    console.log('Loading config... (expensive!)');
  }
  getValue(key: string): string {
    return \`value_for_\${key}\`;
  }
}

class LazyConfigProxy implements IConfigService {
  // TODO: defer RealConfigService creation until first use
}`,
  solution: `interface IConfigService {
  getValue(key: string): string;
}

class RealConfigService implements IConfigService {
  constructor() {
    console.log('Loading config... (expensive!)');
  }
  getValue(key: string): string {
    return \`value_for_\${key}\`;
  }
}

class LazyConfigProxy implements IConfigService {
  private _real: RealConfigService | null = null;

  getValue(key: string): string {
    if (!this._real) {
      this._real = new RealConfigService(); // only created here
    }
    return this._real.getValue(key);
  }
}

const config: IConfigService = new LazyConfigProxy();
console.log('Proxy created — no loading yet');
console.log(config.getValue('theme'));  // Loading config...  value_for_theme
console.log(config.getValue('lang'));   // No loading — reuses same instance`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which type of proxy defers creation of an expensive object until it is first needed?',
    options: ['Protection Proxy', 'Remote Proxy', 'Virtual Proxy', 'Caching Proxy'],
    answer: 2,
    explanation: 'Virtual Proxy delays the creation (instantiation) of a heavyweight object until the client actually uses it. EF Core lazy loading proxies are a classic Virtual Proxy — navigation properties are not loaded until accessed.',
  },
  {
    q: 'How does Proxy differ from Decorator structurally?',
    options: [
      'Proxy uses a different interface than the real subject; Decorator uses the same interface',
      'They are structurally identical — the difference is intent (access control vs adding behaviour)',
      'Decorator wraps the subject; Proxy does not',
      'Proxy is always generated at runtime; Decorator is always written by hand',
    ],
    answer: 1,
    explanation: 'Proxy and Decorator are structurally identical — both implement the same interface as the wrapped object. The distinction is entirely in intent: Proxy controls access; Decorator adds/enhances behaviour.',
  },
  {
    q: 'EF Core lazy loading proxies are an example of which proxy type?',
    options: ['Remote Proxy', 'Protection Proxy', 'Caching Proxy', 'Virtual Proxy'],
    answer: 3,
    explanation: 'EF Core lazy loading proxies are Virtual Proxies. Navigation properties return a proxy; the actual database query is deferred until the property is first accessed. The proxy controls when the expensive DB call happens.',
  },
  { q: 'What is the Proxy pattern and what types of proxies exist?', options: ['A network proxy that intercepts HTTP traffic between client and server', 'A structural pattern that provides a surrogate or placeholder for another object, controlling access to it; types include virtual, protection, remote, caching, and logging proxies', 'A pattern for passing objects indirectly via pointer wrappers', 'An API gateway pattern for routing service requests in microservices'], answer: 1, explanation: 'Proxy provides an object that controls access to a real service object. Both implement the same interface so the proxy is transparent to clients. Proxy types: Virtual Proxy: defers expensive object creation until first use (lazy initialization). Protection Proxy: controls access based on permissions (is the caller authorized?). Remote Proxy: local representative of an object in another address space (RPC stub). Caching Proxy: caches results of expensive operations and returns cached values to avoid recomputation. Smart Reference Proxy: adds behavior like reference counting, logging, or thread safety around the real object.' },
  { q: 'How does Proxy differ from Decorator?', options: ['Proxy wraps one object; Decorator wraps a chain of objects', 'Both wrap objects implementing the same interface; Proxy controls access or lifecycle of the real object (often managing its creation); Decorator adds new behavior by calling the wrapped object with no lifecycle control', 'Proxy is a structural pattern; Decorator is a behavioral pattern and they never overlap', 'Decorator requires the client to know about wrapping; Proxy is always transparent'], answer: 1, explanation: 'The structural difference is subtle: both implement the same interface and wrap a subject. The difference is intent. Proxy manages access and lifecycle: a Virtual Proxy creates the real object lazily. A Protection Proxy checks authorization. The real object may not exist at all until the Proxy decides to create it. Decorator: the real object already exists and is passed to the Decorator. Decorator adds behavior around method calls (log before, retry after). Proxy often controls whether the call reaches the real object at all. In practice, the boundary blurs: a caching Proxy and a caching Decorator look structurally identical.' },
  { q: 'What is a Virtual Proxy and what problem does it solve?', options: ['A proxy that uses virtual methods for all interface methods', 'A proxy that defers the instantiation of an expensive object until the moment it is first actually needed', 'A proxy that connects to a virtual machine for remote execution', 'A placeholder for a DNS virtual IP address'], answer: 1, explanation: 'Virtual Proxy implements lazy initialization: create the real object only when first accessed. If the object is large or expensive and may never be used, a Virtual Proxy avoids the upfront cost. Example: an ImageProxy that holds only the filename. When draw() is called for the first time, it loads the full image from disk and delegates. Subsequent calls use the already-loaded image. ORM frameworks use Virtual Proxies for lazy loading: a navigation property (Order.Customer) is a proxy that loads the Customer from the database only when the Customer property is first accessed.' },
];

const qna: QnaItem[] = [
  {
    q: 'How does DispatchProxy in .NET work?',
    a: 'DispatchProxy generates a runtime proxy class that implements a given interface. You override Invoke() to intercept all method calls — enabling logging, authorization, or caching for every method without writing individual wrapper methods. Castle DynamicProxy and Moq use similar mechanisms.',
  },
  {
    q: 'Should I use a caching proxy or a caching decorator?',
    a: 'Both achieve the same result — the distinction is naming convention. "Caching proxy" emphasises that it controls access to the real service (returning cached data instead of forwarding). "Caching decorator" emphasises that it adds caching behaviour around the call. In practice, they are the same implementation.',
  },
  { q: 'How is Protection Proxy used for authorization?', a: 'A Protection Proxy wraps a service and checks access rights before delegating. Example: SecureOrderService wraps IOrderService. In PlaceOrder(command): check if the current user has the ORDER_WRITE permission. If not, throw UnauthorizedException. If yes, delegate to the real orderService.PlaceOrder(command). This keeps authorization logic out of the real service, which focuses only on business logic. The real service is tested in isolation without authorization concerns. The proxy is tested to verify it blocks unauthorized callers. Stack multiple proxies: a LoggingOrderProxy wraps a SecurityOrderProxy wraps the real OrderService. Each adds one concern via composition.' },
  { q: 'How do ORM frameworks like Entity Framework use Proxy objects?', a: 'Entity Framework Core uses proxies for lazy loading navigation properties. When a query loads an entity, navigation properties (Order.OrderItems, Customer.Address) are not immediately loaded. EF Core creates a dynamic proxy class that inherits from your entity class. The proxy overrides the navigation property getters: on first access, it runs an additional SQL query to load the related entities, then returns them. This is a Virtual Proxy created dynamically by the ORM at runtime. To enable: services.AddDbContext<AppDbContext>(opt => opt.UseLazyLoadingProxies()). The entity class must have virtual navigation properties for the proxy to override.' },
  { q: 'What is the Smart Reference Proxy and how is it used?', a: 'A Smart Reference Proxy adds behavior around object access without the client knowing. Examples: reference counting proxy: tracks how many clients hold a reference to the real object; when the count drops to zero, the proxy releases the real object. Thread-safe proxy: wraps all method calls with a lock to make a non-thread-safe service thread-safe transparently. Null safety proxy: checks for null before delegating and returns safe defaults on null. COM objects in Windows use reference counting proxies. C++ shared_ptr is a Smart Reference that counts references and deletes the managed object when the count reaches zero. .NET COM interop wrappers are Smart Reference Proxies managing native object lifetime.' },
  { q: 'How does Proxy interact with dependency injection?', a: 'Proxies integrate with DI by registering the proxy as the implementation for an interface while the real service is injected into the proxy. Example: register IOrderService with a decorator (proxy) in DI: services.AddScoped<OrderService>(); services.AddScoped<IOrderService>(sp => new LoggingOrderProxy(sp.GetRequiredService<OrderService>())). All code that depends on IOrderService receives the proxy transparently. This pattern enables transparent cross-cutting concern application: all callers get logging, caching, or authorization without code change. .NET provides Scrutor library and ASP.NET Core middleware pipeline as higher-level alternatives to manual proxy DI wiring.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Proxy provides a surrogate that controls access to the real subject — four types: Virtual (lazy), Caching, Protection (auth), and Remote (network).',
  mustKnow: [
    'Virtual Proxy: defers expensive creation until first use',
    'Caching Proxy: returns cached results to avoid repeat expensive calls',
    'Protection Proxy: checks permissions before forwarding the call',
    'Remote Proxy: represents an object on a different machine (gRPC stubs)',
    'Proxy vs Decorator: same structure, different intent — access control vs added behaviour',
  ],
  interviewFocus: [
    'What are the four proxy types and when would you use each?',
    'How does Proxy differ from Decorator?',
    'How would you implement a caching proxy in ASP.NET Core DI?',
  ],
};

@Component({
  selector: 'app-dp-proxy',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './proxy.html',
  styleUrl: './proxy.scss',
})
export class DpProxy {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
