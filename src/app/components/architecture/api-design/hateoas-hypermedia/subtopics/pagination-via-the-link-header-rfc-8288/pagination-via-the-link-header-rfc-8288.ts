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
    heading: 'Named With a Real GitHub Example — Never Built as an Actual Handler',
    points: [
      'Quiz Q5’s own explanation names the mechanism precisely: "Link header (RFC 8288)... used by GitHub API for pagination navigation with next, prev, first, last relations" and even quotes a real-looking GitHub example header. No codeTab on the page ever builds a handler that sends one.',
      'Verified against RFC 8288 itself: multiple links are comma-separated, each wrapped as <code>&lt;URI&gt;</code> followed by semicolon-delimited parameters, with <code>rel="..."</code> as the required one — e.g. <code>&lt;http://example.com/page1&gt;; rel="prev"</code>.',
      'This is the "partial hypermedia" the main page’s own QnA on HATEOAS ROI recommends as the practical middle ground: "using Link headers for well-established, universally understood relations (like pagination next/prev) without implementing full HATEOAS response bodies."',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Building and Sending a Real Link Header',
    language: 'typescript',
    code: `interface LinkEntry { url: string; rel: string; }

function buildLinkHeader(links: LinkEntry[]): string {
  // RFC 8288: comma-separated link-values, each "<URI>; rel=\\"...\\""
  return links.map(l => \`<\${l.url}>; rel="\${l.rel}"\`).join(', ');
}

app.get('/users', async (req, res) => {
  const page  = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const baseUrl = \`\${req.protocol}://\${req.get('host')}/users\`;

  const [users, total] = await Promise.all([
    db.users.findMany({ skip: (page - 1) * limit, take: limit }),
    db.users.count(),
  ]);
  const pages = Math.ceil(total / limit);
  const urlFor = (p: number) => \`\${baseUrl}?page=\${p}&limit=\${limit}\`;

  const links: LinkEntry[] = [
    { url: urlFor(1), rel: 'first' },
    { url: urlFor(pages), rel: 'last' },
    ...(page > 1     ? [{ url: urlFor(page - 1), rel: 'prev' }] : []),
    ...(page < pages ? [{ url: urlFor(page + 1), rel: 'next' }] : []),
  ];

  res.set('Link', buildLinkHeader(links));
  // The JSON body itself stays PLAIN -- no _links object at all.
  // This is what makes it "partial hypermedia": pagination
  // navigation without a full hypermedia response body.
  res.json(users);
});

console.log(buildLinkHeader([
  { url: 'https://api.example.com/users?page=2', rel: 'next' },
  { url: 'https://api.example.com/users?page=1', rel: 'first' },
]));
// '<https://api.example.com/users?page=2>; rel="next", <https://api.example.com/users?page=1>; rel="first"'`,
  },
  {
    label: 'Parsing an Incoming Link Header (Client Side)',
    language: 'typescript',
    code: `function parseLinkHeader(header: string): Record<string, string> {
  const result: Record<string, string> = {};
  // Split on commas that separate link-values, then extract the URI
  // and rel from each individual "<URI>; rel=\\"...\\"" entry.
  for (const part of header.split(',')) {
    const match = part.trim().match(/^<([^>]+)>;\\s*rel="([^"]+)"/);
    if (match) result[match[2]] = match[1];
  }
  return result;
}

const header = '<https://api.example.com/users?page=2>; rel="next", <https://api.example.com/users?page=1>; rel="first"';
console.log(parseLinkHeader(header));
// { next: 'https://api.example.com/users?page=2', first: 'https://api.example.com/users?page=1' }

// A client can now navigate purely from the header, with zero
// knowledge of the URL's own query-parameter structure:
async function fetchNextPage(response: Response) {
  const links = parseLinkHeader(response.headers.get('Link') ?? '');
  if (!links.next) return null; // no more pages
  return fetch(links.next);
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A client using <code>parseLinkHeader</code> above checks <code>links.next</code> to decide whether another page exists. Trace what happens on the LAST page of results, where the server-side <code>buildLinkHeader</code> call never includes a <code>next</code> entry at all — does the client’s check work correctly?',
  hint: 'What does <code>parseLinkHeader</code> return for a <code>rel</code> value that never appeared anywhere in the header string it was given?',
  solution: `// On the last page, the server's own links array (built in the
// first codeTab) only includes 'first' and 'prev' -- the ternary
// spread for 'next' evaluates to an empty array since page < pages
// is false. The resulting Link header string simply never contains
// a rel="next" entry at all.

// parseLinkHeader only adds a key to its result object when its
// regex actually MATCHES a rel="..." entry in the header -- there is
// no default or fallback value inserted for a rel that never
// appeared. So links.next is simply undefined (the key doesn't exist
// on the object at all), and "if (!links.next) return null" in
// fetchNextPage correctly resolves to null, telling the client
// there is no next page.

// This works correctly specifically BECAUSE the server never
// fabricates a next link that doesn't apply -- the same
// state-conditional-links discipline the main page's own mistakes
// block already establishes for _links bodies (only including
// "cancel" on pending orders, for example) applies equally here, just
// expressed through which rel values appear in the header at all
// rather than which keys appear in a JSON body.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The Link header and a HAL-style _links body are two competing, mutually exclusive approaches — an API has to pick one or the other.',
    reality: 'They can coexist on the SAME response — the main page’s own QnA on HATEOAS ROI recommends exactly this as a practical middle ground: use Link headers for well-understood pagination relations, while the JSON body itself can stay completely plain (as the codeTab above does) or still include its own <code>_links</code> for other, resource-specific relations.',
  },
  {
    thought: 'A client needs to understand the API’s specific URL query-parameter conventions (like ?page= and &limit=) to navigate using the Link header.',
    reality: 'The whole point demonstrated in the second codeTab is the opposite — <code>parseLinkHeader</code> extracts a ready-to-fetch, complete URL for each relation, and the client never inspects or constructs a query string itself. The URL structure is entirely the server’s concern.',
  },
  {
    thought: 'RFC 8288’s Link header can only carry pagination relations like next/prev/first/last.',
    reality: 'The main page’s own theory names several other standard relations the same mechanism supports — <code>self</code> for the current resource, <code>alternate</code> for other representations, <code>describedby</code> for API documentation — <code>rel</code> is an open, IANA-registered vocabulary, not a fixed pagination-only list.',
  },
];

@Component({
  selector: 'app-api-hateoas-link-header',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './pagination-via-the-link-header-rfc-8288.html',
  styleUrl: './pagination-via-the-link-header-rfc-8288.scss',
})
export class PaginationViaTheLinkHeaderRfc8288Subtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
