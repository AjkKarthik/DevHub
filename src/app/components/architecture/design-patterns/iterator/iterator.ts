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
  { name: 'Intent',        type: 'keyword',   desc: 'Provide a way to sequentially access elements of a collection without exposing its underlying representation.' },
  { name: 'IEnumerator<T>', type: 'interface', desc: '.NET\'s Iterator interface: Current, MoveNext(), Reset().' },
  { name: 'IEnumerable<T>', type: 'interface', desc: '.NET\'s Iterable interface: GetEnumerator() returns an IEnumerator<T>.' },
  { name: 'yield return',  type: 'keyword',   desc: 'C# compiler generates a state-machine Iterator from a method using yield return.' },
  { name: 'External Iterator', type: 'keyword', desc: 'Client controls iteration by calling MoveNext() explicitly.' },
  { name: 'Internal Iterator', type: 'keyword', desc: 'Collection controls iteration; client provides a callback (e.g., List<T>.ForEach()).' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'What is the Iterator Pattern?',
    points: [
      'Iterator provides a uniform way to traverse a collection without exposing its internal structure.',
      'The client uses the iterator interface (MoveNext, Current) regardless of whether the collection is a list, tree, or graph.',
      'Separates traversal logic from the collection class — the collection is not responsible for iteration.',
      'Multiple iterators can traverse the same collection simultaneously without interfering.',
    ],
  },
  {
    heading: 'IEnumerable<T> and IEnumerator<T> in .NET',
    points: [
      'IEnumerable<T>: the "iterable" interface with GetEnumerator() — implemented by all .NET collections.',
      'IEnumerator<T>: the "iterator" interface with Current (get the element) and MoveNext() (advance).',
      'foreach compiles to: get enumerator, loop MoveNext, access Current, dispose.',
      'Any class implementing IEnumerable<T> works with foreach, LINQ, and all BCL algorithms.',
    ],
  },
  {
    heading: 'yield return — Iterator State Machine',
    points: [
      'C# compiler generates an IEnumerator<T> state machine from a method using yield return.',
      'Execution is lazy: code runs only as the caller requests elements — perfect for infinite sequences.',
      'yield break ends iteration.',
      'Enables simple, readable custom iterations without implementing IEnumerator<T> manually.',
    ],
  },
  {
    heading: 'External vs Internal Iterators',
    points: [
      'External: client calls MoveNext() — controls iteration pace (can pause, skip, stop).',
      'Internal: collection calls a provided delegate for each element (List.ForEach, LINQ.Select).',
      '.NET LINQ uses internal iterators (Select, Where) which are lazy — they compose without materialising.',
      'External iterators are more flexible; internal iterators are more concise for simple traversals.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Custom Iterator',
    language: 'csharp',
    code: `// Custom binary tree with in-order iterator
public class BinaryTree<T> where T : IComparable<T>
{
    private record Node(T Value, Node? Left = null, Node? Right = null);
    private Node? _root;

    public void Insert(T value) => _root = Insert(_root, value);
    private Node Insert(Node? node, T value)
    {
        if (node is null) return new Node(value);
        return value.CompareTo(node.Value) < 0
            ? node with { Left  = Insert(node.Left,  value) }
            : node with { Right = Insert(node.Right, value) };
    }

    // yield return generates the IEnumerator<T> state machine
    public IEnumerable<T> InOrder()
    {
        foreach (var item in InOrderFrom(_root))
            yield return item;
    }

    private IEnumerable<T> InOrderFrom(Node? node)
    {
        if (node is null) yield break;
        foreach (var v in InOrderFrom(node.Left))  yield return v;
        yield return node.Value;
        foreach (var v in InOrderFrom(node.Right)) yield return v;
    }
}

// Usage — foreach works automatically via IEnumerable<T>
var tree = new BinaryTree<int>();
tree.Insert(5); tree.Insert(3); tree.Insert(7); tree.Insert(1);

foreach (var n in tree.InOrder())    // 1, 3, 5, 7
    Console.Write($"{n} ");

// LINQ works too — lazy, no materialisation
var evens = tree.InOrder().Where(n => n % 2 == 0).ToList();`,
  },
  {
    label: 'Infinite Sequences',
    language: 'csharp',
    code: `// yield return enables infinite lazy sequences
public static IEnumerable<int> Fibonacci()
{
    int a = 0, b = 1;
    while (true)
    {
        yield return a;
        (a, b) = (b, a + b);
    }
}

// Take only what you need — the sequence is never fully materialised
var first10 = Fibonacci().Take(10).ToList();
// [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]

// Pagination iterator — lazy database reads
public async IAsyncEnumerable<Order> GetOrdersAsync(
    [EnumeratorCancellation] CancellationToken ct)
{
    int page = 0;
    while (true)
    {
        var batch = await db.Orders
            .OrderBy(o => o.Id)
            .Skip(page * 100).Take(100)
            .ToListAsync(ct);

        if (batch.Count == 0) yield break;

        foreach (var order in batch)
            yield return order;

        page++;
    }
}

// Caller uses await foreach — doesn't know it's paginated
await foreach (var order in GetOrdersAsync(ct))
    await ProcessOrderAsync(order);`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Materialising a large collection instead of iterating lazily',
    wrong: `public List<Order> GetOrders() => db.Orders.ToList(); // loads ALL orders into memory`,
    right: `public IEnumerable<Order> GetOrders() => db.Orders.AsEnumerable(); // lazy stream`,
    explanation: 'Returning IEnumerable<T> (or IAsyncEnumerable<T>) keeps iteration lazy. ToList() immediately loads everything into memory — fine for small sets, disastrous for millions of rows.',
  },
  {
    title: 'Modifying a collection during iteration',
    wrong: `foreach (var item in list)
    if (item.IsExpired) list.Remove(item); // throws InvalidOperationException`,
    right: `var expired = list.Where(i => i.IsExpired).ToList();
foreach (var item in expired) list.Remove(item);`,
    explanation: 'Modifying a collection while iterating it invalidates the enumerator and throws InvalidOperationException. Collect items to remove first, then remove after the iteration completes.',
  },
  {
    title: 'Forgetting to dispose the enumerator',
    wrong: `var e = list.GetEnumerator();
while (e.MoveNext()) Process(e.Current);
// IEnumerator<T> is IDisposable — never disposed!`,
    right: `using var e = list.GetEnumerator();
while (e.MoveNext()) Process(e.Current);
// Or just use foreach — it disposes automatically`,
    explanation: 'IEnumerator<T> implements IDisposable. foreach disposes automatically via a try-finally. Manual enumerator use must wrap in using to release resources (especially for lazy DB queries).',
  },
  {
    title: 'Yielding inside a try-catch over yield return',
    wrong: `try {
    yield return GetExpensiveValue(); // compiler error or unexpected behaviour
} catch (Exception ex) { ... }`,
    right: `// Don't yield inside try-catch — restructure to pre-fetch or handle before yielding
var value = GetExpensiveValue();
yield return value;`,
    explanation: 'C# does not allow yield return inside a try block that has a catch clause. Pre-compute the value before yielding, or restructure the error handling outside the yield.',
  },
];

const challenge: Challenge = {
  title: 'Range Iterator',
  language: 'typescript',
  description: `Implement a custom range iterator using JavaScript's Symbol.iterator protocol.
Range(start, end, step) should be iterable with for...of.
It should also support a filter(predicate) method that returns a new iterable range.`,
  hints: [
    'Implement [Symbol.iterator]() returning { next() }',
    'next() returns { value, done } — done=true when past end',
    'filter() returns a new object with its own [Symbol.iterator]',
  ],
  starterCode: `class Range {
  constructor(
    private start: number,
    private end: number,
    private step: number = 1
  ) {}

  [Symbol.iterator](): Iterator<number> {
    // TODO: return iterator object with next()
  }

  filter(pred: (n: number) => boolean): Iterable<number> {
    // TODO: return new iterable
  }
}

for (const n of new Range(1, 10)) console.log(n);`,
  solution: `class Range {
  constructor(
    private start: number,
    private end: number,
    private step: number = 1
  ) {}

  [Symbol.iterator](): Iterator<number> {
    let current = this.start;
    const { end, step } = this;
    return {
      next(): IteratorResult<number> {
        if (current <= end) {
          const value = current;
          current += step;
          return { value, done: false };
        }
        return { value: 0, done: true };
      }
    };
  }

  filter(pred: (n: number) => boolean): Iterable<number> {
    const self = this;
    return {
      [Symbol.iterator](): Iterator<number> {
        const iter = self[Symbol.iterator]();
        return {
          next(): IteratorResult<number> {
            let result = iter.next();
            while (!result.done && !pred(result.value)) {
              result = iter.next();
            }
            return result;
          }
        };
      }
    };
  }
}

for (const n of new Range(1, 10)) process.stdout.write(n + ' '); // 1 2 3 4 5 6 7 8 9 10
console.log();
for (const n of new Range(1, 10).filter(n => n % 2 === 0)) process.stdout.write(n + ' '); // 2 4 6 8 10`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does C# `foreach` compile to under the hood?',
    options: [
      'A for loop with index access',
      'GetEnumerator(), then a while(MoveNext()) loop accessing Current, with Dispose() in finally',
      'A recursive function call per element',
      'Direct index access via the indexer operator',
    ],
    answer: 1,
    explanation: 'foreach compiles to: call GetEnumerator(), enter try, loop while(MoveNext()), access Current inside the loop. In finally: call Dispose() on the enumerator. This is why foreach works on any IEnumerable<T>.',
  },
  {
    q: 'What is the advantage of `yield return` over implementing IEnumerator<T> manually?',
    options: [
      'yield return is faster at runtime',
      'yield return allows infinite sequences; IEnumerator<T> does not',
      'The compiler generates the state machine — no manual Current/MoveNext/Dispose boilerplate',
      'yield return avoids heap allocations',
    ],
    answer: 2,
    explanation: 'With yield return, you write a normal sequential method; the C# compiler generates the full IEnumerator<T> state machine implementation (current position tracking, MoveNext logic, Dispose). Manual implementation requires all that boilerplate by hand.',
  },
  {
    q: 'What exception is thrown when you modify a List<T> while iterating it with foreach?',
    options: ['ArgumentException', 'IndexOutOfRangeException', 'InvalidOperationException', 'NotSupportedException'],
    answer: 2,
    explanation: 'List<T>\'s enumerator tracks a version counter. When the list is modified (Add/Remove), the version changes. On the next MoveNext(), the enumerator detects the mismatch and throws InvalidOperationException: "Collection was modified."',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is IAsyncEnumerable<T> and when should I use it?',
    a: 'IAsyncEnumerable<T> is the async counterpart of IEnumerable<T> — it allows await inside the iteration and is consumed with await foreach. Use it for streaming results from async sources: database pagination, server-sent events, file chunks. It avoids loading all data into memory while still being async.',
  },
  {
    q: 'Can LINQ compose with custom iterators?',
    a: 'Yes — any class implementing IEnumerable<T> works with all LINQ operators (Select, Where, Take, etc.). LINQ operators are themselves lazy iterators implemented with yield return, so composing them creates a lazy pipeline with no intermediate allocations until ToList() or foreach forces evaluation.',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Iterator provides uniform sequential access to collection elements without exposing the internal structure — IEnumerable<T>/IEnumerator<T> and yield return are .NET\'s built-in Iterator.',
  mustKnow: [
    'IEnumerable<T>: GetEnumerator(); IEnumerator<T>: Current, MoveNext(), Dispose()',
    'foreach compiles to GetEnumerator + MoveNext loop + Dispose in finally',
    'yield return: compiler generates the state machine — enables lazy sequences',
    'Never modify a collection during foreach — throws InvalidOperationException',
    'IAsyncEnumerable<T> for async streaming with await foreach',
  ],
  interviewFocus: [
    'What does foreach compile to?',
    'How does yield return create a lazy iterator?',
    'What is IAsyncEnumerable<T> and when would you use it?',
  ],
};

@Component({
  selector: 'app-dp-iterator',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './iterator.html',
  styleUrl: './iterator.scss',
})
export class DpIterator {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
