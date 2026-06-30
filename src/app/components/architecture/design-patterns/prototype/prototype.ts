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
  { name: 'Intent',       type: 'keyword',   desc: 'Create new objects by copying (cloning) an existing object rather than calling a constructor.' },
  { name: 'ICloneable',   type: 'interface', desc: '.NET interface with Clone() method — but it does not specify shallow vs deep, so often avoided in favor of custom Clone().' },
  { name: 'Shallow Copy',  type: 'keyword',  desc: 'Copies value types and reference pointers — both original and clone share the same referenced objects.' },
  { name: 'Deep Copy',     type: 'keyword',  desc: 'Recursively copies all referenced objects — clone is fully independent from the original.' },
  { name: 'Prototype Registry', type: 'class', desc: 'A dictionary of named prototypes; clients clone from the registry instead of new-ing up objects.' },
  { name: 'MemberwiseClone', type: 'method', desc: 'Protected .NET method that performs a shallow copy — starting point for custom Clone() implementations.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Prototype Pattern?',
    points: [
      'Prototype creates new objects by cloning an existing "prototype" instance instead of using a constructor.',
      'The cloned object starts with the same state as the original, which you then modify as needed.',
      'Useful when object construction is expensive (database lookup, heavy computation) and cloning is cheaper.',
      'Also useful when the exact type of the object to create is not known at compile time.',
    ],
  },
  {
    heading: 'Shallow vs Deep Copy',
    points: [
      'Shallow copy: copies primitive/value-type fields by value, reference-type fields by reference — original and clone share sub-objects.',
      'Deep copy: recursively copies all referenced objects — clone is completely independent.',
      'MemberwiseClone() in .NET always produces a shallow copy — deep copy requires manual implementation.',
      'For immutable sub-objects, shallow copy is safe. For mutable sub-objects, deep copy is required to avoid shared state bugs.',
    ],
  },
  {
    heading: 'Prototype Registry',
    points: [
      'A registry stores named prototype instances that clients clone on demand.',
      'Clients call registry.Get("template-name").Clone() instead of new SpecificType().',
      'Decouples clients from concrete types — client never references the class name directly.',
      'Common for document templates, game entity prefabs, and configuration presets.',
    ],
  },
  {
    heading: '.NET Context',
    points: [
      'ICloneable interface exists but is considered poorly designed — it does not specify shallow vs deep.',
      'Prefer a custom Clone() method or copy constructor with explicit semantics.',
      'Record types support `with` expressions for non-destructive mutation — a modern shallow-clone pattern.',
      'Array.Copy(), List<T> copy constructor, and JSON serialization round-trip are common deep-copy techniques.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Custom Clone',
    language: 'csharp',
    code: `// Prototype with explicit shallow and deep clone
public class EmailTemplate
{
    public string Subject { get; set; } = "";
    public string Body    { get; set; } = "";
    public List<string> Recipients { get; set; } = new();

    // Shallow clone — Recipients list is shared
    public EmailTemplate ShallowClone() =>
        (EmailTemplate)MemberwiseClone();

    // Deep clone — Recipients list is independent
    public EmailTemplate DeepClone() => new()
    {
        Subject    = Subject,
        Body       = Body,
        Recipients = new List<string>(Recipients)
    };
}

// Usage
var welcome = new EmailTemplate
{
    Subject = "Welcome!",
    Body    = "Hi {name}, welcome to DevHub!",
    Recipients = ["admin@devhub.io"]
};

// Deep clone for each send job
var invite = welcome.DeepClone();
invite.Subject = "You're invited!";
invite.Recipients.Add("user@example.com");

// Original unaffected
Console.WriteLine(welcome.Recipients.Count); // 1`,
  },
  {
    label: 'Record with-expression',
    language: 'csharp',
    code: `// Modern .NET: record types enable Prototype via 'with'
public record NotificationConfig(
    string Channel,
    int    RetryCount,
    bool   SuppressErrors,
    string FromAddress);

// Base config (the "prototype")
var baseConfig = new NotificationConfig(
    Channel:       "email",
    RetryCount:    3,
    SuppressErrors: false,
    FromAddress:   "noreply@devhub.io");

// Clone + modify — original is unchanged
var urgentConfig = baseConfig with { RetryCount = 5, SuppressErrors = false };
var silentConfig = baseConfig with { SuppressErrors = true, RetryCount = 1 };

// Prototype Registry using a dictionary
var registry = new Dictionary<string, NotificationConfig>
{
    ["urgent"] = urgentConfig,
    ["silent"] = silentConfig,
    ["default"] = baseConfig
};

// Clients clone from registry
var config = registry["urgent"] with { FromAddress = "alerts@devhub.io" };`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Shallow copying mutable reference types and expecting independence',
    wrong: `var clone = (EmailTemplate)original.MemberwiseClone();
clone.Recipients.Add("new@user.com"); // also adds to original!`,
    right: `var clone = original.DeepClone(); // new List<string>(original.Recipients)
clone.Recipients.Add("new@user.com"); // original untouched`,
    explanation: 'MemberwiseClone produces a shallow copy. Mutable collections (List, Dictionary, arrays) are shared between original and clone. Always deep-copy mutable sub-objects.',
  },
  {
    title: 'Implementing ICloneable returning object',
    wrong: `public object Clone() => MemberwiseClone(); // caller must cast`,
    right: `public EmailTemplate Clone() => new() { Subject = Subject, Body = Body, Recipients = new(Recipients) };`,
    explanation: 'ICloneable.Clone() returns object, forcing callers to cast. Prefer a strongly-typed Clone() method that clearly specifies shallow vs deep semantics.',
  },
  {
    title: 'Using Prototype when construction is cheap',
    wrong: `// Cloning a simple POCO with 3 properties
var clone = original.Clone();`,
    right: `// Just use a constructor or record with-expression for simple objects
var clone = original with { Name = "Updated" };`,
    explanation: 'Prototype is most valuable when construction is expensive (loading from DB, complex initialization). For simple objects, a constructor or `with` expression is clearer.',
  },
  {
    title: 'Forgetting to clone nested prototypes',
    wrong: `public Tree DeepClone() => new() { Value = Value, Children = Children }; // Children still shared`,
    right: `public Tree DeepClone() => new() { Value = Value, Children = Children.Select(c => c.DeepClone()).ToList() };`,
    explanation: 'Deep clone must recursively clone all nested objects that implement their own state. Missing a level creates partial independence and subtle shared-state bugs.',
  },
];

const challenge: Challenge = {
  title: 'Config Template Registry',
  language: 'typescript',
  description: `Implement a Prototype Registry for server configurations.
ServerConfig has: host, port, maxConnections, tags (string[]).
The registry stores named templates. Clients call clone(name) to get an independent copy.
Modifying the clone's tags must NOT affect the original template.`,
  hints: [
    'clone() must deep-copy the tags array (spread or slice)',
    'Registry stores prototype instances by name',
    'Return a new object, not a reference',
  ],
  starterCode: `interface ServerConfig {
  host: string;
  port: number;
  maxConnections: number;
  tags: string[];
}

class ConfigRegistry {
  private templates = new Map<string, ServerConfig>();

  register(name: string, config: ServerConfig): void {
    // TODO
  }

  clone(name: string): ServerConfig {
    // TODO: return deep copy
  }
}`,
  solution: `interface ServerConfig {
  host: string;
  port: number;
  maxConnections: number;
  tags: string[];
}

class ConfigRegistry {
  private templates = new Map<string, ServerConfig>();

  register(name: string, config: ServerConfig): void {
    this.templates.set(name, config);
  }

  clone(name: string): ServerConfig {
    const t = this.templates.get(name);
    if (!t) throw new Error(\`Unknown template: \${name}\`);
    return { ...t, tags: [...t.tags] }; // deep copy tags
  }
}

const registry = new ConfigRegistry();
registry.register('web', { host: 'localhost', port: 80, maxConnections: 100, tags: ['http'] });

const prod = registry.clone('web');
prod.host = 'prod.example.com';
prod.tags.push('production');

const dev = registry.clone('web');
dev.port = 3000;

const webTemplate = registry.clone('web');
console.log(webTemplate.tags); // ['http'] — original unchanged
console.log(prod.tags);        // ['http', 'production']`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is the key difference between shallow copy and deep copy?',
    options: [
      'Shallow copy duplicates only the object header; deep copy duplicates the full object',
      'Shallow copy copies value types and reference pointers; deep copy recursively copies all referenced objects',
      'Shallow copy is faster but less accurate; deep copy is slower and more accurate',
      'There is no functional difference — only performance differs',
    ],
    answer: 1,
    explanation: 'Shallow copy: value types are copied by value, but reference-type fields still point to the same objects as the original. Deep copy: every referenced object is also recursively cloned, producing full independence.',
  },
  {
    q: 'What does `MemberwiseClone()` in .NET produce?',
    options: ['A deep copy', 'A shallow copy', 'A serialized copy', 'A reference to the same object'],
    answer: 1,
    explanation: 'MemberwiseClone() is a protected method that always produces a shallow copy — value types are copied, but reference-type fields point to the same objects. Deep copy requires manual implementation.',
  },
  {
    q: 'C# record `with` expressions are related to which pattern?',
    options: ['Builder', 'Decorator', 'Prototype', 'Flyweight'],
    answer: 2,
    explanation: 'Record `with` expressions are a language-level shallow-clone-and-modify — the prototype pattern made idiomatic. `var b = a with { X = newValue }` clones `a` and overrides `X`.',
  },
  { q: 'What is the Prototype pattern and what does it provide?', options: ['A template or blueprint class that cannot be instantiated directly', 'A creational pattern that creates new objects by cloning (copying) an existing object, avoiding subclass-based instantiation when direct construction is expensive or inconvenient', 'A design pattern used exclusively for prototyping software before production', 'A pattern for creating singleton instances shared across the application'], answer: 1, explanation: 'Prototype creates a new object by copying an existing one (the prototype) rather than constructing a new object from scratch. Useful when: object construction is expensive or complex (large graph, network request). The class is not known at compile time. You want to create variations of an object with pre-configured state. JavaScript uses Prototype as a language-level object model (prototype chain). Java has Cloneable/clone(). C# uses ICloneable or copy constructors. The pattern lets a client create new objects of any type without knowing the concrete class: just call prototype.clone().' },
  { q: 'What is the difference between shallow copy and deep copy in Prototype?', options: ['Shallow copy is faster but inaccurate; deep copy is slower but exact', 'Shallow copy copies only the object immediate fields including references (both the original and copy share the same referenced objects); deep copy recursively copies all referenced objects as well', 'Shallow copy works for primitive types; deep copy works for objects', 'They are identical; the terms are just different names for the same operation'], answer: 1, explanation: 'Shallow copy: copies the object own fields. If a field is a reference type (object, array), both the original and clone point to the same referenced object. Changing the shared object affects both. Deep copy: recursively copies all referenced objects. The clone is fully independent. Use shallow copy when: referenced objects are immutable (strings, value objects). Use deep copy when: the clone must be independently mutable. Deep copy is more expensive. In C#: MemberwiseClone() does shallow copy. For deep copy: serialize to JSON and deserialize, or implement a manual deep copy constructor.' },
  { q: 'When should you use Prototype instead of direct instantiation?', options: ['Always; cloning is more efficient than constructing objects', 'When object creation is expensive (complex setup, many calculations, network calls), when the class is unknown at runtime, or when you need many slightly different variations of a pre-configured object', 'Only when the class has more than five constructors', 'When you need to pass objects across network boundaries'], answer: 1, explanation: 'Use Prototype when: construction is expensive: a machine learning model initialized with weights loaded from disk. Cloning is faster: just copy the pre-initialized object. The class is determined at runtime: a factory receives a prototype object and clones it to produce new instances without knowing the concrete type. Configuring variations: start with a base prototype (default configuration) and clone it to create variations (with one field changed) rather than constructing each from scratch. Object registry: store named prototypes, clone on request. Use direct instantiation when construction is fast and class is known.' },
];

const qna: QnaItem[] = [
  {
    q: 'Is ICloneable worth implementing in .NET?',
    a: 'Generally no — ICloneable.Clone() returns `object` (requires casting) and does not specify whether the copy is shallow or deep. Most teams prefer a strongly-typed Clone() method or copy constructor with explicit deep-copy semantics. ICloneable is considered a design mistake in retrospect.',
  },
  {
    q: 'When is Prototype more appropriate than a constructor?',
    a: 'When constructing an object is expensive (DB lookup, heavy initialization) and many similar objects are needed, cloning a pre-built prototype is faster. Also useful when the concrete type is unknown at compile time but an instance is available at runtime.',
  },
  { q: 'How does JavaScript use Prototype differently from the GoF design pattern?', a: 'In JavaScript, Prototype is a language-level object model, not just a design pattern. Every JavaScript object has a prototype chain: when accessing a property, JS traverses the chain from the object up through its prototype objects until found. Object.create(proto) creates a new object with proto as its prototype. Object.create(null) creates an object with no prototype. Class syntax in ES6 is syntactic sugar over the prototype chain. This is prototype-based inheritance rather than class-based inheritance. The GoF Prototype design pattern (cloning objects) can be implemented in JavaScript using Object.assign({}, source) for shallow copy or structuredClone(source) for deep copy.' },
  { q: 'What is a prototype registry and when is it useful?', a: 'A prototype registry stores named prototype instances. When a new object is needed, the client requests it by name: registry.getPrototype("premiumUser").clone(). Useful when: there are many pre-configured object types that are expensive to construct. The set of types is determined at runtime or by configuration. You want to decouple the client from specific concrete classes. Example: a game enemy registry stores prototypes of each enemy type (goblin, dragon, boss) with their full stat configuration. Spawning a new goblin just clones the registered goblin prototype rather than constructing a new one with all its properties. The registry is often a simple dictionary or a DI container configuration.' },
  { q: 'What are the pitfalls of implementing clone() incorrectly?', a: 'Pitfalls: shallow copy when deep copy is needed: two clones share the same mutable nested object; modifying one affects the other unexpectedly. Forgetting to clone new fields: when a new field is added to a class, the clone() method may not copy it, creating partial clones that are missing data. Clone violating invariants: the cloned object may be in an invalid state if the clone() implementation does not respect construction-time invariants. Circular references causing infinite recursion in deep copy. In Java: Object.clone() is a shallow copy by default, protected, and requires Cloneable marker; many Java developers prefer copy constructors or factory methods over clone() for clarity.' },
  { q: 'How does Prototype pattern interact with the Registry pattern for object creation?', a: 'Combined Prototype Registry pattern: maintain a map of string keys to prototype instances. Provide a method get(key) that clones and returns the registered prototype. Benefits: decouples creation code from concrete types (client code knows only the key string). Adding a new type: register a new prototype under a new key; no client code changes. The registry can load prototypes from configuration or a database at startup. Example: a document template system stores filled template documents (with logos, default text, styling) as prototypes. Creating a new letter: clone the LetterTemplate prototype and fill in the specific content. Faster than parsing and applying a template from scratch each time.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Prototype creates new objects by cloning an existing instance — useful when construction is expensive or the concrete type is unknown at compile time.',
  mustKnow: [
    'Shallow copy shares mutable reference-type fields; deep copy recursively clones them',
    'MemberwiseClone() always produces a shallow copy — deep copy is manual',
    'Prototype Registry: named dictionary of prototypes, clients clone instead of new-ing',
    'C# records with `with` expressions are a modern idiomatic Prototype',
    'Prefer strongly-typed Clone() over ICloneable (ambiguous semantics, requires cast)',
  ],
  interviewFocus: [
    'Shallow vs deep copy — when does each matter?',
    'How does MemberwiseClone() work and what are its limitations?',
    'When would you choose Prototype over a factory pattern?',
  ],
};

@Component({
  selector: 'app-dp-prototype',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './prototype.html',
  styleUrl: './prototype.scss',
})
export class DpPrototype {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
