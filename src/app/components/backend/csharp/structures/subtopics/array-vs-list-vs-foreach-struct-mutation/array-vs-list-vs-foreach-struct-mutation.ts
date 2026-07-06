import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-array-vs-list-vs-foreach-struct-mutation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './array-vs-list-vs-foreach-struct-mutation.html',
  styleUrl: './array-vs-list-vs-foreach-struct-mutation.scss',
})
export class ArrayVsListVsForeachStructMutationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s copy-mutation trap is only ONE of three genuinely different cases',
      points: [
        'The main Structures page\'s "mutating a struct returned from a property" Common Mistake covers CLASS PROPERTIES specifically. It never addresses the THREE genuinely different mutation behaviors that arise depending on the CONTAINER: a raw array\'s indexer, a <code>List&lt;T&gt;</code>\'s indexer, and a <code>foreach</code> loop — each behaves DIFFERENTLY for structs, and conflating them is a real, common source of confusion.',
      ],
    },
    {
      heading: 'A raw array\'s indexer is special — it grants a genuine VARIABLE, not a copy',
      points: [
        'Unlike a property getter or a <code>List&lt;T&gt;</code>\'s indexer (both of which are, or compile down to, ordinary METHOD CALLS returning a value), a raw <code>T[]</code> array\'s indexer is a LANGUAGE-LEVEL construct the compiler treats specially — <code>array[i].X = 5</code> genuinely writes DIRECTLY into the array\'s backing storage at that index, because <code>array[i]</code> in an assignment-target position is treated as an addressable VARIABLE (an lvalue), not a value returned from a method call.',
        'This is the ONE place in ordinary C# where struct member mutation through indexing "just works" as most developers instinctively expect — because arrays get genuine compiler-level addressability that no other indexed container automatically provides.',
      ],
    },
    {
      heading: 'List<T>\'s indexer does NOT get this special treatment — it is an ordinary method call',
      points: [
        'Despite LOOKING syntactically identical to array indexing, <code>list[i]</code> for a <code>List&lt;T&gt;</code> desugars to a call to the indexer\'s <code>get</code> ACCESSOR METHOD, which returns a COPY of the struct — exactly like the main page\'s own class-property example. <code>list[i].X = 5;</code> is therefore a COMPILE ERROR (CS1612) for a struct <code>T</code>, specifically because the compiler recognizes it cannot safely make the mutation observable through a method-call-based indexer.',
        'This is the source of a very common early confusion: "why does this work on an array but not on a List of the exact same struct type?" — the answer is that arrays get unique compiler support that no other collection type (including the BCL\'s own <code>List&lt;T&gt;</code>) receives.',
      ],
    },
    {
      heading: 'foreach always copies — the iteration variable is never addressable',
      points: [
        'A <code>foreach (var item in structArray) { item.X = 5; }</code> loop NEVER mutates the underlying collection, for arrays OR lists — the iteration variable <code>item</code> is always a fresh COPY assigned once per iteration, and mutating it only affects that copy, discarded at the end of the iteration. Modern C# compilers even emit CS1656 or a similar diagnostic warning about this for foreach specifically, since it is such a common source of confusion.',
        'This means the ONLY reliable way to mutate structs stored in an array in a loop is an ordinary indexed <code>for</code> loop using the array\'s special indexer addressability: <code>for (int i = 0; i < array.Length; i++) { array[i].X = 5; }</code> — <code>foreach</code> cannot achieve this for structs, regardless of container type.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Array indexer — genuinely mutates the backing storage',
      language: 'csharp',
      code: `public struct Point { public int X; public int Y; }

Point[] points = new Point[3];
points[0] = new Point { X = 1, Y = 1 };
points[1] = new Point { X = 2, Y = 2 };

// Array indexer mutation — this GENUINELY works, because array[i] in
// this position is treated as an addressable VARIABLE, not a
// method-call return value:
points[0].X = 99;

Console.WriteLine(points[0].X); // 99 — the mutation WAS observed!
// This is the ONE place struct mutation via indexing "just works" as
// most developers instinctively expect.`,
    },
    {
      label: 'List<T> indexer — looks identical, but is an ordinary method call',
      language: 'csharp',
      code: `var pointList = new List<Point>
{
    new Point { X = 1, Y = 1 },
    new Point { X = 2, Y = 2 },
};

// pointList[0].X = 99;
// COMPILE ERROR: CS1612 — "Cannot modify the return value of
// 'List<Point>.this[int]' because it is not a variable"
//
// WHY: List<T>'s indexer is an ordinary GET-ACCESSOR METHOD under the
// hood — it returns a COPY of the struct, exactly like a class
// property getter. Unlike a raw array, List<T> receives NO special
// compiler addressability treatment, despite the identical [i] syntax.

// The FIX — retrieve, mutate the local copy, then write the WHOLE
// struct back via the indexer's SET accessor:
var temp = pointList[0];
temp.X = 99;
pointList[0] = temp; // now genuinely updates the stored value

Console.WriteLine(pointList[0].X); // 99 — correctly updated THIS way`,
    },
    {
      label: 'foreach — always copies, for BOTH arrays and lists, no exceptions',
      language: 'csharp',
      code: `Point[] arr = { new Point { X = 1 }, new Point { X = 2 } };

foreach (var item in arr)
{
    item.X = 99; // mutates ONLY the iteration variable's copy
}
Console.WriteLine(arr[0].X); // 1 — completely unchanged, despite arr
                              // being the SAME array type that supports
                              // direct indexer mutation!

// The ONLY reliable way to mutate structs stored in an array in a loop
// is an ordinary indexed for-loop, using the array's special indexer
// addressability directly:
for (int i = 0; i < arr.Length; i++)
{
    arr[i].X = 99; // genuinely mutates — same mechanism as the single-
                    // element example, just inside a loop
}
Console.WriteLine(arr[0].X); // 99 — correctly updated via indexed for

// For List<T>, since its indexer doesn't even compile for direct
// mutation, the fix from the previous example applies inside a loop too:
var list = new List<Point> { new Point { X = 1 }, new Point { X = 2 } };
for (int i = 0; i < list.Count; i++)
{
    var p = list[i];
    p.X = 99;
    list[i] = p; // retrieve, mutate copy, write whole struct back
}
Console.WriteLine(list[0].X); // 99`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Given a 2D array <code>Point[,] grid = new Point[3, 3];</code>, would <code>grid[0, 0].X = 5;</code> compile and genuinely mutate the backing array, the same way the 1D array example does?',
    hint: 'Think about whether the special "indexer position is an addressable variable" treatment described in the theory is specific to ONE-DIMENSIONAL arrays specifically, or whether it is a more general property of the ARRAY TYPE (T[], T[,], T[,,], etc.) as a language-level construct, distinct from the List<T>/Dictionary<K,V>-style indexer that is always an ordinary method call regardless of dimensionality.',
    solution: `// Yes — this compiles and genuinely mutates the backing array. The
// special addressability the theory describes is a property of ARRAYS
// AS A LANGUAGE-LEVEL CONSTRUCT generally — it applies to single-
// dimensional arrays (T[]), multi-dimensional arrays (T[,], T[,,]), and
// jagged arrays (T[][]) alike, because ALL of these are genuine array
// types the CLR and C# compiler give special addressable-element
// treatment to, NOT something specific to one-dimensional arrays only.

Point[,] grid = new Point[3, 3];
grid[0, 0] = new Point { X = 1, Y = 1 };

grid[0, 0].X = 5; // compiles fine — genuinely mutates the backing array
Console.WriteLine(grid[0, 0].X); // 5 — mutation observed correctly

// The distinguishing factor is NEVER "how many dimensions" — it is
// "is this actually an ARRAY TYPE (any T[...] form) versus some OTHER
// type that merely happens to define an indexer (this[...] accessor
// methods, like List<T> or Dictionary<K,V>)." Only genuine array types
// get this special compiler-level addressability; anything implementing
// an ordinary indexer via get/set accessor methods does not, regardless
// of how array-like its usage syntax looks.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if array[i].X = 5 works for mutating a struct in an array, the same syntax list[i].X = 5 should also work for a List<T> of the same struct type, since the bracket syntax looks identical.',
      reality: 'a raw array\'s indexer receives special compiler-level treatment as an addressable variable, while List<T>\'s indexer is an ordinary get/set accessor METHOD that returns a copy — this is why list[i].X = 5 is a genuine compile error (CS1612) despite array[i].X = 5 working perfectly.',
    },
    {
      thought: 'a foreach loop over an array of structs can mutate the array\'s contents, the same way indexing into the array directly can.',
      reality: 'foreach always assigns a fresh COPY to the iteration variable on every iteration, for both arrays and lists — mutating that copy never affects the underlying collection; only an indexed for-loop using the array\'s special indexer addressability can mutate struct elements in place.',
    },
    {
      thought: 'the array indexer\'s special addressable-variable behavior only applies to simple one-dimensional arrays.',
      reality: 'this special treatment is a property of ARRAY TYPES generally — single-dimensional, multi-dimensional, and jagged arrays all receive it identically, since all are genuine array types at the CLR level, distinct from any other type that merely defines an ordinary indexer.',
    },
  ];
}
