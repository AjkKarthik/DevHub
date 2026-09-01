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
    heading: 'Every Field Named in Prose — Never Shown as a Real Document',
    points: [
      'The main page’s own QnA lists JSON:API’s structure precisely: "<code>data</code> (the primary resource or collection). <code>included</code> (related resources...). <code>links</code>... <code>meta</code>... <code>errors</code>." Every codeTab on the page uses the HAL format (<code>_links</code>/<code>_embedded</code>) instead — JSON:API’s own distinct shape is never actually shown.',
      'Verified against the JSON:API specification itself: a resource object has exactly <code>type</code>, <code>id</code>, <code>attributes</code>, <code>relationships</code>, and <code>links</code>. A relationship holds its OWN <code>data</code> — a bare <code>{ type, id }</code> pointer — separately from the FULL resource object for that same entity, which (if included) lives in the top-level <code>included</code> array.',
      'This is the concrete mechanism behind the main page’s own "compound documents" description ("include related data in one request rather than multiple") — a client gets both the relationship POINTER (in <code>relationships</code>) and, optionally, the full related resource DATA (in <code>included</code>) in a single response.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Real JSON:API Compound Document',
    language: 'typescript',
    code: `interface JsonApiResourceIdentifier { type: string; id: string; }
interface JsonApiResource extends JsonApiResourceIdentifier {
  attributes: Record<string, unknown>;
  relationships?: Record<string, { data: JsonApiResourceIdentifier | JsonApiResourceIdentifier[] }>;
}
interface JsonApiDocument {
  data: JsonApiResource | JsonApiResource[];
  included?: JsonApiResource[];
  links?: Record<string, string>;
  meta?: Record<string, unknown>;
}

function buildArticleDocument(article: Article, author: Author, comments: Comment[]): JsonApiDocument {
  return {
    data: {
      type: 'articles',
      id: article.id,
      attributes: { title: article.title, body: article.body },
      relationships: {
        // A relationship holds a bare POINTER (type + id) -- not the
        // full author/comment data. The client follows this pointer
        // into "included" to find the full resource, if present.
        author: { data: { type: 'people', id: author.id } },
        comments: { data: comments.map(c => ({ type: 'comments', id: c.id })) },
      },
    },
    // "included" carries the FULL resource objects for every
    // relationship pointer above -- this is what makes it a compound
    // document, avoiding a second round trip for the author/comments.
    included: [
      { type: 'people', id: author.id, attributes: { name: author.name } },
      ...comments.map(c => ({ type: 'comments', id: c.id, attributes: { body: c.body } })),
    ],
    links: { self: \`/articles/\${article.id}\` },
  };
}

// GET /articles/1?include=author,comments -->
// {
//   "data": {
//     "type": "articles", "id": "1",
//     "attributes": { "title": "...", "body": "..." },
//     "relationships": {
//       "author": { "data": { "type": "people", "id": "9" } },
//       "comments": { "data": [{ "type": "comments", "id": "5" }] }
//     }
//   },
//   "included": [
//     { "type": "people", "id": "9", "attributes": { "name": "Dan" } },
//     { "type": "comments", "id": "5", "attributes": { "body": "First!" } }
//   ],
//   "links": { "self": "/articles/1" }
// }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A client renders an article page and needs the author’s <code>name</code>. Given the document above, trace the exact TWO steps the client must take to get from <code>data.relationships.author</code> to the actual name string — it is not a single property access.',
  hint: 'What does <code>data.relationships.author.data</code> actually contain — the author’s name, or something else entirely? Where does the client have to look NEXT?',
  solution: `// Step 1: data.relationships.author.data is { type: 'people', id:
// '9' } -- a bare POINTER, not the author's name or any other
// attribute. Reading .name directly off this object would be
// undefined; the pointer only tells the client WHICH resource to
// look for next.

// Step 2: the client takes that { type: 'people', id: '9' } pointer
// and searches the TOP-LEVEL included array for an entry matching
// BOTH type === 'people' AND id === '9'. That matching entry --
// { type: 'people', id: '9', attributes: { name: 'Dan' } } -- is
// where the actual name attribute lives.

// This two-step "pointer, then look up the match in included" is
// the exact mechanism the main page's own QnA gestures at with
// "included (related resources, preloaded to reduce N+1)" -- the
// preloading works specifically because the client does an in-memory
// lookup against the SAME response's included array, rather than a
// second HTTP request to /people/9. A real client implementation
// typically does this once, building a type+id keyed lookup map from
// included before rendering, rather than re-scanning the array for
// every relationship.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A relationship’s "data" field directly contains the related resource’s full attributes.',
    reality: 'It contains only a bare resource IDENTIFIER — <code>{ type, id }</code> — never the attributes. The codeTab above deliberately separates the pointer (in <code>relationships</code>) from the full resource object (in <code>included</code>), which is what lets the SAME relationship be represented compactly even when the full related resource isn’t included in this particular response at all.',
  },
  {
    thought: 'JSON:API and HAL are just two different naming conventions for the same underlying concept — swapping <code>_links</code>/<code>_embedded</code> for <code>links</code>/<code>included</code> is a mechanical rename.',
    reality: 'They have a genuinely different STRUCTURE, not just different field names — JSON:API separates a relationship’s pointer from its full data via the <code>included</code> array with a type+id lookup, while HAL’s <code>_embedded</code> nests the full related resource directly inline, with no separate pointer/lookup step at all.',
  },
  {
    thought: 'The <code>included</code> array is scoped per-relationship — each relationship carries its own separate list of included resources.',
    reality: 'It is a SINGLE, flat, TOP-LEVEL array shared across the entire document — the codeTab above puts both the included author AND every included comment in the same <code>included</code> list, and a client matches each relationship pointer against that one shared list by <code>type</code> + <code>id</code>, not by which relationship the pointer came from.',
  },
];

@Component({
  selector: 'app-api-hateoas-jsonapi',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './a-real-jsonapi-response-shape.html',
  styleUrl: './a-real-jsonapi-response-shape.scss',
})
export class ARealJsonapiResponseShapeSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
