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
  { name: 'Intent',          type: 'keyword', desc: 'Use sharing to support large numbers of fine-grained objects efficiently — reduce memory by sharing common state.' },
  { name: 'Intrinsic State',  type: 'keyword', desc: 'State that is shared across many objects — stored inside the flyweight and never changes per-context.' },
  { name: 'Extrinsic State',  type: 'keyword', desc: 'State that varies per usage context — passed to flyweight methods at call time, NOT stored inside.' },
  { name: 'FlyweightFactory', type: 'class',   desc: 'Creates and caches flyweight instances; returns the same instance for the same intrinsic state.' },
  { name: 'string.Intern()',  type: 'method',  desc: '.NET string interning is Flyweight — identical strings share the same memory reference.' },
  { name: 'Use Case',         type: 'keyword', desc: 'Particle systems, text rendering (glyph shapes), game tiles, icon caches — millions of similar objects.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Flyweight Pattern?',
    points: [
      'Flyweight shares common (intrinsic) state among many fine-grained objects to reduce memory consumption.',
      'The key insight: if many objects share identical state, store that state once and share the reference.',
      'Per-instance (extrinsic) state is NOT stored in the flyweight — it is passed as method parameters.',
      'A FlyweightFactory caches flyweights by their intrinsic state and returns cached instances.',
    ],
  },
  {
    heading: 'Intrinsic vs Extrinsic State',
    points: [
      'Intrinsic: state that is the same for many objects — texture, glyph shape, color palette, sprite data.',
      'Extrinsic: state that is unique per instance — position (x, y), scale, rotation, hit points.',
      'Rule: intrinsic state goes inside the flyweight (shared); extrinsic state is passed in per-call.',
      'Misidentifying which state is intrinsic vs extrinsic is the most common design mistake.',
    ],
  },
  {
    heading: 'When to Use Flyweight',
    points: [
      'When you need to create a very large number of objects (thousands to millions).',
      'When most object state can be made extrinsic (passed in), leaving little intrinsic state to store.',
      'When object identity is not important — two objects with the same intrinsic state are interchangeable.',
      'Classic: rendering 100,000 trees on a terrain — each tree shares the same mesh/texture flyweight.',
    ],
  },
  {
    heading: '.NET Examples',
    points: [
      'string interning: string.Intern() stores one copy of each unique string; identical strings share it.',
      'Emoji/glyph rendering: one Glyph object per character shape, shared by all text using that character.',
      'Small-integer boxing caching (-128 to 127) is a JAVA-SPECIFIC optimization (Integer.valueOf()) — the CLR has no equivalent: every C# boxing operation allocates a new heap object even for the same small value, so this is NOT a .NET Flyweight example despite sometimes being described as one.',
      'Icon/image caches in UI frameworks: one Bitmap per icon type, shared across all toolbar buttons.',
    ],
  },
  {
    heading: 'Intrinsic vs. Extrinsic State — The Core Flyweight Distinction',
    points: [
      'Flyweight works by splitting an object\'s state into intrinsic state (shared, context-independent data stored once inside the flyweight, like a character glyph\'s shape) and extrinsic state (context-specific data supplied by the client at use time, like that character\'s position on screen).',
      'Only intrinsic state is actually shared between flyweight instances — extrinsic state must be passed in by the caller on every operation, meaning Flyweight trades some API complexity (callers must track and supply extrinsic state) for the memory savings of sharing intrinsic state.',
      'A Flyweight factory ensures identical intrinsic state maps to the SAME shared instance (via caching/interning) rather than creating a new object every time — without this factory-level deduplication, the pattern provides no actual memory benefit, since duplicate objects would still be created.',
      'Flyweight is only worth the added complexity when a system genuinely needs to create a very large number of similar objects (thousands of characters, particles, or map tiles) where the memory savings are substantial — for a small number of objects, the pattern\'s overhead is not justified by any meaningful memory benefit.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Particle System',
    language: 'csharp',
    code: `// Flyweight — shared intrinsic state (texture, color, shape)
public sealed class ParticleType(string texture, string color, string shape)
{
    public string Texture { get; } = texture;
    public string Color   { get; } = color;
    public string Shape   { get; } = shape;

    // Render uses extrinsic state (position, scale) passed in
    public void Render(float x, float y, float scale) =>
        Console.WriteLine($"{Shape}({Color}) @ ({x:F1},{y:F1}) ×{scale:F1} [{Texture}]");
}

// FlyweightFactory — returns cached instances
public sealed class ParticleFactory
{
    private readonly Dictionary<string, ParticleType> _cache = new();

    public ParticleType Get(string texture, string color, string shape)
    {
        var key = $"{texture}|{color}|{shape}";
        if (!_cache.TryGetValue(key, out var pt))
        {
            pt = new ParticleType(texture, color, shape);
            _cache[key] = pt;
            Console.WriteLine($"Created flyweight: {key}");
        }
        return pt; // same instance for same intrinsic state
    }

    public int CacheSize => _cache.Count;
}

// Particle — stores only extrinsic state + reference to shared flyweight
public record Particle(ParticleType Type, float X, float Y, float Scale);

// Simulation: 1,000,000 particles but only 3 flyweights
var factory = new ParticleFactory();
var particles = new List<Particle>(1_000_000);
var rnd = new Random(42);

for (int i = 0; i < 1_000_000; i++)
{
    var type = (i % 3) switch
    {
        0 => factory.Get("fire.png",  "red",   "circle"),
        1 => factory.Get("smoke.png", "grey",  "cloud"),
        _ => factory.Get("spark.png", "white", "star")
    };
    particles.Add(new Particle(type, rnd.NextSingle() * 1000, rnd.NextSingle() * 1000, 1.0f));
}

Console.WriteLine($"Particles: {particles.Count}, Flyweights: {factory.CacheSize}");
// Particles: 1000000, Flyweights: 3`,
  },
  {
    label: 'String Interning',
    language: 'csharp',
    code: `// String interning is Flyweight built into .NET
// string literals are automatically interned
string a = "hello";
string b = "hello";
Console.WriteLine(ReferenceEquals(a, b)); // True — same object!

// Dynamic strings are NOT automatically interned
string x = new string(new[] {'h','e','l','l','o'});
Console.WriteLine(ReferenceEquals(a, x)); // False — different objects

// Manually intern to share
string y = string.Intern(x);
Console.WriteLine(ReferenceEquals(a, y)); // True — shared via intern pool

// Custom icon cache — Flyweight for UI resources
public sealed class IconCache
{
    private readonly Dictionary<string, Bitmap> _cache = new();

    public Bitmap Get(string iconName)
    {
        if (!_cache.TryGetValue(iconName, out var bmp))
        {
            bmp = Bitmap.FromFile($"icons/{iconName}.png");
            _cache[iconName] = bmp;
        }
        return bmp; // same Bitmap instance reused across all buttons
    }
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Storing extrinsic state inside the flyweight',
    wrong: `public class Particle {
    public string Texture { get; set; } // intrinsic — ok
    public float  X       { get; set; } // extrinsic — should NOT be stored here
    public float  Y       { get; set; } // extrinsic — breaks sharing
}`,
    right: `// Flyweight stores only intrinsic state
// Extrinsic state is passed to Render(float x, float y)`,
    explanation: 'Storing extrinsic (per-instance) state inside the flyweight breaks sharing — each instance needs different X/Y, making every flyweight unique. The whole point is to share intrinsic state and pass extrinsic state per-call.',
  },
  {
    title: 'Using Flyweight for small numbers of objects',
    wrong: `// 10 objects with shared state — Flyweight is unnecessary complexity`,
    right: `// Use Flyweight only when objects number in thousands/millions
// and memory consumption is a measurable problem`,
    explanation: 'Flyweight adds significant complexity (factory, state separation, per-call parameters). It is only justified when you genuinely have a large number of objects and profiling shows memory is the bottleneck.',
  },
  {
    title: 'Making flyweights mutable',
    wrong: `public class GlyphFlyweight {
    public string Shape { get; set; } // mutable! changes affect ALL users
}`,
    right: `public sealed class GlyphFlyweight(string shape) {
    public string Shape { get; } = shape; // immutable — safe to share
}`,
    explanation: 'Shared flyweights MUST be immutable. If one client modifies the flyweight, every other client sharing it is affected. Intrinsic state must never change after creation.',
  },
  {
    title: 'Not using a factory to enforce sharing',
    wrong: `var glyph = new GlyphFlyweight("A"); // creates new instance every time`,
    right: `var glyph = glyphFactory.Get("A"); // returns cached instance`,
    explanation: 'Without a FlyweightFactory, callers will `new` up separate instances and there is no sharing. The factory is essential — it is the mechanism that enforces the shared-instance guarantee.',
  },
];

const challenge: Challenge = {
  title: 'Glyph Cache',
  language: 'typescript',
  description: `Implement a Flyweight for text rendering.
GlyphFlyweight holds intrinsic state: character, fontFamily, fontSize.
GlyphFactory caches by key and returns the same instance for the same character+font.
TextRenderer uses the factory to render text, passing extrinsic position per character.`,
  hints: [
    'Flyweight key = char + font + size (e.g. "A|Arial|12")',
    'draw(x, y) uses extrinsic position — NOT stored in flyweight',
    'Factory returns cached instance or creates new one',
  ],
  starterCode: `class GlyphFlyweight {
  constructor(
    public readonly char: string,
    public readonly font: string,
    public readonly size: number
  ) {}

  draw(x: number, y: number): void {
    // TODO: log rendering info using intrinsic + extrinsic state
  }
}

class GlyphFactory {
  private cache = new Map<string, GlyphFlyweight>();
  // TODO: implement get(char, font, size)
}`,
  solution: `class GlyphFlyweight {
  constructor(
    public readonly char: string,
    public readonly font: string,
    public readonly size: number
  ) {}

  draw(x: number, y: number): void {
    console.log(\`'\${this.char}' [\${this.font} \${this.size}px] at (\${x},\${y})\`);
  }
}

class GlyphFactory {
  private cache = new Map<string, GlyphFlyweight>();

  get(char: string, font: string, size: number): GlyphFlyweight {
    const key = \`\${char}|\${font}|\${size}\`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new GlyphFlyweight(char, font, size));
    }
    return this.cache.get(key)!;
  }

  get cacheSize(): number { return this.cache.size; }
}

const factory = new GlyphFactory();
const text = 'hello';
let x = 0;
for (const ch of text) {
  const glyph = factory.get(ch, 'Arial', 12);
  glyph.draw(x, 0);
  x += 8;
}
console.log(\`Flyweights created: \${factory.cacheSize}\`); // 4 (h,e,l,o — 'l' shared)`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is "intrinsic state" in the Flyweight pattern?',
    options: [
      'State that varies per instance and is passed as method parameters',
      'State that is shared across many instances and stored inside the flyweight',
      'State that is calculated on demand',
      'State that is serialized to disk',
    ],
    answer: 1,
    explanation: 'Intrinsic state is the shared, immutable state stored inside the flyweight (texture, glyph shape, color). Extrinsic state varies per usage (position, scale) and is passed as method parameters — never stored in the flyweight.',
  },
  {
    q: 'String interning in .NET (`string.Intern()`) is an example of Flyweight because:',
    options: [
      'It creates a new string object each time it is called',
      'It stores one copy of each unique string and returns the same reference for identical strings',
      'It compresses the string to reduce memory',
      'It converts strings to immutable byte arrays',
    ],
    answer: 1,
    explanation: 'String.Intern() maintains a pool of unique strings — if you intern "hello" twice, both return the same object reference. This is Flyweight: one shared instance per unique intrinsic state (the string value).',
  },
  {
    q: 'Why must flyweight objects be immutable?',
    options: [
      'Immutability makes them faster to create',
      'Because many clients share the same instance — mutation would affect all of them',
      'Flyweights are value types and cannot be mutated',
      'The FlyweightFactory requires immutable keys',
    ],
    answer: 1,
    explanation: 'Shared flyweights are used by many clients simultaneously. If one client mutates the flyweight, every other client is affected. Immutability is a correctness requirement, not a performance choice.',
  },
  { q: 'What is the Flyweight pattern and what is its primary goal?', options: ['A lightweight version of the Proxy pattern for simpler use cases', 'A structural pattern that uses sharing to efficiently support a large number of fine-grained objects by separating intrinsic (shared) state from extrinsic (unique per instance) state', 'A pattern that minimizes garbage collection pressure by reusing object references', 'A pattern for minimizing memory by using primitive types instead of objects'], answer: 1, explanation: 'Flyweight reduces memory consumption when the application creates a huge number of similar objects (thousands to millions). Key insight: many of these objects share the same data (intrinsic state). Flyweight extracts the shared data into one shared Flyweight object. Each object still has unique data (extrinsic state) but stores only that, not the shared data. Factory manages a pool of flyweights: same intrinsic state -> same flyweight. Example: text editor character objects store font/size/color in a shared flyweight; only position and content are per-character data.' },
  { q: 'What is the difference between intrinsic and extrinsic state in Flyweight?', options: ['Intrinsic state is stored in the database; extrinsic state is in memory', 'Intrinsic state is shared across many flyweight instances and stored in the flyweight object itself; extrinsic state is unique per use and passed to flyweight methods by the client', 'Intrinsic state changes frequently; extrinsic state is immutable', 'There is no difference; both terms describe the same thing'], answer: 1, explanation: 'Intrinsic state: shared, context-independent data stored in the flyweight. A character glyph flyweight stores the font face, size, and style — the same for all characters using that font. Immutable, shareable. Extrinsic state: context-dependent, unique per use. For the same glyph, the position on the page is different for every character instance. The client passes extrinsic state to the flyweight method: glyph.draw(position). The flyweight method uses both intrinsic state (already stored) and the extrinsic state passed by the caller to perform the operation.' },
  { q: 'When does it make sense to apply the Flyweight pattern?', options: ['When you have a small number of objects with very complex state', 'When an application creates a large number of similar objects (thousands+), consuming significant memory, and most of the state can be shared', 'When you need to cache expensive computation results across method calls', 'When object construction is slow and you want to pre-create a pool of instances'], answer: 1, explanation: 'Flyweight is justified only when: the application creates a very large number of objects. This number is too large for the available RAM. The objects contain duplicated state that can be extracted and shared. The application does not depend on object identity (shared flyweights cannot be distinguished from each other). Typical scenarios: game particle systems (thousands of bullets, trees), text rendering engines (thousands of character glyphs), map tiles (millions of terrain cells), network packet parsing. For small numbers of objects, Flyweight adds complexity without meaningful memory benefit.' },
];

const qna: QnaItem[] = [
  {
    q: 'Is Flyweight still relevant with modern RAM sizes?',
    a: 'Yes — in specific scenarios. Game particle systems (millions of bullets), text rendering engines (millions of glyphs), large-scale simulations, and UI icon caches all benefit significantly. At 1M objects × 1KB = 1GB vs. 1K flyweights × 1KB = 1MB, the saving is still dramatic even with cheap RAM.',
  },
  {
    q: 'How do I decide what is intrinsic vs extrinsic?',
    a: 'Ask: "Is this state the same for all instances that share the same flyweight?" If yes → intrinsic (store it). If it changes per instance or call-site → extrinsic (pass it as a parameter). Intrinsic state is what makes two instances "the same type"; extrinsic state is what makes them "different individuals".',
  },
  { q: 'How does Flyweight differ from Object Pool?', a: 'Object Pool and Flyweight both reuse objects to reduce creation cost, but for different reasons. Object Pool: reuses expensive-to-create objects (database connections, thread objects) to avoid creation overhead. The pool loans an object for exclusive use by one consumer, then reclaims it when done. Consumers do not share objects simultaneously. Flyweight: shares stateless or intrinsic-only objects among many consumers simultaneously. No exclusive loan; the same flyweight is used concurrently by many contexts. Object Pool is about avoiding creation cost; Flyweight is about reducing memory by sharing. Text character glyphs are flyweights (used simultaneously by many characters); database connections are pooled (used exclusively one at a time).' },
  { q: 'How do you implement a Flyweight Factory?', a: 'The Flyweight Factory maintains a pool (dictionary) mapping intrinsic state keys to flyweight instances. When a flyweight is requested: check if an instance with the given intrinsic state already exists in the pool. If yes, return the existing instance. If no, create a new flyweight with the given intrinsic state, store it in the pool, and return it. All clients that request the same intrinsic state get the same flyweight instance. The factory is the only place where flyweights are created. In thread-safe environments, synchronize factory access or use ConcurrentDictionary. The factory itself can be a static class, a singleton service, or an instance registered in DI.' },
  { q: 'What are the trade-offs of using the Flyweight pattern?', a: 'Trade-offs: Complexity: the pattern requires splitting object state into intrinsic and extrinsic, which is not always natural. Clients must pass extrinsic state on every method call instead of the object holding all its own state, changing the API. Thread safety: shared flyweights must be immutable or protected by synchronization. Debugging is harder because many logical objects share one physical object; inspecting a flyweight does not reveal which logical instance you are looking at. Memory savings may not materialize if intrinsic state is unique per instance (no actual sharing). Profile memory usage before applying Flyweight; it is often premature optimization for object counts in the hundreds.' },
  { q: 'What is a canonical example of Flyweight in a game engine?', a: 'In a game with a forest of 100,000 trees: each tree has a position, height, and growth stage (unique per tree = extrinsic state). But 100,000 trees share the same mesh geometry, textures, and shaders for each tree species (intrinsic state). Without Flyweight: 100,000 objects each containing the full mesh and texture data = hundreds of MB of RAM. With Flyweight: a TreeType flyweight per species stores mesh + texture. Each Tree object stores only position, height, growth stage, and a reference to the shared TreeType flyweight. To render: tree.render(canvas, position) passes extrinsic state to the flyweight. 100,000 instances, but only 5 TreeType flyweights in memory for 5 tree species.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Flyweight shares common (intrinsic) state across many fine-grained objects — the FlyweightFactory ensures one instance per unique state, dramatically reducing memory.',
  mustKnow: [
    'Intrinsic state: shared, immutable, stored in flyweight (texture, glyph shape)',
    'Extrinsic state: per-instance, passed as method parameters (position, scale)',
    'FlyweightFactory is mandatory — enforces the shared-instance contract',
    'Flyweights MUST be immutable — shared mutation corrupts all users',
    '.NET examples: string interning, icon caches, glyph rendering tables',
  ],
  interviewFocus: [
    'Intrinsic vs extrinsic state — how do you decide which is which?',
    'Why must flyweights be immutable?',
    'How does string interning relate to Flyweight?',
  ],
};

@Component({
  selector: 'app-dp-flyweight',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './flyweight.html',
  styleUrl: './flyweight.scss',
})
export class DpFlyweight {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
