import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-generic-type-reflection-traps-generictypedefinition-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './generic-type-reflection-traps-generictypedefinition.html',
  styleUrl: './generic-type-reflection-traps-generictypedefinition.scss',
})
export class GenericTypeReflectionTrapsGenerictypedefinitionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s typeof/GetType foundation doesn\'t address what happens once generics enter the picture',
      points: [
        'The main Reflection page\'s foundational example (<code>typeof(Animal)</code> vs <code>a.GetType()</code>) uses ordinary, non-generic types. The moment a type is generic — <code>List&lt;int&gt;</code>, <code>Dictionary&lt;string, Product&gt;</code> — a whole category of reflection traps opens up that the main page\'s own <code>IsAssignableFrom</code> quiz question doesn\'t cover: closed generic types are never equal to their open generic definition, and checking "does this type implement <code>IEnumerable&lt;T&gt;</code> for ANY T" requires a genuinely different technique than ordinary type equality.',
      ],
    },
    {
      heading: 'A CLOSED generic type (List<int>) and its OPEN generic definition (List<T>) are never the same Type object',
      points: [
        '<code>typeof(List&lt;int&gt;)</code> and <code>typeof(List&lt;&gt;)</code> (the open generic definition, using an empty angle-bracket) are DIFFERENT <code>Type</code> instances — <code>typeof(List&lt;int&gt;) == typeof(List&lt;&gt;)</code> is <code>false</code>. Every distinct closed generic instantiation (<code>List&lt;int&gt;</code>, <code>List&lt;string&gt;</code>, <code>List&lt;Product&gt;</code>) is its OWN separate <code>Type</code>, entirely distinct from the open generic definition they were all constructed from.',
        'To get from a closed generic type back to its open definition, call <code>type.GetGenericTypeDefinition()</code> — <code>typeof(List&lt;int&gt;).GetGenericTypeDefinition() == typeof(List&lt;&gt;)</code> is <code>true</code>. This is the correct comparison when you want to ask "is this SOME instantiation of <code>List&lt;T&gt;</code>, regardless of which T," rather than "is this EXACTLY <code>List&lt;int&gt;</code>."',
      ],
    },
    {
      heading: 'Checking "does this type implement IEnumerable<T> for any T" requires walking interfaces and comparing generic definitions',
      points: [
        'A naive <code>typeof(IEnumerable&lt;&gt;).IsAssignableFrom(someType)</code> does NOT work the way you might expect for an open generic interface — <code>IsAssignableFrom</code> on an unbound open generic type generally returns <code>false</code> even for types that genuinely implement some closed form of that interface, because <code>IEnumerable&lt;&gt;</code> itself is not a real, instantiable type any concrete type can be assignable to.',
        'The correct pattern: enumerate <code>someType.GetInterfaces()</code>, filter to those that <code>IsGenericType</code>, and compare each one\'s <code>GetGenericTypeDefinition()</code> against <code>typeof(IEnumerable&lt;&gt;)</code> — this is exactly the technique many serialization and validation libraries use internally to detect "is this a generic collection of SOMETHING" without knowing the element type in advance.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Closed generic types are never equal to their open generic definition',
      language: 'csharp',
      code: `Type closedInt    = typeof(List<int>);
Type closedString = typeof(List<string>);
Type openGeneric   = typeof(List<>);     // note the empty <> — the OPEN definition

Console.WriteLine(closedInt == openGeneric);        // False
Console.WriteLine(closedInt == closedString);       // False — different T
Console.WriteLine(closedInt.IsGenericType);         // True
Console.WriteLine(closedInt.IsGenericTypeDefinition); // False — it's CLOSED
Console.WriteLine(openGeneric.IsGenericTypeDefinition); // True — this IS the definition

// The correct comparison to ask "is this genuinely List<T> for SOME T":
Console.WriteLine(closedInt.GetGenericTypeDefinition() == openGeneric);    // True
Console.WriteLine(closedString.GetGenericTypeDefinition() == openGeneric); // True — same
                                                                             // definition,
                                                                             // different T`,
    },
    {
      label: 'The trap — IsAssignableFrom on an unbound open generic interface doesn\'t work as expected',
      language: 'csharp',
      code: `Type dictType = typeof(Dictionary<string, int>);

// This does NOT reliably detect "is dictType SOME IEnumerable<T>" —
// IEnumerable<> (the open generic interface) is not a real,
// instantiable type that closed types can be "assignable to" in the
// way IsAssignableFrom expects:
bool naiveCheck = typeof(IEnumerable<>).IsAssignableFrom(dictType); // False!

// Even though Dictionary<string, int> genuinely DOES implement
// IEnumerable<KeyValuePair<string, int>> — a closed form of the
// generic interface — the OPEN form check above fails to detect it.`,
    },
    {
      label: 'The correct pattern — walk interfaces and compare generic definitions',
      language: 'csharp',
      code: `static bool ImplementsGenericInterface(Type type, Type openGenericInterfaceDefinition)
{
    // Check the type itself, in case it IS the generic interface:
    if (type.IsGenericType && type.GetGenericTypeDefinition() == openGenericInterfaceDefinition)
        return true;

    // Walk every interface the type implements, comparing each one's
    // OWN generic definition against the target open definition:
    return type.GetInterfaces()
        .Where(i => i.IsGenericType)
        .Any(i => i.GetGenericTypeDefinition() == openGenericInterfaceDefinition);
}

Type dictType = typeof(Dictionary<string, int>);

bool isEnumerableOfSomething =
    ImplementsGenericInterface(dictType, typeof(IEnumerable<>)); // True — correctly
                                                                  // detected this time

bool isListOfSomething =
    ImplementsGenericInterface(typeof(List<int>), typeof(IList<>)); // True

// This is exactly the technique serialization/validation libraries
// use internally to detect "is this a generic collection of
// SOMETHING" without needing to know the element type ahead of time.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Write a method <code>bool IsSomeNullable(Type type)</code> that returns true for <code>Nullable&lt;int&gt;</code>, <code>Nullable&lt;DateTime&gt;</code>, etc., but false for <code>int</code>, <code>string</code>, and non-nullable value types — using the GetGenericTypeDefinition technique.',
    hint: 'Nullable<T> is a generic struct. Check whether the type is generic at all first (IsGenericType), then compare its GetGenericTypeDefinition() against typeof(Nullable<>).',
    solution: `static bool IsSomeNullable(Type type)
{
    // Guard first — non-generic types (like plain int or string)
    // would throw if you called GetGenericTypeDefinition() on them
    // directly, since that method only applies to generic types:
    if (!type.IsGenericType) return false;

    return type.GetGenericTypeDefinition() == typeof(Nullable<>);
}

Console.WriteLine(IsSomeNullable(typeof(int?)));       // True  (int? is Nullable<int>)
Console.WriteLine(IsSomeNullable(typeof(DateTime?)));  // True
Console.WriteLine(IsSomeNullable(typeof(int)));        // False — not generic at all
Console.WriteLine(IsSomeNullable(typeof(string)));     // False — not generic at all
Console.WriteLine(IsSomeNullable(typeof(List<int>)));  // False — generic, but the
                                                        // WRONG generic definition
                                                        // (List<>, not Nullable<>)

// This exact pattern is what many serializers and ORMs use internally
// to detect "is this property's type Nullable<T>" so they can unwrap
// it to the underlying T before further processing.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'typeof(List<int>) and typeof(List<>) represent the same underlying type, just written differently.',
      reality: 'they are entirely distinct Type objects — every closed generic instantiation (List<int>, List<string>, etc.) is its own separate Type, different from the open generic definition they were constructed from. GetGenericTypeDefinition() is required to get from one to the other.',
    },
    {
      thought: 'typeof(IEnumerable<>).IsAssignableFrom(someClosedType) correctly detects whether someClosedType implements SOME closed form of IEnumerable<T>.',
      reality: 'this check unreliably returns false even for types that genuinely implement a closed IEnumerable<T> — the open generic interface is not a real, instantiable type in the way IsAssignableFrom expects; walking GetInterfaces() and comparing GetGenericTypeDefinition() is the correct technique.',
    },
    {
      thought: 'calling GetGenericTypeDefinition() is always safe to call on any Type object.',
      reality: 'it only applies to genuinely generic types — calling it on a non-generic type like typeof(int) or typeof(string) throws InvalidOperationException; always guard with IsGenericType first.',
    },
  ];
}
