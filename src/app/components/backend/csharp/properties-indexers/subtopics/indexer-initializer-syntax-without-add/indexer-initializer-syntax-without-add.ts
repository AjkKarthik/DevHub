import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-indexer-initializer-syntax-without-add-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './indexer-initializer-syntax-without-add.html',
  styleUrl: './indexer-initializer-syntax-without-add.scss',
})
export class IndexerInitializerSyntaxWithoutAddSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows bracket ASSIGNMENT — never bracket INITIALIZATION',
      points: [
        'The main Properties & Indexers page shows <code>cfg["timeout"] = "30";</code> as an ordinary statement AFTER construction. It never shows that C# 6+ also supports using bracket syntax directly INSIDE an object initializer block — <code>new ConfigStore { ["timeout"] = "30" }</code> — a genuinely different, less well-known feature usually associated with collection initializers but that actually works through the INDEXER, not <code>Add()</code>.',
      ],
    },
    {
      heading: 'This is fundamentally different from a collection initializer',
      points: [
        'An ordinary COLLECTION initializer (<code>new List&lt;int&gt; { 1, 2, 3 }</code>) requires the type to implement <code>IEnumerable</code> and have an accessible <code>Add</code> method — the compiler translates each element into a separate <code>Add(...)</code> call.',
        'An INDEX initializer (<code>new ConfigStore { ["timeout"] = "30" }</code>) requires NEITHER of those — it works on ANY type that has an indexer with a <code>set</code> accessor, translating each <code>[key] = value</code> entry into a direct call to the indexer\'s SETTER, exactly as if you had written <code>cfg["timeout"] = "30";</code> as a separate statement right after construction.',
        'This means the main page\'s own <code>ConfigStore</code> and <code>Matrix</code> types — neither of which implements <code>IEnumerable</code> or has an <code>Add</code> method — ALREADY support index-initializer syntax for free, purely because they have a settable indexer, with zero additional code required.',
      ],
    },
    {
      heading: 'Multiple index entries and multi-parameter indexers both work',
      points: [
        'Multiple <code>[key] = value</code> entries can appear in the same initializer block, each becoming its own indexer-setter call in the order written — genuinely equivalent to writing them as separate statements after construction, just more concise.',
        'A MULTI-PARAMETER indexer (like the main page\'s <code>Matrix.this[int row, int col]</code>) also works with this syntax: <code>new Matrix(3, 3) { [0, 0] = 1, [1, 1] = 1, [2, 2] = 1 }</code> — each bracket group\'s comma-separated values map directly to the indexer\'s parameter list, exactly as a normal indexer call would.',
      ],
    },
    {
      heading: 'It combines naturally with ordinary property initializers too',
      points: [
        'Index-initializer entries can appear in the SAME initializer block as ordinary property assignments — <code>new DataRow { Columns = [...], ["Id"] = "1" }</code> mixes a property initializer (<code>Columns = ...</code>) with an index initializer (<code>["Id"] = "1"</code>) in one expression, since both ultimately compile down to a sequence of individual assignment/setter calls after the object is constructed.',
        'This makes index-initializer syntax a genuinely useful, zero-extra-code convenience for ANY type with a settable indexer — worth knowing about specifically because it requires no interface implementation and no special attribute, unlike collection initializers which need the <code>Add</code>-method convention.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'ConfigStore — the main topic\'s own type, index-initializable for free',
      language: 'csharp',
      code: `// The EXACT ConfigStore from the main topic — unchanged:
public class ConfigStore
{
    private readonly Dictionary<string, string> _data = new(StringComparer.OrdinalIgnoreCase);

    public string this[string key]
    {
        get => _data.TryGetValue(key, out var v) ? v : throw new KeyNotFoundException(key);
        set => _data[key] = value ?? throw new ArgumentNullException(nameof(value));
    }
}

// The main topic's own usage — bracket ASSIGNMENT after construction:
var cfg1 = new ConfigStore();
cfg1["timeout"] = "30";
cfg1["baseUrl"] = "https://api.example.com";

// The SAME result, using index-INITIALIZER syntax (C# 6+) — no new code
// on ConfigStore needed at all, since it already has a settable indexer:
var cfg2 = new ConfigStore
{
    ["timeout"] = "30",
    ["baseUrl"] = "https://api.example.com",
};

// These desugar to IDENTICAL IL — cfg2's initializer is purely syntactic
// sugar for calling the indexer's setter once per entry, in order,
// immediately after the parameterless constructor runs:
Console.WriteLine(cfg2["timeout"]); // "30"`,
    },
    {
      label: 'Matrix — multi-parameter indexers work too',
      language: 'csharp',
      code: `// The main topic's own Matrix type — unchanged:
public class Matrix
{
    private readonly double[,] _data;
    public int Rows { get; }
    public int Cols { get; }

    public Matrix(int rows, int cols)
    {
        Rows = rows; Cols = cols;
        _data = new double[rows, cols];
    }

    public double this[int row, int col]
    {
        get => _data[row, col];
        set => _data[row, col] = value;
    }
}

// The main topic's own usage — separate statements after construction:
var m1 = new Matrix(3, 3);
m1[0, 0] = 1; m1[1, 1] = 1; m1[2, 2] = 1;

// The SAME result, using index-initializer syntax with a multi-parameter
// indexer — each comma-separated bracket group maps directly to the
// indexer's (row, col) parameter list:
var m2 = new Matrix(3, 3)
{
    [0, 0] = 1,
    [1, 1] = 1,
    [2, 2] = 1,
};

Console.WriteLine(m2[1, 1]); // 1`,
    },
    {
      label: 'Combining property initializers and index initializers in one block',
      language: 'csharp',
      code: `// The DataRow from the main topic's challenge — unchanged:
public class DataRow
{
    public required string[] Columns { get; init; }
    private readonly Dictionary<string, string?> _values =
        new(StringComparer.OrdinalIgnoreCase);

    public string? this[string column]
    {
        get => _values.TryGetValue(column, out var v) ? v : null;
        set => _values[column] = value;
    }
}

// Property initializer (Columns) and index initializers (["Id"], ["Name"])
// combined in ONE object initializer block:
var row = new DataRow
{
    Columns = ["Id", "Name", "Email"],  // property initializer
    ["Id"]    = "1",                     // index initializer
    ["Name"]  = "Alice",                 // index initializer
    ["Email"] = "alice@example.com",     // index initializer
};

Console.WriteLine(row["Name"]); // "Alice"

// This compiles to: construct DataRow (setting Columns via the required
// init property), THEN call the indexer setter three times in order —
// genuinely equivalent to writing four separate statements, just more
// concise and readable as a single declarative block.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Would <code>new ConfigStore { ["timeout"] = "30" }</code> compile if <code>ConfigStore</code>\'s indexer had ONLY a get accessor (no set)? Explain your reasoning in terms of what index-initializer syntax actually desugars to.',
    hint: 'Index-initializer syntax desugars to calling the indexer\'s SETTER — think about whether that call is even possible to generate if no setter exists at all, the same way an ordinary "obj[key] = value;" statement outside an initializer would also fail to compile without a set accessor.',
    solution: `// No — this would NOT compile. Index-initializer syntax desugars to a
// call to the indexer's SET accessor — if the indexer is get-only
// (public string this[string key] => ...;), there is no setter to call.

public class ReadOnlyStore
{
    private readonly Dictionary<string, string> _data = new();
    public string this[string key] => _data[key]; // get-only, no setter
}

// var broken = new ReadOnlyStore { ["timeout"] = "30" };
// COMPILE ERROR — cannot use index initializer syntax because the
// indexer has no accessible "set" accessor. This is EXACTLY analogous
// to why "obj[key] = value;" as an ordinary statement also would not
// compile against a get-only indexer — index-initializer syntax is
// purely sugar for that same underlying setter call, just written
// inside the object initializer block instead of as a separate
// statement afterward. No setter, no index-initializer syntax, exactly
// the same rule that applies to ordinary bracket assignment.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'index-initializer syntax like new ConfigStore { ["timeout"] = "30" } requires the type to implement IEnumerable and an Add method, the same as an ordinary collection initializer.',
      reality: 'index-initializer syntax works on ANY type with a settable indexer — it requires neither IEnumerable nor an Add method, and desugars to direct indexer-setter calls, a completely different mechanism from collection initializers.',
    },
    {
      thought: 'index-initializer syntax only works with single-parameter indexers.',
      reality: 'multi-parameter indexers work identically — each comma-separated bracket group (e.g. [0, 0] = 1) maps directly to the indexer\'s full parameter list, exactly as a normal indexer call would.',
    },
    {
      thought: 'a type needs special code or attributes added specifically to support index-initializer syntax.',
      reality: 'any type with an existing settable indexer already supports this syntax with zero additional code — the main topic\'s own ConfigStore and Matrix types support it purely because they already have set accessors on their indexers, as demonstrated by the code examples above.',
    },
  ];
}
