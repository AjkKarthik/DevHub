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
    heading: 'A Schema Declared for the Wrong Endpoint Entirely',
    points: [
      'The main page’s own "Input Validation" codeTab declared <code>const CreateOrderSchema = z.object({ items: ..., deliveryAddress: ..., note: ... })</code> — a schema shaped for an <em>orders</em> endpoint — but the SAME codeTab’s two <code>/users</code> route handlers referenced <code>CreateUserSchema</code>, a name that was never declared anywhere in the file.',
      'This is a plain <code>TS2304: Cannot find name \'CreateUserSchema\'</code> reference error — every one of the codeTab’s other pieces (the <code>validate()</code> middleware, the two route handlers, the CORS block) is correct in isolation, but the schema they all depend on simply doesn’t exist under that name.',
      'This has now been fixed on the main page by renaming the declared schema to <code>CreateUserSchema</code> and reshaping its fields to match what the "GOOD" handler actually destructures — <code>{ name, email }</code> — rather than the order-shaped fields the original declaration had.',
      'This is the same undeclared-reference category this hub (and several sibling hubs) has hit repeatedly: a codeTab that reads fluently top-to-bottom, where the gap only surfaces by checking that every identifier a LATER line uses was actually declared by an EARLIER line — the standard grep-the-codeTab-for-its-own-undeclared-names discipline.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Fixed CreateUserSchema, Verified',
    language: 'typescript',
    code: `import { z } from 'zod';

// Fixed: schema now matches what the /users handler actually destructures
const CreateUserSchema = z.object({
  name:  z.string().min(1).max(100),
  email: z.string().email(),
});

function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: { code: 'validation_error', details: result.error.issues },
      });
    }
    req.body = result.data;
    next();
  };
}

// GOOD: explicit allowlist -- isAdmin is hardcoded, never read from the request body
app.post('/users', authenticate, validate(CreateUserSchema), async (req, res) => {
  const { name, email } = req.body; // only these two -- schema enforces it
  const user = await User.create({ name, email, isAdmin: false });
  res.json(user);
});

// Verified logic (run against the real 'zod' package):
//
//   valid body:                     { name: 'Alice', email: 'alice@example.com' }
//     -> 200, { name: 'Alice', email: 'alice@example.com', isAdmin: false }
//
//   mass-assignment attempt
//   ({ ...body, isAdmin: true }):
//     -> 200, isAdmin is STILL false -- Zod only ever parses out 'name'
//        and 'email'; the extra 'isAdmin' key in the raw body is simply
//        never read by the destructure, so it can't reach User.create().
//
//   invalid email ('not-an-email'):
//     -> 400, { field: 'email', issue: 'Invalid email address' }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Extend <code>CreateUserSchema</code> with an optional <code>bio</code> field (max 280 characters) and update the handler to accept it. If a request body also includes <code>isAdmin: true</code> alongside a valid <code>bio</code>, does mass-assignment protection still hold?',
  hint: 'Add <code>bio: z.string().max(280).optional()</code> to the schema, destructure <code>bio</code> alongside <code>name</code>/<code>email</code> in the handler, and pass it through to <code>User.create()</code> — but keep <code>isAdmin: false</code> hardcoded exactly as before. Then trace what happens to an extra <code>isAdmin</code> key in the raw request body.',
  solution: `const CreateUserSchemaV2 = z.object({
  name:  z.string().min(1).max(100),
  email: z.string().email(),
  bio:   z.string().max(280).optional(),
});

app.post('/users', authenticate, validate(CreateUserSchemaV2), async (req, res) => {
  const { name, email, bio } = req.body;
  const user = await User.create({ name, email, bio, isAdmin: false });
  res.json(user);
});

// Verified: { name: 'Dana', email: 'dana@example.com', bio: 'hi', isAdmin: true }
// -> 200, { name: 'Dana', email: 'dana@example.com', bio: 'hi', isAdmin: false }
//
// isAdmin still can't be injected. Adding a new allowed field to the
// schema/destructure never widens what gets accepted for fields NOT
// named in either -- the protection comes from the destructure only
// ever naming the fields the schema itself allows, not from the
// schema's total field count.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A codeTab that reads sensibly line by line, with each individual piece looking syntactically correct, is safe to trust as-is.',
    reality: 'The declared schema (<code>CreateOrderSchema</code>) and the schema actually used two sections later (<code>CreateUserSchema</code>) were both individually well-formed — the bug was only visible by checking that every name a later line references was actually declared by an earlier one, the same discipline this hub applies to every codeTab before trusting it.',
  },
  {
    thought: 'Mass-assignment protection comes from validating the request body has the RIGHT NUMBER of fields, or from the schema being "strict" in some general sense.',
    reality: 'The protection comes specifically from the handler only ever DESTRUCTURING the fields the schema allows — an extra key like <code>isAdmin</code> in the raw request body is simply never read into any variable, so it never reaches <code>User.create()</code>, regardless of whether Zod itself is configured to reject or silently strip unknown keys.',
  },
  {
    thought: 'Since <code>CreateOrderSchema</code> was never actually called by anything, an unused, mismatched declaration like this is harmless clutter, not a real bug.',
    reality: 'The two problems are linked, not independent: <code>CreateOrderSchema</code> being declared-but-unused is exactly what made <code>CreateUserSchema</code> being used-but-undeclared possible to miss on a casual read — the codeTab LOOKS complete because a plausible-looking schema declaration exists nearby, just under the wrong name.',
  },
];

@Component({
  selector: 'app-api-security-createuserschema',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-undeclared-createuserschema-reference.html',
  styleUrl: './the-undeclared-createuserschema-reference.scss',
})
export class TheUndeclaredCreateuserschemaReferenceSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
