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
    heading: 'Named Tools, No Code — What "Breaking Change Detection" Actually Checks',
    points: [
      'The main page’s quiz names two real tools for detecting breaking changes between two OpenAPI spec versions — <code>openapi-diff</code> and Optic — as a one-line mention: "does the new spec introduce breaking changes compared to the previous version?" Neither the mechanism nor a worked example appears anywhere else on the page.',
      'This directly extends the main page’s own Backward Compatibility discussion (already covered on the API Design Principles topic): "adding new optional response fields is safe... removing required or optional fields, changing field types, and making optional fields required are breaking."',
      'A minimal version of this check needs only three comparisons between an OLD schema and a NEW schema: did a field get REMOVED (breaks any client reading it); did an EXISTING field’s TYPE change (breaks any client parsing it under the old assumption); did a field become REQUIRED that wasn’t required before (breaks any client that never sent it).',
      'A brand-new OPTIONAL field is the one kind of change that is always safe to add without a version bump — existing clients that don’t know a field exists simply ignore it, exactly as the additive-evolution principle already established elsewhere in this hub states.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Minimal Breaking-Change Detector',
    language: 'typescript',
    code: `interface PropertySpec {
  type: string;
}

interface SimpleSchema {
  required?: string[];
  properties: Record<string, PropertySpec>;
}

interface DiffResult {
  breaking: string[];
  nonBreaking: string[];
}

function diffSchemas(oldSchema: SimpleSchema, newSchema: SimpleSchema): DiffResult {
  const breaking: string[] = [];
  const nonBreaking: string[] = [];

  const oldRequired = new Set(oldSchema.required ?? []);
  const newRequired = new Set(newSchema.required ?? []);

  // A field that becomes required (and wasn't before) breaks any client
  // that never sent it -- it worked yesterday and fails today.
  for (const field of newRequired) {
    if (!oldRequired.has(field)) {
      breaking.push(\`Field '\${field}' is now required (was optional or absent)\`);
    }
  }

  // Removing a field breaks any client reading it.
  for (const field of Object.keys(oldSchema.properties)) {
    if (!(field in newSchema.properties)) {
      breaking.push(\`Field '\${field}' was removed\`);
    }
  }

  // Changing an existing field's type breaks clients parsing it under the
  // old assumption -- a client expecting a string doesn't handle a number.
  for (const [field, oldDef] of Object.entries(oldSchema.properties)) {
    const newDef = newSchema.properties[field];
    if (newDef && newDef.type !== oldDef.type) {
      breaking.push(\`Field '\${field}' changed type from \${oldDef.type} to \${newDef.type}\`);
    }
  }

  // A new OPTIONAL field is additive -- existing clients ignore fields
  // they don't recognize, so this is always safe.
  for (const field of Object.keys(newSchema.properties)) {
    if (!(field in oldSchema.properties) && !newRequired.has(field)) {
      nonBreaking.push(\`Field '\${field}' was added (optional)\`);
    }
  }

  return { breaking, nonBreaking };
}

const v1: SimpleSchema = {
  required: ['id', 'status'],
  properties: {
    id: { type: 'string' },
    status: { type: 'string' },
    totalCents: { type: 'number' },
  },
};

// A genuinely breaking revision: totalCents removed, status's type
// changed, and a brand-new required field added.
const v2Breaking: SimpleSchema = {
  required: ['id', 'status', 'currency'],
  properties: {
    id: { type: 'string' },
    status: { type: 'number' }, // was 'string'
    currency: { type: 'string' }, // new AND required
  },
};
console.log(diffSchemas(v1, v2Breaking));
// {
//   breaking: [
//     "Field 'currency' is now required (was optional or absent)",
//     "Field 'totalCents' was removed",
//     "Field 'status' changed type from string to number",
//   ],
//   nonBreaking: [],
// }

// A genuinely safe, additive revision: one new OPTIONAL field only.
const v2Safe: SimpleSchema = {
  required: ['id', 'status'],
  properties: {
    id: { type: 'string' },
    status: { type: 'string' },
    totalCents: { type: 'number' },
    discountCode: { type: 'string' }, // new, optional
  },
};
console.log(diffSchemas(v1, v2Safe));
// { breaking: [], nonBreaking: ["Field 'discountCode' was added (optional)"] }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A field EXISTS in both the old and new schema, keeps the same type, but moves from <code>required</code> to OPTIONAL in the new version (the opposite direction from becoming newly required). The detector above has no rule at all for this case — is that a real gap, or is this kind of change actually always safe to leave undetected?',
  hint: 'A client that was ALREADY relying on this field always being present in the old spec — does it still get that field in every response under the new, looser spec? What would have to be true about the SERVER’s actual behavior, not just the schema text, for this to be genuinely safe?',
  solution: `// Making a required field optional is NOT automatically safe -- it's a
// real gap in the detector above, and the honest answer is "it depends
// on the server's actual behavior, not just the schema text."

// If the server schema loosens 'totalCents' from required to optional
// PURELY as a documentation change (the server still always sends it in
// practice), existing clients relying on its presence are completely
// unaffected -- nothing breaking actually happened at runtime, even
// though the CONTRACT got looser.

// But if the schema change reflects a REAL behavior change -- the server
// now sometimes omits totalCents under some new condition -- then any
// existing client that reads response.totalCents without checking for
// undefined first will break the moment the server actually exercises
// that new code path, even though the field TECHNICALLY still "exists"
// in the schema as optional.

// This is why a real diff tool (openapi-diff, Optic) treats
// required-to-optional as a WARNING worth a human's attention, not a
// silent pass and not an automatic hard failure -- unlike the three
// unambiguous breaking cases above (removed field, changed type, newly
// required field), whether loosening a requirement is safe depends on
// information the schema diff alone cannot see.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Comparing two OpenAPI specs for breaking changes just means diffing the raw YAML/JSON text and flagging any difference.',
    reality: 'A raw text diff flags every difference, including harmless ones (reordering properties, adding a <code>description</code> field, renaming an internal <code>operationId</code> that consumers never see). A real breaking-change detector has to understand the SEMANTICS of what changed — which is exactly why the codeTab above compares structured fields (required-ness, type, presence) rather than comparing text.',
  },
  {
    thought: 'Any change to the "required" list is automatically flagged as breaking by a real diff tool.',
    reality: 'Only a field BECOMING required is breaking — the detector above deliberately only checks <code>newRequired</code> fields NOT already in <code>oldRequired</code>. A field LEAVING the required list (becoming optional) is a genuinely more nuanced case, explored in the Try It above, which most simple detectors under-report rather than treat as a hard failure.',
  },
  {
    thought: 'Detecting breaking changes is only useful right before a release — running it earlier in development doesn’t add value.',
    reality: 'The whole point of running a detector like this IN CI, on every pull request (as the main page’s own quiz explanation states for real tools like openapi-diff), is catching an accidental breaking change the moment it’s introduced — while the author still has full context on why they made the edit — rather than discovering it only at release time, or worse, after a consumer\'s integration breaks in production.',
  },
];

@Component({
  selector: 'app-api-openapi-breaking-change-diff',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-minimal-breaking-change-detector.html',
  styleUrl: './a-minimal-breaking-change-detector.scss',
})
export class AMinimalBreakingChangeDetectorSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
