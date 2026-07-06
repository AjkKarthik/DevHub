import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-contextual-encoding-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './contextual-encoding-html-encode-doesnt-protect-attributes-or-js.html',
  styleUrl: './contextual-encoding-html-encode-doesnt-protect-attributes-or-js.scss',
})
export class ContextualEncodingHtmlEncodeDoesntProtectAttributesOrJsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own guidance — "encode with HtmlEncoder.Default.Encode(userInput)" and "encode at the point of use... HTML encode for Razor, JSON-escape for JSON, parameterise for SQL" — names three contexts, but HTML alone actually has at least THREE distinct sub-contexts, and HtmlEncoder only protects one of them',
      points: [
        '<code>HtmlEncoder.Encode()</code> escapes characters that are dangerous in an HTML TEXT NODE — <code>&lt;</code>, <code>&gt;</code>, <code>&amp;</code>, quotes. This is exactly right for the main page\'s own example — <code>&lt;h1&gt;Hello {safe}&lt;/h1&gt;</code>, where the untrusted value sits BETWEEN tags. It does <strong>not</strong> make a string safe to insert into an unquoted HTML ATTRIBUTE value (<code>&lt;div class={value}&gt;</code>), where a space or <code>=</code> in the input can inject a NEW attribute like <code>onmouseover=alert(1)</code> without ever needing an angle bracket.',
        'A string HTML-encoded and then placed inside an inline <code>&lt;script&gt;</code> block, or inside a JavaScript event-handler attribute (<code>onclick="doSomething(\'{value}\')"</code>), is <strong>doubly wrong</strong>: HTML entities like <code>&amp;#39;</code> are not decoded by the JavaScript parser the way they are by the HTML parser in a text node, so the encoding either does nothing useful against a JS-context injection, or breaks the intended value outright. The correct encoder for that sink is <code>JavaScriptEncoder</code> (or, in ASP.NET Core, <code>System.Text.Encodings.Web.JavaScriptEncoder</code>), which escapes characters meaningful to the JS STRING LITERAL grammar — a completely different escaping ruleset from HTML entity encoding.',
      ],
    },
    {
      heading: 'This is the OWASP-documented principle of "contextual output encoding" — the correct encoder is determined by WHERE in the document the untrusted value lands, not by "what kind of page" the response is (HTML page vs. JSON API)',
      points: [
        'ASP.NET Core\'s <code>System.Text.Encodings.Web</code> namespace ships (at least) three purpose-built encoders for exactly this reason: <code>HtmlEncoder</code> (text nodes and, with care, double-quoted attribute values), <code>JavaScriptEncoder</code> (values embedded inside a <code>&lt;script&gt;</code> block or inline JS attribute), and <code>UrlEncoder</code> (values embedded in a URL query string or path segment). Picking the wrong one for the sink the value actually lands in reintroduces an XSS vector even though "the input was encoded" — the encoding just protected against the wrong grammar.',
        'Razor\'s automatic <code>@value</code> encoding, which the main page correctly calls out as safe, is safe specifically because Razor KNOWS the syntactic context at compile time (it is generating a text node) and picks <code>HtmlEncoder</code> accordingly. The moment a developer manually builds an HTML string in a minimal API (as the main page\'s own "Minimal API returning HTML" code tab does), NOTHING automatically tracks context anymore — the developer must consciously choose the matching encoder for wherever the value is being interpolated, and a single call to <code>HtmlEncoder.Encode()</code> for the WHOLE string is not enough if that string mixes text-node and attribute-value insertion points.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own example, extended into an attribute-context sink',
      language: 'csharp',
      code: `// The main page's SAFE example — value lands in a TEXT NODE:
app.MapGet("/greet", (string name, HtmlEncoder encoder) =>
{
    var safe = encoder.Encode(name);
    return Results.Content($"<h1>Hello {safe}</h1>", "text/html");
    // HtmlEncoder correctly neutralizes <script> etc. HERE, because
    // the sink is text between tags.
});

// THE SAME encoder, applied to a DIFFERENT sink — an HTML ATTRIBUTE —
// is NOT sufficient:
app.MapGet("/profile-card", (string avatarUrl, HtmlEncoder encoder) =>
{
    var safe = encoder.Encode(avatarUrl);
    // VULNERABLE despite "encoding" — avatarUrl inserted into an
    // UNQUOTED attribute value:
    return Results.Content(
        $"<img src={safe} class=avatar>", "text/html");
    // Attacker input: x onerror=alert(document.cookie)
    // HtmlEncoder does NOT escape spaces or '=' — neither is
    // dangerous in a text node, but BOTH are exactly what's needed
    // to break out of an unquoted attribute and inject a new one.
    // Result: <img src=x onerror=alert(document.cookie) class=avatar>
});

// THE FIX — quote the attribute (removes the unquoted-attribute
// injection vector) AND still HTML-encode the value (handles quotes
// and angle brackets WITHIN the now-quoted attribute):
app.MapGet("/profile-card", (string avatarUrl, HtmlEncoder encoder) =>
{
    var safe = encoder.Encode(avatarUrl);
    return Results.Content(
        $"<img src=\\"{safe}\\" class=\\"avatar\\">", "text/html");
    // Quoting + HTML-encoding together neutralize the attribute-
    // context injection — HtmlEncoder DOES escape a literal " that
    // would otherwise close the quoted attribute early.
});`,
    },
    {
      label: 'The JavaScript-context sink — HtmlEncoder is the wrong tool entirely',
      language: 'csharp',
      code: `// VULNERABLE — HTML-encoding a value destined for an inline <script>
// block or JS event-handler attribute does not protect the JS grammar:
app.MapGet("/widget", (string userName, HtmlEncoder htmlEncoder) =>
{
    var htmlEncoded = htmlEncoder.Encode(userName);
    return Results.Content($$"""
        <script>
          var greeting = "Hello, {{htmlEncoded}}!";
        </script>
        """, "text/html");
    // Attacker input: "; alert(document.cookie); var x="
    // HtmlEncoder leaves the double-quote UNESCAPED as far as JS
    // parsing is concerned in some encodings, and even where quotes
    // ARE entity-encoded, the BROWSER'S JAVASCRIPT PARSER (not its
    // HTML parser) reads the <script> block's text content raw — HTML
    // entities are not decoded inside <script>, so &quot; renders
    // LITERALLY as six characters, not as a quote. Depending on the
    // exact bytes, this either breaks the intended string or, worse,
    // some injection payloads still successfully terminate the JS
    // string literal using characters HtmlEncoder was never designed
    // to escape for a JS grammar (backslash, in particular).

// SAFE — use JavaScriptEncoder, which escapes for JS STRING LITERAL
// syntax specifically (backslash, quote, newline, U+2028/U+2029, etc.):
app.MapGet("/widget", (string userName, JavaScriptEncoder jsEncoder) =>
{
    var jsEncoded = jsEncoder.Encode(userName);
    return Results.Content($$"""
        <script>
          var greeting = "Hello, {{jsEncoded}}!";
        </script>
        """, "text/html");
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer builds a "Report a bug" page where the current page URL is embedded into a hidden form field: <input type="hidden" name="returnUrl" value="{encoded}">, using HtmlEncoder.Encode() on the URL before interpolating. They argue this is safe because HtmlEncoder handles quotes, which is the only character that matters for a quoted attribute. Identify what additional encoding step this scenario actually needs, thinking about what the VALUE ITSELF represents, not just the HTML syntax around it.',
    hint: 'The attribute quoting/encoding question ("is this string safely embedded as HTML") is separate from a SECOND question: "is this string a well-formed and safe URL in the first place?" Does HtmlEncoder validate or sanitize the semantic content of a URL string at all?',
    solution: `HtmlEncoder.Encode() is doing its job correctly for the HTML-syntax
question — it does make the string safe to sit inside a quoted HTML
attribute (escaping quotes and angle brackets so the attribute can't
be broken out of). But that is an entirely different question from
"is this a safe URL," and HtmlEncoder does nothing to answer that
second question at all.

A URL value being embedded into a form field is itself a potential
injection vector for a DIFFERENT class of attack: if that returnUrl
is later read server-side and used to REDIRECT the user (exactly the
open-redirect scenario the main page covers in its own "Path Traversal
& Open Redirects" section), no amount of HTML-encoding the value for
DISPLAY purposes protects against the URL being a malicious external
destination once it's read back and acted upon. HtmlEncoder answers
"can this string safely sit inside this HTML document without breaking
out of its syntax" — it has no concept of "is the STRING'S OWN MEANING
(a URL, a SQL fragment, a file path) dangerous once some OTHER code
reads it back and uses it for its intended purpose."

The concrete fix layers two independent defenses, matching this
subtopic's core lesson that context determines the encoder: (1)
HtmlEncoder.Encode() to safely embed the value as HTML attribute text
— this subtopic's topic; and (2) validate the returnUrl against the
LocalRedirect()/Url.IsLocalUrl() pattern from the main page's own
open-redirect section BEFORE ever using it in a Response.Redirect() —
a completely separate concern from how the value is rendered in the
form. Encoding for display and validating for safe USE are two
different jobs; doing one does not substitute for the other.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'calling HtmlEncoder.Encode() on untrusted input before inserting it anywhere in an HTML response is sufficient to prevent XSS, regardless of exactly where in the markup the value lands.',
      reality: 'HtmlEncoder protects a TEXT NODE context correctly, but an unquoted HTML attribute can still be broken out of using spaces and equals signs that HtmlEncoder does not escape, and a value embedded inside a <script> block or JS event-handler attribute needs JavaScriptEncoder instead — HTML entities are not decoded by the JavaScript parser.',
    },
    {
      thought: 'ASP.NET Core / the .NET encoding library ships one general-purpose "HTML encoder" that is the correct tool for any value ending up somewhere in an HTML page.',
      reality: 'System.Text.Encodings.Web ships distinct HtmlEncoder, JavaScriptEncoder, and UrlEncoder types specifically because each targets a different sink grammar; picking HtmlEncoder for a JS-context or URL-context sink reintroduces an injection vector even though the value was technically "encoded."',
    },
    {
      thought: 'Razor\'s automatic @value encoding proves that a single universal encoding function is enough to make output safe, so manually building HTML in a minimal API should follow the same one-function pattern.',
      reality: 'Razor\'s auto-encoding is safe specifically because the Razor COMPILER knows the syntactic context (a text node) at compile time and applies the matching encoder automatically — a manually assembled HTML string in a minimal API has no such compile-time context tracking, so the developer must consciously match the encoder to each interpolation point\'s actual sink.',
    },
  ];
}
