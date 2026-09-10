import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent, SubtopicLink } from '../../../../../shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-custom-scalar-hooks',
  standalone: true,
  imports: [SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
            TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './custom-scalar-hooks.html',
  styleUrl: './custom-scalar-hooks.scss',
})
export class CustomScalarHooksSubtopic {
  theory: TheoryPoint[] = [
    {
      heading: 'One QnA sentence, three functions',
      points: [
        'The main page’s QnA says: "implement three functions on the server: <code>serialize</code> (output), <code>parseValue</code> (variables), <code>parseLiteral</code> (inline values)." No code sample on the page ever shows one, so which function runs when stays abstract.',
        '<code>serialize</code> runs on the way <em>out</em>: it receives whatever your resolver returned for a field of this scalar type (an internal value like a <code>Date</code>) and must turn it into a JSON-safe primitive for the response.',
        '<code>parseValue</code> runs on the way <em>in</em>, for a value that arrived as a <strong>query variable</strong>. By the time it is called, the transport JSON has already been parsed, so it receives a plain string/number/boolean and returns your internal representation.',
        '<code>parseLiteral</code> also runs on the way in, but for a value written <strong>inline in the query document</strong>. It receives an <em>AST node</em> — an object like <code>{ kind: "StringValue", value: "2020-06-15" }</code> — not a raw value, and must read the node before converting.',
      ],
    },
    {
      heading: 'The trap: the two input hooks must agree',
      points: [
        'A client can supply the same argument two ways: <code>posts(after: "2020-06-15")</code> (inline literal → <code>parseLiteral</code>) or <code>posts(after: $d)</code> with <code>$d = "2020-06-15"</code> (variable → <code>parseValue</code>).',
        'If <code>parseValue</code> and <code>parseLiteral</code> disagree — different validation, different timezone handling, one accepting a format the other rejects — the exact same query behaves differently depending on a choice (inline vs. variable) the schema author does not control.',
        'The safe pattern is to write the real logic once in <code>parseValue</code> and have <code>parseLiteral</code> pull the primitive out of the AST node and delegate to it: <code>parseLiteral(ast) { return this.parseValue(ast.value); }</code> (after checking <code>ast.kind</code>).',
        'A common first mistake is treating <code>parseLiteral</code>’s argument like <code>parseValue</code>’s — calling <code>new Date(ast)</code> directly. <code>ast</code> is a node object; the value you want is <code>ast.value</code>, and you should reject unexpected <code>ast.kind</code>s (e.g. an <code>IntValue</code> where you expect a <code>StringValue</code>).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A DateTime scalar, all three hooks',
      language: 'typescript',
      code: `// graphql-js shape: new GraphQLScalarType({ name, serialize, parseValue, parseLiteral })
const DateTimeScalar = {
  name: 'DateTime',

  // OUTPUT: resolver returned a Date -> ISO string in the response JSON
  serialize(value: unknown): string {
    if (!(value instanceof Date)) throw new TypeError('DateTime.serialize expects a Date');
    return value.toISOString();
  },

  // INPUT via a query VARIABLE: value is already JSON-parsed (a string here)
  parseValue(value: unknown): Date {
    if (typeof value !== 'string') throw new TypeError('DateTime.parseValue expects a string');
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) throw new TypeError('DateTime: invalid date string');
    return d;
  },

  // INPUT written INLINE in the query: ast is a node, not a raw value
  parseLiteral(ast: { kind: string; value?: string }): Date {
    if (ast.kind !== 'StringValue')
      throw new TypeError('DateTime.parseLiteral expects a StringValue, got ' + ast.kind);
    return DateTimeScalar.parseValue(ast.value); // delegate -> the two input paths agree
  },
};`,
    },
    {
      label: 'Which hook runs for which query',
      language: 'typescript',
      code: `const internal = new Date('2020-01-01T00:00:00.000Z');

// Response side: serialize turns the internal Date into JSON.
console.log(DateTimeScalar.serialize(internal));
// 2020-01-01T00:00:00.000Z

// query { posts(after: $d) { id } }   with  $d = "2020-06-15"
//   -> the "2020-06-15" arrived as a variable -> parseValue
console.log(DateTimeScalar.parseValue('2020-06-15').toISOString());
// 2020-06-15T00:00:00.000Z

// query { posts(after: "2020-06-15") { id } }
//   -> "2020-06-15" is inline in the document -> parseLiteral, with an AST node
console.log(DateTimeScalar.parseLiteral({ kind: 'StringValue', value: '2020-06-15' }).toISOString());
// 2020-06-15T00:00:00.000Z

// The mistake: passing parseLiteral a raw string like parseValue takes.
try {
  DateTimeScalar.parseLiteral('2020-06-15' as any);
} catch (e) {
  console.log((e as Error).message);
  // DateTime.parseLiteral expects a StringValue, got undefined
}

// Because parseLiteral delegates to parseValue, both input paths agree:
const viaVariable = DateTimeScalar.parseValue('2020-06-15').getTime();
const viaInline   = DateTimeScalar.parseLiteral({ kind: 'StringValue', value: '2020-06-15' }).getTime();
console.log(viaVariable === viaInline); // true`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'You add a <code>scalar Hex</code> for colour codes and implement <code>parseValue</code> to accept <code>"#ff0000"</code> or <code>"ff0000"</code> (with or without the leading <code>#</code>). You forget to implement <code>parseLiteral</code> and leave it throwing "not implemented". A client runs <code>swatch(colour: "#ff0000")</code> and gets an error; the same client runs <code>swatch(colour: $c)</code> with <code>$c = "#ff0000"</code> and it works. Why the difference, and what is the one-line fix?',
    hint: 'Inline value vs. variable — which hook does each path call?',
    solution: `swatch(colour: "#ff0000") writes the value inline in the query document, so GraphQL calls parseLiteral to convert it -- and your parseLiteral throws "not implemented", producing the error.

swatch(colour: $c) supplies the value as a variable. Variables go through parseValue, which you did implement, so that path succeeds.

The one-line fix is to have parseLiteral read the AST node and delegate to parseValue:

  parseLiteral(ast) { if (ast.kind !== 'StringValue') throw new TypeError('Hex expects a string'); return parseHex(ast.value); }

where parseHex is the shared logic parseValue already calls. This also guarantees the inline and variable paths accept exactly the same set of inputs.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: '"<code>parseValue</code> and <code>parseLiteral</code> both take the raw value — they are basically the same function."',
      reality: '<code>parseValue</code> gets an already-parsed primitive (the value came from a variable). <code>parseLiteral</code> gets an AST node like <code>{ kind: "StringValue", value: "..." }</code> because the value was written into the query text. You have to read <code>ast.value</code> and check <code>ast.kind</code> before converting.',
    },
    {
      thought: '"I only need <code>parseValue</code> if my clients always send values as variables."',
      reality: 'Any client — GraphiQL, a tool, a hand-written query — can inline a scalar value directly in the document, and that path calls <code>parseLiteral</code>. Omitting it means those queries fail even though the equivalent variable-based query works. Implement both.',
    },
    {
      thought: '"<code>serialize</code> is for input validation too, since it also touches the scalar."',
      reality: '<code>serialize</code> only runs on the output path — on whatever your resolver returned, on its way into the response JSON. It never sees client input. Input goes through <code>parseValue</code> (variables) or <code>parseLiteral</code> (inline literals).',
    },
  ];

  topicLabel = 'Schema Definition Language';
  topicRoute = '/graphql/schema-definition-language';
  prev: SubtopicLink | null = {
    label: 'Only Fragments and __typename Can Select From a Union',
    route: '/graphql/schema-definition-language/union-selection-sets',
  };
  next: SubtopicLink | null = null;
}
