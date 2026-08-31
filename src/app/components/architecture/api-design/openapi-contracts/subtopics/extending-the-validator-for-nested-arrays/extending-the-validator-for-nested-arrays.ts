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
    heading: 'The Challenge’s Validator Can’t Check the Spec’s Own CreateOrderRequest',
    points: [
      'The main page’s own Challenge builds <code>validateAgainstSchema(data, schema)</code>, which checks required top-level fields and their flat types. The main page’s own OpenAPI spec, in the very first codeTab, defines <code>CreateOrderRequest</code> as <code>{ items: array of { productId: string, quantity: number } }</code> — a nested array of objects. The Challenge’s own <code>SchemaSpec</code> type has no way to express an array-of-objects shape at all.',
      'Real OpenAPI schemas nest constantly — an array field’s <code>items</code> key is itself a full schema, which can itself contain nested arrays or objects. A validator that only understands one flat level of <code>properties</code> can validate a fraction of what an actual spec describes.',
      'The fix is recursive: when a property’s type is <code>array</code>, validate the array itself (is it actually an array? does it meet <code>minItems</code>?), then recursively run the SAME validator against each item using the array’s own <code>items</code> sub-schema — exactly mirroring how the OpenAPI spec itself nests one schema inside another.',
      'Error messages need to trace the PATH into the nested structure (<code>items[0].quantity</code>, not just <code>quantity</code>) — otherwise a validation failure inside array item 3 of 10 is indistinguishable from a failure on a completely different item.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Recursive Validator for Nested Arrays',
    language: 'typescript',
    code: `type SchemaSpec = {
  required?: string[];
  properties: Record<string, PropertySpec>;
};

type PropertySpec =
  | { type: 'string' | 'number' | 'boolean' }
  | { type: 'array'; minItems?: number; items: SchemaSpec };

// Extends the main page's own validateAgainstSchema to handle a property
// whose type is 'array' -- recursing into each item using the SAME
// function, exactly as the OpenAPI spec nests one schema inside another.
function validateAgainstSchemaV2(data: any, schema: SchemaSpec): string[] {
  const errors: string[] = [];

  for (const field of schema.required ?? []) {
    if (data[field] === undefined || data[field] === null) {
      errors.push(\`'\${field}' is required\`);
    }
  }

  for (const [field, def] of Object.entries(schema.properties)) {
    const value = data[field];
    if (value === undefined) continue;

    if (def.type === 'array') {
      if (!Array.isArray(value)) {
        errors.push(\`'\${field}' must be array, got \${typeof value}\`);
        continue;
      }
      if (def.minItems !== undefined && value.length < def.minItems) {
        errors.push(\`'\${field}' must have at least \${def.minItems} items\`);
      }
      value.forEach((item, i) => {
        const itemErrors = validateAgainstSchemaV2(item, def.items);
        itemErrors.forEach(e => errors.push(\`\${field}[\${i}].\${e}\`));
      });
    } else if (typeof value !== def.type) {
      errors.push(\`'\${field}' must be \${def.type}, got \${typeof value}\`);
    }
  }

  return errors;
}

// The main page's own CreateOrderRequest shape, expressed in the extended
// SchemaSpec -- required: [items], items: array of { productId, quantity }.
const createOrderSchema: SchemaSpec = {
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      minItems: 1,
      items: {
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'string' },
          quantity: { type: 'number' },
        },
      },
    },
  },
};

console.log(validateAgainstSchemaV2({ items: [{ productId: 'p1', quantity: 2 }] }, createOrderSchema));
// []

console.log(validateAgainstSchemaV2({ items: [] }, createOrderSchema));
// ["'items' must have at least 1 items"]

console.log(validateAgainstSchemaV2({ items: [{ productId: 'p1' }] }, createOrderSchema));
// ["items[0].'quantity' is required"]

console.log(validateAgainstSchemaV2({}, createOrderSchema));
// ["'items' is required"]`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The recursive validator above passes each array item through <code>validateAgainstSchemaV2</code> again — the SAME function, not a separate "validate array item" function. What would break, or become more complicated, if a THIRD level of nesting were added — say, each order item also had its own nested <code>discounts: array of { code: string, percentOff: number }</code>?',
  hint: 'Does the recursive call know or care how many levels deep it currently is? What has to change about the validator’s own CODE to support a third level, versus what has to change in the SCHEMA passed to it?',
  solution: `// Nothing about validateAgainstSchemaV2's OWN code needs to change for a
// third level of nesting -- that's the entire point of making it
// recursive rather than hard-coding "one level of arrays." The function
// doesn't track depth at all; each call only ever deals with ONE level
// (its own schema and its own data object), and delegates any nested
// array entirely to a fresh call of itself.

// Adding a third level is purely a SCHEMA change: items.items would gain
// its own 'discounts' property of type 'array', with its OWN nested
// 'items' schema describing { code: string, percentOff: number }. The
// validator function handles this automatically, since every array
// property -- at any depth -- goes through the identical
// "is it an array? check minItems? recurse into each element" branch.

// The only thing that grows is the ERROR PATH STRING: a failure three
// levels deep would read like "items[0].discounts[1].code is required"
// -- built up automatically by each recursive call prepending its own
// field[index]. segment onto whatever the deeper call already returned.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The main page’s Challenge validator is "wrong" or incomplete, and this subtopic is fixing a bug in it.',
    reality: 'The Challenge’s original <code>validateAgainstSchema</code> is correct for exactly what it sets out to check — required fields and flat property types, matching its own stated requirements and worked examples precisely. This subtopic isn’t a bug fix; it’s extending the SAME approach to handle a schema shape (nested arrays of objects) the original Challenge never claimed to support, using the spec’s own <code>CreateOrderRequest</code> as the motivating real-world example.',
  },
  {
    thought: 'A recursive schema validator needs to track how many levels deep it currently is, to build correct error messages.',
    reality: 'The codeTab above tracks NO depth counter at all — each recursive call only ever prepends its own <code>field[index].</code> prefix onto whatever the DEEPER call already returned. The full, correctly-nested path assembles itself purely from each call doing its own small, local piece of the job, the same way any correct recursive function avoids needing global state.',
  },
  {
    thought: 'Validating nested array items requires a genuinely different kind of validator than validating top-level fields.',
    reality: 'The codeTab reuses the EXACT SAME <code>validateAgainstSchemaV2</code> function for both — an array item is just another <code>SchemaSpec</code>/data pair, validated by calling the function again. There is no separate "array item validator"; the recursion IS the mechanism that makes one function handle arbitrary nesting depth.',
  },
];

@Component({
  selector: 'app-api-openapi-nested-validator',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './extending-the-validator-for-nested-arrays.html',
  styleUrl: './extending-the-validator-for-nested-arrays.scss',
})
export class ExtendingTheValidatorForNestedArraysSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
