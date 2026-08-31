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
    heading: 'The Notification Example Describes Exclusivity — No Code Shows It Enforced',
    points: [
      'One of the main page’s own quiz explanations describes <code>oneof</code> in real detail: <code>message Notification { oneof content { TextContent text = 1; ImageContent image = 2; VideoContent video = 3; } }</code>, and states "setting <code>notification.text</code> automatically clears <code>notification.image</code> and <code>notification.video</code>." No codeTab on the page shows the accessor logic that actually enforces this exclusivity — it’s described entirely in prose.',
      'Generated protobuf code (in every target language) implements this by having the setter for ANY field in the group clear the OTHER fields in the same group as a side effect — the mutual exclusivity is not something the caller has to remember to maintain, it’s built into the generated class itself.',
      'A generated <code>case()</code> (or <code>WhichOneof()</code> in Python, a generated case enum in Go) method reports which single field, if any, is currently set — this is what makes <code>oneof</code> genuinely different from three plain optional fields a caller could accidentally set all at once.',
      'This same one-of-several-mutually-exclusive-shapes idea already appears in this hub’s own OpenAPI & Contracts topic as <code>oneOf</code> + <code>discriminator</code> — protobuf’s <code>oneof</code> and OpenAPI’s <code>oneOf</code> solve the identical modeling problem (a value is exactly one of several shapes) using two different mechanisms: protobuf enforces it at the GENERATED-CODE level (impossible to violate), OpenAPI’s is a VALIDATION-time check (a payload can still be malformed and simply fail validation).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Enforcing oneof Exclusivity',
    language: 'typescript',
    code: `interface TextContent { body: string }
interface ImageContent { url: string; altText?: string }
interface VideoContent { url: string; durationSec: number }

type NotificationCase = 'NOT_SET' | 'text' | 'image' | 'video';

// Mirrors what generated protobuf code does for a oneof group: every
// setter for a field IN THE GROUP clears the other fields in the SAME
// group as a side effect -- the exclusivity is enforced by the class
// itself, not left to the caller's discipline.
class Notification {
  #text?: TextContent;
  #image?: ImageContent;
  #video?: VideoContent;
  #case: NotificationCase = 'NOT_SET';

  setText(v: TextContent) {
    this.#text = v;
    this.#image = undefined;
    this.#video = undefined;
    this.#case = 'text';
  }

  setImage(v: ImageContent) {
    this.#image = v;
    this.#text = undefined;
    this.#video = undefined;
    this.#case = 'image';
  }

  setVideo(v: VideoContent) {
    this.#video = v;
    this.#text = undefined;
    this.#image = undefined;
    this.#case = 'video';
  }

  // Mirrors generated code's case()/WhichOneof() -- reports which single
  // field (if any) is currently set.
  getCase(): NotificationCase {
    return this.#case;
  }

  get text() { return this.#text; }
  get image() { return this.#image; }
  get video() { return this.#video; }
}

const n = new Notification();
n.setText({ body: 'hello' });
console.log(n.getCase(), n.text, n.image, n.video);
// text { body: 'hello' } undefined undefined

n.setImage({ url: 'pic.png' });
console.log(n.getCase(), n.text, n.image, n.video);
// image undefined { url: 'pic.png' } undefined
// -- setting image silently cleared text, exactly as the main page's
// quiz explanation describes.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate writes a plain interface instead: <code>interface Notification { text?: TextContent; image?: ImageContent; video?: VideoContent; }</code>, with no class or setters at all — just an object literal a caller assigns fields to directly. What real capability does this simpler version lose compared to the <code>Notification</code> class above?',
  hint: 'With a plain object literal, what stops a caller from writing <code>{ text: {...}, image: {...} }</code> — setting BOTH fields at once? Who is responsible for maintaining the "only one" rule in each version?',
  solution: `// The plain interface version has NO enforcement mechanism at all --
// nothing stops a caller from writing:
//
//   const bad: Notification = { text: { body: 'hi' }, image: { url: 'x' } };
//
// TypeScript's structural typing happily allows this: all three fields
// are optional, so setting two (or all three) simultaneously is
// perfectly valid according to the type system. The "only one at a
// time" rule exists purely as a COMMENT or a convention the caller has
// to remember and honor manually -- it's not actually enforced anywhere.

// The class-based version above makes this a genuine, structural
// impossibility: there is no code path through setText()/setImage()/
// setVideo() that can ever leave more than one of #text/#image/#video
// populated, because each setter explicitly clears the other two as
// part of what it does. The exclusivity is a property of the CLASS,
// not something every caller has to independently remember -- exactly
// mirroring what real generated protobuf oneof code guarantees.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'protobuf’s <code>oneof</code> is essentially the same as making three fields optional — you just have to remember not to set more than one.',
    reality: 'The whole point of <code>oneof</code> is that the generated code makes the exclusivity IMPOSSIBLE to violate, not merely a convention to remember — calling the setter for one field in the group automatically, unconditionally clears the others, exactly as the <code>Notification</code> class above enforces. Three independently-optional fields give a caller no such guarantee.',
  },
  {
    thought: 'protobuf’s <code>oneof</code> and OpenAPI’s <code>oneOf</code> + <code>discriminator</code> are essentially interchangeable names for the same guarantee.',
    reality: 'They model the SAME idea (a value is exactly one of several possible shapes) but enforce it at genuinely different points: protobuf’s <code>oneof</code> is enforced by the GENERATED CODE itself — a caller literally cannot construct an invalid multi-field state. OpenAPI’s <code>oneOf</code> is a VALIDATION rule checked against a payload — a malformed JSON body setting multiple fields at once is a perfectly constructible value that simply FAILS validation, rather than being structurally unrepresentable.',
  },
  {
    thought: 'Calling <code>getCase()</code> before any setter has been called returns <code>undefined</code>, the same as an unset field elsewhere in protobuf.',
    reality: 'The <code>Notification</code> class above explicitly initializes <code>#case</code> to the literal string <code>\'NOT_SET\'</code>, not <code>undefined</code> — matching how real generated protobuf oneof code represents "nothing in this group has been set yet" as an explicit, named case value rather than leaving it ambiguous.',
  },
];

@Component({
  selector: 'app-api-protobuf-oneof',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-oneof-discriminated-union-actually-implemented.html',
  styleUrl: './a-oneof-discriminated-union-actually-implemented.scss',
})
export class AOneofDiscriminatedUnionActuallyImplementedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
