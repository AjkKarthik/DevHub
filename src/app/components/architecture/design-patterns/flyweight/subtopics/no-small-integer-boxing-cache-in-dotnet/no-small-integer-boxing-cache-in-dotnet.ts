import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'A Claim That Was Only True for Java',
    points: [
      'The main page\'s ".NET Examples" originally listed "boxed integers -128 to 127 are cached in Java/.NET-' +
      'like runtimes" as a Flyweight example — Java\'s claim is correct (<code>Integer.valueOf()</code> caches ' +
      'that range), but the CLR has no equivalent at all.',
      'Every C# boxing operation — wrapping a value type like <code>int</code> in an <code>object</code> — ' +
      'allocates a fresh object on the managed heap, regardless of how small or how commonly-used the value ' +
      'is. There is no pool, cache, or intern table for boxed value types anywhere in the CLR.',
    ],
  },
  {
    heading: 'Why Java and .NET Diverge Here',
    points: [
      'Java\'s autoboxing cache is a JLS-mandated behavior of <code>Integer.valueOf()</code> specifically — ' +
      'the JLS requires implementations to cache values in the range -128 to 127, precisely so that ' +
      '<code>==</code> comparisons on small boxed integers behave consistently across JVM implementations.',
      'C# has no equivalent language-level requirement for boxing, and the CLR\'s <code>box</code> IL ' +
      'instruction is specified to always allocate — there is no caching layer for the runtime to opt into, ' +
      'and no C# language feature analogous to Java\'s <code>Integer.valueOf()</code> static factory that a ' +
      'cache could even hook into.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Proving the Difference',
    language: 'csharp',
    code: `// A small, boxed value — exactly the range Java's Integer cache covers.
object a = 100;
object b = 100;

Console.WriteLine(ReferenceEquals(a, b));
// False in C# — every boxing operation is a fresh heap allocation.
// (The equivalent Java code, Integer a = 100; Integer b = 100;
//  a == b, evaluates to TRUE, because both hit the same cached
//  Integer instance for values -128..127.)

// Even boxing the SAME variable twice produces two different objects:
int n = 42;
object c = n;
object d = n;
Console.WriteLine(ReferenceEquals(c, d)); // False — two separate boxes

// Equality by VALUE still works fine — Equals() is not affected:
Console.WriteLine(a.Equals(b)); // True — value equality, unrelated to sharing`,
  },
  {
    label: 'What .NET Gives You Instead',
    language: 'csharp',
    code: `// .NET has NO automatic small-integer Flyweight — but if you genuinely
// need to deduplicate boxed values (rare — usually a sign to avoid
// boxing in the first place), you build the factory yourself, the
// same way the main page's own ParticleFactory does for particle types.
public sealed class BoxedIntCache
{
    private readonly Dictionary<int, object> _cache = new();

    public object Get(int value)
    {
        if (!_cache.TryGetValue(value, out var boxed))
        {
            boxed = value; // one boxing allocation, cached from here on
            _cache[value] = boxed;
        }
        return boxed;
    }
}

var cache = new BoxedIntCache();
object x = cache.Get(100);
object y = cache.Get(100);
Console.WriteLine(ReferenceEquals(x, y)); // True — now genuinely shared,
                                            // because YOU built the Flyweight
                                            // factory; the CLR never does
                                            // this for you automatically.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A developer coming from Java writes <code>if ((object)smallCount1 == (object)smallCount2)</code> in C#, ' +
    'expecting reference equality on two boxed <code>int</code> values both equal to 5, based on their Java ' +
    'experience. What will this code actually evaluate to in C#, and why is that consistent with — not a bug ' +
    'in — the CLR\'s boxing model?',
  hint:
    'Cast both operands to object first (as shown) so the comparison genuinely uses reference equality, not ' +
    'the overloaded value-equality operators int provides — then ask what boxing actually allocates each time.',
  solution:
    'It evaluates to false. Each of smallCount1 and smallCount2 was boxed independently — even if both hold ' +
    'the value 5 — and the CLR always allocates a brand-new heap object for every boxing operation, with no ' +
    'small-value cache to short-circuit that allocation the way Java\'s Integer.valueOf() does. This is not a ' +
    'bug: it is the CLR behaving exactly as documented — box always allocates. The Java habit of relying on ' +
    'reference equality for small boxed integers (itself a common source of Java bugs OUTSIDE the -128..127 ' +
    'range, where the cache does not apply either) simply has no equivalent guarantee to lean on in C#.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since both Java and .NET are managed runtimes with a JIT and garbage collector, they must share ' +
      'this kind of low-level memory optimization.',
    reality:
      'Managed-runtime status does not imply identical optimizations — Java\'s small-integer cache is a ' +
      'SPECIFIC, spec-mandated behavior of one particular API (<code>Integer.valueOf()</code>/autoboxing), not ' +
      'a general property every managed runtime inherits. The CLR made a different, equally valid design ' +
      'choice: box always allocates, with no hidden cache to reason about.',
  },
  {
    thought: 'If .NET had this optimization, it would be a strict win with no downside, so its absence must ' +
      'be an oversight.',
    reality:
      'Java\'s own cache is a frequent SOURCE of subtle bugs, not a pure win — code that relies on == for ' +
      'boxed Integer comparison works "by accident" inside -128..127 and silently breaks outside that range, ' +
      'which is exactly why Java style guides consistently recommend .equals() over == for boxed types. The ' +
      'CLR\'s simpler "always allocate" rule has no such trap: reference equality on boxed values consistently ' +
      'and predictably requires an explicit cache you build yourself, as shown above.',
  },
];

@Component({
  selector: 'app-flyweight-no-small-integer-boxing-cache-in-dotnet',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './no-small-integer-boxing-cache-in-dotnet.html',
  styleUrl: './no-small-integer-boxing-cache-in-dotnet.scss',
})
export class NoSmallIntegerBoxingCacheInDotnetSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
