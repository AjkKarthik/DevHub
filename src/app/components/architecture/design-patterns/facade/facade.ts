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
