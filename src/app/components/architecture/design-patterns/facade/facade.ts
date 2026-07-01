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
  { name: 'Intent',    type: 'keyword',   desc: 'Provide a simplified interface to a complex subsystem — hiding its complexity behind a single entry point.' },
  { name: 'Facade',    type: 'class',     desc: 'The simplified surface that delegates to multiple subsystem classes without exposing them to clients.' },
  { name: 'Subsystem', type: 'class',     desc: 'The complex internal classes that implement the actual functionality — clients should not need to know them.' },
  { name: 'vs Adapter', type: 'keyword',  desc: 'Adapter changes an interface to match what clients expect. Facade creates a NEW simplified interface over a complex system.' },
  { name: 'vs Mediator', type: 'keyword', desc: 'Mediator coordinates subsystems with each other. Facade provides a simplified entry point FOR clients.' },
  { name: 'Decoupling', type: 'keyword',  desc: 'Clients depend only on the Facade — changing the subsystem internals does not affect client code.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Facade Pattern?',
    points: [
      'Facade provides a simplified interface to a complex subsystem of classes, libraries, or frameworks.',
      'It hides the internal complexity — clients call simple Facade methods instead of orchestrating many subsystem calls.',
      'The subsystem classes still exist and are fully functional; the Facade just adds a convenience layer.',
      'Facade does not prevent direct subsystem access for advanced users who need it.',
    ],
  },
  {
    heading: 'When to Use Facade',
    points: [
      'When a subsystem is complex and clients only ever need a small subset of its features.',
      'When you want to layer a system into tiers — use Facade as the entry point for each tier.',
      'When you want to decouple client code from subsystem internals (subsystem can evolve freely).',
      'When onboarding developers to a complex domain — Facade provides a clear starting point.',
    ],
  },
  {
    heading: 'Facade vs Adapter vs Mediator',
    points: [
      'Adapter: changes an existing interface to match the client\'s expectation (compatibility fix).',
      'Facade: defines a new simplified interface over a set of complex subsystem classes.',
      'Mediator: reduces coupling BETWEEN subsystem objects (they talk to each other through the mediator).',
      'Facade simplifies FOR clients; Mediator coordinates BETWEEN components.',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'HttpClient: a Facade over sockets, TLS, redirects, cookies, connection pooling.',
      'Entity Framework DbContext: Facade over connection management, change tracking, SQL generation.',
      'WebApplication.CreateBuilder() in ASP.NET Core: Facade over configuration, services, logging.',
      'Console class: Facade over Win32/Unix terminal APIs.',
    ],
  },
  {
    heading: 'Facade vs. Adapter — Different Intents, Similar Shape',
    points: [
      'Both Facade and Adapter wrap other code behind a simpler interface, which is why they are sometimes confused — but their INTENT differs: Adapter makes an incompatible interface compatible with what a client expects, while Facade simplifies a complex subsystem\'s interface without necessarily any incompatibility to resolve.',
      'A Facade does not need to expose every capability of the underlying subsystem — it deliberately exposes only a simplified subset covering the common use cases, while still allowing direct access to the subsystem\'s full interface for callers that genuinely need more granular control.',
      'Facade reduces coupling between client code and a subsystem\'s internal structure — client code depends only on the Facade\'s stable, simple interface, insulating it from internal subsystem changes as long as the Facade\'s own interface remains stable.',
      'A Facade should remain a thin coordination layer — if a Facade accumulates significant business logic of its own rather than simply coordinating calls to the underlying subsystem, it has effectively become a service in its own right, which may or may not be the intended design.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Order Checkout Facade',
    language: 'csharp',
    code: `// Complex subsystem classes (internal/hidden from clients)
internal class InventoryService
{
    public bool Reserve(string productId, int qty) { /* check stock */ return true; }
    public void Commit(string productId, int qty)  { /* reduce stock */ }
}

internal class PaymentGateway
{
    public string Charge(string cardToken, decimal amount) => "PAY-" + Guid.NewGuid();
}

internal class ShippingService
{
    public string CreateShipment(string orderId, Address address) => "SHIP-" + orderId;
}

internal class EmailService
{
    public void SendOrderConfirmation(string email, string orderId) =>
        Console.WriteLine($"Email sent to {email} for {orderId}");
}

// Facade — ONE simple method replaces 8+ subsystem calls
public class CheckoutFacade(
    InventoryService inventory,
    PaymentGateway   payment,
    ShippingService  shipping,
    EmailService     email)
{
    public async Task<CheckoutResult> CheckoutAsync(CartSummary cart, PaymentInfo payInfo)
    {
        // 1. Reserve inventory
        foreach (var item in cart.Items)
            if (!inventory.Reserve(item.ProductId, item.Qty))
                return CheckoutResult.Failure($"Out of stock: {item.ProductId}");

        // 2. Charge payment
        var paymentId = payment.Charge(payInfo.CardToken, cart.Total);

        // 3. Commit inventory
        foreach (var item in cart.Items)
            inventory.Commit(item.ProductId, item.Qty);

        // 4. Create shipment
        var shipmentId = shipping.CreateShipment(paymentId, payInfo.ShippingAddress);

        // 5. Send confirmation
        email.SendOrderConfirmation(payInfo.Email, paymentId);

        return CheckoutResult.Success(paymentId, shipmentId);
    }
}

// Client — one call does everything
var result = await checkout.CheckoutAsync(cart, paymentInfo);`,
  },
  {
    label: 'Media Conversion Facade',
    language: 'csharp',
    code: `// Complex subsystem
internal class VideoDecoder   { public byte[] Decode(string path) => File.ReadAllBytes(path); }
internal class AudioExtractor { public byte[] Extract(byte[] videoData) => videoData[1000..]; }
internal class AudioEncoder   { public byte[] Encode(byte[] audio, string format) => audio; }

// Facade simplifies media conversion
public class MediaFacade(VideoDecoder decoder, AudioExtractor extractor, AudioEncoder encoder)
{
    // "Extract audio as MP3" — 3 subsystem steps hidden behind 1 call
    public byte[] ExtractAudioAsMp3(string videoPath) =>
        encoder.Encode(extractor.Extract(decoder.Decode(videoPath)), "mp3");
}

// Client
var mp3 = mediaFacade.ExtractAudioAsMp3("lecture.mp4");
// No knowledge of VideoDecoder, AudioExtractor, or AudioEncoder`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Making the Facade the only way to access the subsystem',
    wrong: `// Marking all subsystem classes internal AND sealing them
// Advanced users cannot access the subsystem at all`,
    right: `// Subsystem classes remain accessible for advanced use cases
// Facade is the convenient default, not the enforced-only path`,
    explanation: 'Facade is a convenience layer, not a lock-in. Advanced clients may legitimately need direct subsystem access. Keep subsystem classes accessible even when providing a Facade.',
  },
  {
    title: 'Putting business logic inside the Facade',
    wrong: `public async Task<CheckoutResult> CheckoutAsync(CartSummary cart, PaymentInfo info)
{
    if (cart.Total > 10000) ApplyVolumeDiscount(cart); // business logic in facade!
    ...
}`,
    right: `// Facade orchestrates subsystem calls only
// Business rules belong in domain services or the subsystem itself`,
    explanation: 'Facade is an orchestration layer — it should coordinate subsystem calls in sequence, not contain business logic. Business rules in Facade make it a God object.',
  },
  {
    title: 'Confusing Facade with Adapter',
    wrong: `// "I need to simplify this interface" → "I'll use Adapter"`,
    right: `// Adapter: makes two EXISTING incompatible interfaces work together
// Facade: creates a NEW simple surface over a complex subsystem`,
    explanation: 'Adapter changes an interface to match an expected one. Facade introduces a new simplified interface. Adapter reconciles; Facade simplifies.',
  },
  {
    title: 'Creating a Facade with too many methods (God Facade)',
    wrong: `public class SystemFacade {
    // 40 methods covering every feature of every subsystem
}`,
    right: `// Keep Facade focused on the most common use cases
// Large facades should be split by domain (CheckoutFacade, ReportingFacade)`,
    explanation: 'A Facade that exposes everything is not simplified — it is just another God object. Keep each Facade focused on a coherent set of use cases for a specific client or workflow.',
  },
];

const challenge: Challenge = {
  title: 'Home Theater Facade',
  language: 'typescript',
  description: `Implement a home theater facade.
Subsystem: Projector (on/setInput), SoundSystem (on/setVolume), StreamingDevice (on/play).
Facade: HomeTheaterFacade with watchMovie(title) and endMovie() methods.
watchMovie should turn on all devices in the correct order.`,
  hints: [
    'Facade holds references to all subsystem objects',
    'watchMovie() calls 5-6 subsystem methods in order',
    'endMovie() turns everything off',
  ],
  starterCode: `class Projector {
  on() { console.log('Projector on'); }
  setInput(source: string) { console.log(\`Projector input: \${source}\`); }
  off() { console.log('Projector off'); }
}

class SoundSystem {
  on() { console.log('Sound on'); }
  setVolume(v: number) { console.log(\`Volume: \${v}\`); }
  off() { console.log('Sound off'); }
}

class StreamingDevice {
  on() { console.log('Streaming device on'); }
  play(title: string) { console.log(\`Playing: \${title}\`); }
  off() { console.log('Streaming device off'); }
}

// TODO: implement HomeTheaterFacade`,
  solution: `class Projector {
  on() { console.log('Projector on'); }
  setInput(source: string) { console.log(\`Projector input: \${source}\`); }
  off() { console.log('Projector off'); }
}

class SoundSystem {
  on() { console.log('Sound on'); }
  setVolume(v: number) { console.log(\`Volume: \${v}\`); }
  off() { console.log('Sound off'); }
}

class StreamingDevice {
  on() { console.log('Streaming device on'); }
  play(title: string) { console.log(\`Playing: \${title}\`); }
  off() { console.log('Streaming device off'); }
}

class HomeTheaterFacade {
  constructor(
    private projector: Projector,
    private sound: SoundSystem,
    private streaming: StreamingDevice
  ) {}

  watchMovie(title: string): void {
    console.log('--- Starting movie experience ---');
    this.projector.on();
    this.projector.setInput('HDMI');
    this.sound.on();
    this.sound.setVolume(25);
    this.streaming.on();
    this.streaming.play(title);
  }

  endMovie(): void {
    console.log('--- Shutting down ---');
    this.streaming.off();
    this.sound.off();
    this.projector.off();
  }
}

const theater = new HomeTheaterFacade(new Projector(), new SoundSystem(), new StreamingDevice());
theater.watchMovie('Inception');
theater.endMovie();`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does Facade provide that Adapter does not?',
    options: [
      'A way to make incompatible interfaces work together',
      'A new simplified interface over a complex subsystem (Adapter only changes an existing interface)',
      'Runtime behavior changes',
      'Thread safety for subsystem calls',
    ],
    answer: 1,
    explanation: 'Facade creates a NEW simplified interface designed for convenience. Adapter changes an EXISTING interface to match what clients expect. Facade simplifies complexity; Adapter reconciles incompatibility.',
  },
  {
    q: 'HttpClient in .NET is best described as which pattern?',
    options: ['Adapter', 'Proxy', 'Facade', 'Bridge'],
    answer: 2,
    explanation: 'HttpClient is a Facade over sockets, TLS handshake, HTTP protocol, connection pooling, redirects, and cookies. Clients call SendAsync() — none of that complexity is visible.',
  },
  {
    q: 'Should a Facade prevent advanced clients from accessing subsystem classes directly?',
    options: [
      'Yes — the Facade should be the only entry point',
      'No — Facade is a convenience layer; advanced clients may still use subsystem classes directly',
      'Only if the subsystem classes are marked internal',
      'Only in production builds',
    ],
    answer: 1,
    explanation: 'Facade is an optional convenience — not a lock-in. Advanced use cases may require direct subsystem access. The Facade provides a simplified default path without restricting the full API.',
  },
  { q: 'What is the Facade pattern and what does it provide?', options: ['A fake implementation of an interface for testing purposes', 'A structural pattern that provides a simplified interface to a complex subsystem, reducing coupling between clients and the subsystem', 'A decorative wrapper that adds visual presentation to data objects', 'A pattern for creating objects without exposing the creation logic'], answer: 1, explanation: 'Facade provides a simple, unified interface to a complex set of interfaces in a subsystem. The client uses only the Facade and does not need to know about the subsystem classes, their initialization order, or their dependencies. The Facade does not add new behavior; it delegates to subsystem classes. Benefits: simplifies client code, reduces learning curve for using a library, decouples clients from subsystem details so the subsystem can change without affecting clients that go through the Facade.' },
  { q: 'If a Facade only wraps ONE subsystem class instead of many, does it stop being a legitimate use of the Facade pattern?', options: ['Yes — Facade strictly requires wrapping at least three or more classes to qualify', 'No — the defining characteristic of Facade is providing a SIMPLIFIED interface over complexity, which can apply even to one class with a complicated API surface; the number of wrapped classes is incidental, not a requirement', 'A single-class wrapper is always better classified as a Proxy instead', 'Facade requires the wrapped classes to be in a different assembly'], answer: 1, explanation: 'Facade\'s defining trait is intent: hiding complexity behind a simpler interface, regardless of how many underlying classes that complexity happens to span. A single class with a genuinely complex, low-level API (many required setup calls, awkward ordering, verbose configuration) can legitimately be wrapped in a Facade that exposes just the 2-3 methods callers actually need — the pattern is about simplifying the CALLER\'s experience, not about a minimum count of wrapped classes.' },
  { q: 'When should you use Facade instead of directly using subsystem classes?', options: ['Always; direct use of subsystem classes is a code smell', 'When the subsystem is complex, when you want to decouple clients from subsystem internals, or when you need a simple entry point for the most common use cases', 'Only for third-party libraries; your own subsystems should never have facades', 'When the subsystem has more than ten classes'], answer: 1, explanation: 'Use Facade when: a subsystem has grown complex and client code initializing and coordinating many classes is error-prone. You want to decouple the client from subsystem implementation details so the subsystem can be refactored without updating all clients. You want to layer the system: the Facade serves as the public API for a layer; classes below it are internal. A library of many classes needs a simple getting-started experience. Direct subsystem use is fine for clients that need fine-grained control or advanced features not exposed by the Facade.' },
];

const qna: QnaItem[] = [
  {
    q: 'When should I split one Facade into multiple?',
    a: 'When a single Facade grows beyond a coherent set of use cases for one client type, split by domain or client role. For example: CheckoutFacade for the order flow, ReportingFacade for analytics, AdminFacade for management operations — each focused on one actor\'s needs.',
  },
  {
    q: 'Is DbContext in Entity Framework a Facade?',
    a: 'Yes — DbContext is a Facade over connection management, change tracking, identity mapping, query translation, and transaction management. You call context.SaveChanges() instead of managing all those subsystems yourself. EF also uses Repository and Unit of Work patterns internally.',
  },
  { q: 'How does Facade relate to the Principle of Least Knowledge (Law of Demeter)?', a: 'The Law of Demeter states that an object should talk only to its immediate collaborators: do not reach through objects to call their dependencies. Facade implements this principle at the package level: clients talk only to the Facade and do not reach into the subsystem classes the Facade orchestrates. Without Facade: the client calls subsystem class A, which returns subsystem class B, which the client then calls to get C. With Facade: the client calls the Facade method and gets the final result; the Facade handles all internal orchestration. This reduces coupling: the client does not know about B or C, only the Facade.' },
  { q: 'How is Facade used in API design for microservices?', a: 'The API Gateway pattern in microservices is an architectural Facade: one entry point for clients that aggregates calls to multiple backend services. The client calls POST /order on the API Gateway, which calls the inventory service, the payment service, and the notification service, returning a single consolidated response. Clients are shielded from the internal service decomposition; the subsystem can be split or merged without changing the client API. The API Gateway also handles cross-cutting concerns: authentication, rate limiting, logging. Backend for Frontend (BFF) is a variant: separate API Gateways (Facades) per client type (mobile vs. web) optimized for each client consumption pattern.' },
  { q: 'Can a Facade hide all of a subsystem or only part of it?', a: 'A Facade typically exposes the most common use cases but does not necessarily hide everything. Clients needing advanced control can bypass the Facade and use subsystem classes directly. The Facade is not a gatekeeper; it is a convenience layer. This is an important design decision: if the Facade is meant to be the only entry point (for security or modularity), subsystem classes should have package-private or internal visibility. If it is a convenience layer, subsystem classes remain accessible. Most frameworks provide both: a simple configuration API (facade) and direct access to lower-level components for advanced users.' },
  { q: 'What are the risks of an over-engineered Facade?', a: 'A Facade that tries to expose every feature of the subsystem ends up being as complex as the subsystem itself but with an extra layer of indirection. Signs of an over-engineered Facade: the Facade has many parameters mirroring subsystem configuration. The Facade needs frequent changes to expose new subsystem features. Clients regularly bypass the Facade because it does not expose what they need. Solution: keep the Facade lean — expose only the most common use cases. For advanced use, let clients use the subsystem directly. Periodically review whether the Facade is being used as intended or being circumvented, which signals the abstraction needs redesign.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Facade provides a new simplified interface over a complex subsystem — clients call one method instead of orchestrating many subsystem calls.',
  mustKnow: [
    'Facade creates a NEW simplified surface; it does not change existing interfaces (that\'s Adapter)',
    'Subsystem classes remain accessible — Facade is a convenience, not a lock-in',
    'Keep Facades thin: orchestration only, no business logic',
    '.NET examples: HttpClient, DbContext, Console, WebApplicationBuilder',
    'Split large Facades by domain; one God Facade defeats the purpose',
  ],
  interviewFocus: [
    'Facade vs Adapter — what is the key difference?',
    'Facade vs Mediator — what does each simplify?',
    'Should Facade prevent direct subsystem access?',
  ],
};

@Component({
  selector: 'app-dp-facade',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './facade.html',
  styleUrl: './facade.scss',
})
export class DpFacade {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
