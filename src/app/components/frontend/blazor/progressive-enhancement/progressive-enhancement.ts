import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-blazor-progressive-enhancement',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './progressive-enhancement.html',
  styleUrl: './progressive-enhancement.scss'
})
export class BlazorProgressiveEnhancement {
  quickRef: QuickRefItem[] = [
    { name: 'Static SSR', type: 'keyword', desc: 'Server renders HTML — works without JavaScript.' },
    { name: '@formaction', type: 'syntax', desc: 'Overrides form action per button — SSR form routing.' },
    { name: 'method="post"', type: 'syntax', desc: 'Standard HTML POST form — works without JS.' },
    { name: '@formname', type: 'syntax', desc: 'Names a form for [SupplyParameterFromForm] binding.' },
    { name: '[SupplyParameterFromForm]', type: 'decorator', desc: 'Binds POST body to a parameter on a Static SSR page.' },
    { name: 'Enhanced forms', type: 'keyword', desc: 'Blazor intercepts form submits for SPA-like updates with JS.' },
    { name: 'data-enhance', type: 'syntax', desc: 'Opt-in attribute for enhanced form submission on a form.' },
    { name: 'Enhanced navigation', type: 'keyword', desc: 'Client-side content swap on link clicks — falls back without JS.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is progressive enhancement?',
      points: ['Progressive enhancement means building the functional core to work without JavaScript, then layering JS enhancements on top. In Blazor, Static SSR pages render full HTML server-side — forms POST, links navigate — all without any client-side script. Enhanced navigation and enhanced forms are opt-in JavaScript layers that make these interactions faster (no full-page reload) when JS is available, while the base functionality degrades gracefully without it.',
      'Static SSR works without JavaScript — pure HTTP request/response.', 'Enhanced navigation adds SPA-like link handling as a progressive layer.', 'Enhanced forms intercept submits for smoother updates when JS runs.', 'Accessibility-first: screen readers and keyboard users rely on this baseline.']
    },
    {
      heading: 'SSR forms — POST without JavaScript',
      points: ['Static SSR forms use `method="post"` and `@formname` for .NET\'s model binding via `[SupplyParameterFromForm]`. Multiple submit buttons can target different handlers using `@formaction`. The antiforgery token is injected automatically. No JavaScript is required — the browser sends a standard HTTP POST and gets a new HTML response. When JS loads, Blazor\'s enhanced forms intercept the submit and swap only the changed portion.',
      'method="post" + @formname enables standard HTML form submission.', '[SupplyParameterFromForm] binds the POST body to a C# property.', '@formaction on a button targets a specific form handler.', 'Antiforgery tokens are injected automatically in .NET 8.']
    },
    {
      heading: 'When to use enhanced vs plain forms',
      points: ['Use `data-enhance` on forms that benefit from partial page updates — search boxes, filter forms, pagination. Avoid it for forms that need the full page lifecycle (login redirects, payment flows). For full page navigation after submit, use a plain form without `data-enhance` so the redirect response loads cleanly. Always test the no-JS fallback for any form used in critical user flows.',
      'data-enhance enables enhanced form submission on a per-form basis.', 'Forms with redirect-on-success should stay as plain forms.', 'Test the no-JS path for all critical forms.', 'Enhanced navigation is on by default; opt out with data-enhance-nav="false".']
    },
    {
      heading: 'Balancing Enhanced Navigation with Full Interactivity',
      points: [
        'Static Server-Side Rendering with enhanced navigation provides fast, SEO-friendly initial page loads with SPA-like navigation, but the page has no persistent interactive state — form validation feedback and dynamic UI updates require either full page reloads or upgrading specific components to an interactive render mode.',
        'A common progressive enhancement strategy renders most of a page as Static SSR for speed and SEO, while opting individual interactive widgets (a shopping cart icon, a live search box) into InteractiveServer or InteractiveWebAssembly render mode — getting the performance benefits of static rendering everywhere it is not needed.',
        'Testing that a page genuinely degrades gracefully without JavaScript (disabling JS in browser dev tools and verifying core functionality like navigation and form submission still work) validates that the progressive enhancement is actually functioning as intended, not just theoretically present.',
        'Progressive enhancement particularly benefits users on slow connections or older devices, and improves resilience against a JavaScript error anywhere on the page breaking the entire application — a philosophy of "core functionality works without JS, enhanced functionality layers on top" produces more robust applications overall.',
      ],
    },
    {
      heading: 'Enhanced Forms and Progressive Form Submission',
      points: [
        'A standard HTML form (with correct method and action attributes) submits and works correctly even with JavaScript entirely disabled — a genuine progressive enhancement baseline, since it functions as a normal browser form submission without any dependency on client-side script.',
        'When the Blazor enhancement script is active, form submissions are intercepted and handled via a background fetch with DOM patching instead of a full page reload — improving perceived responsiveness for users with JavaScript enabled, without requiring a separate implementation for the no-JS fallback case.',
        'Enhanced form submission preserves scroll position and avoids the visual flash of a full page reload, closely approximating an SPA-like experience while the underlying implementation remains a standard, accessible HTML form that degrades gracefully.',
        'Testing both the enhanced (JS-enabled) and baseline (JS-disabled) submission paths ensures the progressive enhancement genuinely works as intended — a form that silently breaks with JS disabled (perhaps due to a client-side-only validation check with no server-side equivalent) fails the core promise of progressive enhancement.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SSR form — no JS required',
      language: 'csharp',
      code: `@page "/newsletter"

@if (subscribed)
{
    <p>Thanks for subscribing!</p>
}
else
{
    <EditForm Model="model" method="post" FormName="newsletter" OnValidSubmit="Subscribe">
        <DataAnnotationsValidator />
        <InputText @bind-Value="model.Email" placeholder="your@email.com" />
        <ValidationMessage For="() => model.Email" />
        <button type="submit">Subscribe</button>
    </EditForm>
}

@code {
    [SupplyParameterFromForm]
    private NewsletterModel model { get; set; } = new();
    private bool subscribed;

    private void Subscribe() { subscribed = true; }
}

public class NewsletterModel
{
    [Required, EmailAddress] public string Email { get; set; } = "";
}`
    },
    {
      label: 'Multiple form actions',
      language: 'csharp',
      code: `@page "/cart"

<form method="post">
    <AntiforgeryToken />
    @foreach (var item in cart.Items)
    {
        <div>
            @item.Name
            <button type="submit"
                    @formaction="@($"/cart/remove/{item.Id}")"
                    formmethod="post">
                Remove
            </button>
        </div>
    }
    <button type="submit" @formaction="/checkout">Checkout</button>
</form>`
    },
    {
      label: 'Enhanced form (JS layer)',
      language: 'csharp',
      code: `<!-- Add data-enhance to opt into enhanced form behaviour -->
<EditForm Model="search" method="post" FormName="search"
          OnValidSubmit="Search" data-enhance>
    <InputText @bind-Value="search.Query" />
    <button type="submit">Search</button>
</EditForm>

@if (results is not null)
{
    @foreach (var r in results)
    {
        <p>@r.Title</p>
    }
}

@code {
    [SupplyParameterFromForm]
    private SearchModel search { get; set; } = new();
    private List<SearchResult>? results;
    private async Task Search()
        => results = await SearchService.QueryAsync(search.Query);
}`
    },
    {
      label: 'Opt-out enhanced navigation',
      language: 'csharp',
      code: `<!-- Default: enhanced navigation (intercepts link click) -->
<a href="/products">Products</a>

<!-- Opt out: triggers full-page reload -->
<a href="/login" data-enhance-nav="false">Login</a>

<!-- Opt out on a form submit redirect -->
<form method="post" action="/logout">
    <AntiforgeryToken />
    <button type="submit">Logout</button>
</form>
<!-- No data-enhance — full reload ensures cookie middleware runs -->`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using @onclick for all interactions on SSR pages',
      wrong: '<button @onclick="DeleteItem">Delete</button>  // on Static SSR page',
      right: '// Use a form with method="post" and @formaction for destructive actions on SSR',
      explanation: '@onclick requires JavaScript. On Static SSR without JS, the button does nothing. Use HTML POST forms for all state-mutating actions on SSR pages.'
    },
    {
      title: 'Forgetting AntiforgeryToken in plain HTML forms',
      wrong: '<form method="post" action="/submit">\n    <button>Submit</button>\n</form>',
      right: '<form method="post" action="/submit">\n    <AntiforgeryToken />\n    <button>Submit</button>\n</form>',
      explanation: 'EditForm injects antiforgery automatically. Plain <form> elements need an explicit <AntiforgeryToken /> component or the request will be rejected with 400.'
    },
    {
      title: 'Using data-enhance on forms that redirect after submit',
      wrong: '<form method="post" action="/login" data-enhance>\n    <!-- login form -->\n</form>',
      right: '<form method="post" action="/login">\n    <!-- no data-enhance on login -->\n</form>',
      explanation: 'Enhanced forms intercept the response and swap page content via fetch. A same-origin redirect only updates the URL through the JS History API rather than a genuine page reload, so the circuit never freshly re-initializes — and a redirect to an external origin (a common OAuth login flow) makes the fetch response opaque, causing enhanced form handling to fail outright rather than follow it.'
    },
    {
      title: 'Not testing the no-JS fallback',
      wrong: '// Testing only with JavaScript enabled',
      right: '// Disable JS in DevTools and verify all critical flows (submit, navigate) still work',
      explanation: 'Progressive enhancement is only meaningful if the baseline works without JS. Always test the no-JS path — it also catches crawlers and accessibility tools that do not execute scripts.'
    },
    {
      title: 'Mixing SSR form with @onclick event handlers',
      wrong: '<EditForm method="post" OnValidSubmit="Submit">\n    <button @onclick="Extra">Submit</button>',
      right: '// Keep SSR forms pure — move interactive behaviour to an interactive component or a separate JS snippet',
      explanation: 'An @onclick on a Static SSR form only runs when JS is available. This creates an inconsistency — the form submits via POST (no JS) but the onclick never fires. Separate concerns clearly.'
    },
  ];

  challenge: Challenge = {
    title: 'No-JS Contact Form',
    language: 'csharp',
    description: 'Build a contact form at /contact that works without JavaScript. It should have Name, Email, and Message fields. On valid submit (POST), show a "Thank you" message on the same page. Add data-enhance to also support the enhanced (no-reload) experience when JS is available. Validate with DataAnnotations.',
    hints: [
      'Use [SupplyParameterFromForm] to bind the POST body.',
      'Render either the form or the thank-you message based on a bool flag.',
      'Add data-enhance to the EditForm for the JS enhancement layer.',
    ],
    starterCode: `@page "/contact"

<!-- TODO: show form or thank-you message -->

@code {
    [SupplyParameterFromForm]
    private ContactForm form { get; set; } = new();
    private bool sent;
    private void Send() { sent = true; }
}

public class ContactForm
{
    [Required] public string Name { get; set; } = "";
    [Required, EmailAddress] public string Email { get; set; } = "";
    [Required, MinLength(10)] public string Message { get; set; } = "";
}`,
    solution: `@page "/contact"

@if (sent)
{
    <h2>Thank you, @form.Name!</h2>
    <p>We'll reply to @form.Email shortly.</p>
}
else
{
    <h1>Contact Us</h1>
    <EditForm Model="form" method="post" FormName="contact"
              OnValidSubmit="Send" data-enhance>
        <DataAnnotationsValidator />

        <label>Name</label>
        <InputText @bind-Value="form.Name" />
        <ValidationMessage For="() => form.Name" />

        <label>Email</label>
        <InputText @bind-Value="form.Email" />
        <ValidationMessage For="() => form.Email" />

        <label>Message</label>
        <InputTextArea @bind-Value="form.Message" rows="5" />
        <ValidationMessage For="() => form.Message" />

        <button type="submit">Send Message</button>
    </EditForm>
}

@code {
    [SupplyParameterFromForm]
    private ContactForm form { get; set; } = new();
    private bool sent;
    private void Send() { sent = true; }
}`
  };

  quiz: QuizQuestion[] = [
    { q: 'What does progressive enhancement mean in Blazor?', options: ['Loading components lazily', 'Building a functional baseline that works without JS, enhanced when JS loads', 'Using Server-side rendering only', 'Enabling streaming rendering on all pages'], answer: 1, explanation: 'Progressive enhancement means Static SSR provides a working baseline (form posts, link navigation) and JavaScript layers enhance it (SPA-like updates, enhanced forms).' },
    { q: 'How do you make a Blazor form work without JavaScript?', options: ['Use @onclick', 'Use method="post" + [SupplyParameterFromForm]', 'Use InteractiveServer', 'Use JS interop'], answer: 1, explanation: 'A form with method="post" submits via HTTP POST — no JS needed. [SupplyParameterFromForm] binds the POST body to a C# property on the Static SSR page.' },
    { q: 'What does data-enhance do on a form?', options: ['Adds animations', 'Enables client-side JS interception for smoother updates', 'Adds antiforgery protection', 'Enables streaming'], answer: 1, explanation: 'data-enhance opts a form into Blazor\'s enhanced form handling — JS intercepts the submit and swaps only the changed content, avoiding a full-page reload.' },
    { q: 'Which form type should NOT have data-enhance?', options: ['Search forms', 'Filter forms', 'Login/logout forms with redirect', 'Newsletter signup'], answer: 2, explanation: 'Login and logout flows often redirect to an external identity provider. Enhanced form handling submits via fetch, and a redirect to an external origin makes that response opaque — causing the enhanced submission to fail outright instead of following it like a normal browser navigation would.' },
    { q: 'What must plain HTML forms include that EditForm adds automatically?', options: ['CSRF token', 'AntiforgeryToken', 'Hidden submit field', 'Session cookie'], answer: 1, explanation: 'EditForm injects antiforgery tokens automatically. Plain <form> elements need an explicit <AntiforgeryToken /> component or .NET will reject the POST with 400.' },
    { q: 'A <form> submits with method="get" and has enhanced navigation active. Compared to a method="post" form, does enhanced handling behave any differently?', options: ['Identically in every respect', 'GET form submissions are treated like link navigations (URL changes, back button works, bookmarkable) while still being intercepted and content-swapped rather than full-reloaded; POST submissions are not bookmarkable and rely on server-side redirect-after-post for the same back-button safety', 'GET forms cannot be enhanced at all', 'POST forms always bypass enhancement regardless of configuration'], answer: 1, explanation: 'Enhanced navigation treats a GET form submission much like clicking a link with query parameters — the resulting URL reflects the GET parameters, so it is bookmarkable and the back button works naturally, while still being intercepted for a DOM-patch update instead of a full page reload. A POST form submission does not produce a URL that encodes the submitted data, so without an explicit redirect-after-post pattern on the server, using the back button after a POST can risk re-submitting the form — the same classic web caveat that predates Blazor, still relevant even with enhancement active.' },
  ];

  qna: QnaItem[] = [
    { q: 'Is progressive enhancement only for accessibility?', a: 'No — it also benefits search engine crawlers (which may not run JS), low-end devices with slow JS parsing, corporate networks that block JS, and browser extensions that interfere with scripts. It is a resilience strategy, not just an accessibility one.' },
    { q: 'Can I mix Static SSR and interactive components on the same page?', a: 'Yes. A Static SSR page can embed interactive islands: `<Counter @rendermode="InteractiveServer" />`. The page HTML loads without JS; the interactive island bootstraps once JS loads. This gives the best of both worlds — fast initial load and rich interactivity.' },
    { q: 'How is enhanced navigation different from a traditional SPA?', a: 'Enhanced navigation preserves the server-rendering model — each navigation still hits the server and gets a full HTML response. The client just swaps the content without re-parsing scripts and styles. A traditional SPA routes entirely client-side and never returns to the server for navigation.' },
    { q: 'Do I need to configure anything for enhanced navigation?', a: 'No — it is enabled by default when blazor.web.js is included. Opt individual links out with data-enhance-nav="false".' },
    { q: 'What does "enhanced navigation" mean in Blazor with Static Server-Side Rendering (SSR), and what problem does it solve?',
      a: 'In .NET 8\'s Static SSR mode, Blazor pages render as plain HTML with no persistent circuit — by default, every link click triggers a full page reload, similar to a traditional MVC app. Enhanced navigation (enabled by default with the Blazor script) intercepts link clicks and form submissions, fetching just the updated page content via a background fetch and patching the existing DOM rather than a full page reload, giving an SPA-like fast navigation experience while keeping the simplicity and SEO benefits of server-rendered static HTML.' },
    { q: 'What is progressive enhancement\'s relationship to Blazor\'s "enhanced forms" feature?',
      a: 'Enhanced forms in Blazor build on the same idea as enhanced navigation — a form with proper HTML method/action attributes works correctly even with JavaScript disabled (a true progressive enhancement baseline, since it is just a standard HTML form submission), but when the Blazor enhancement script is active, form submissions are intercepted and handled via a background fetch with DOM patching instead of a full page reload, improving the experience for users with JS enabled without requiring a different implementation for the no-JS case.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Progressive enhancement in Blazor means Static SSR pages function without JavaScript — form POSTs and link navigation work natively — with enhanced forms and navigation as opt-in JS layers.',
    mustKnow: [
      'Static SSR + method="post" gives a JS-free working baseline.',
      '[SupplyParameterFromForm] binds POST body to a C# parameter.',
      'data-enhance on a form opts in to enhanced (no-reload) submission.',
      'Enhanced navigation is the default — opt out with data-enhance-nav="false".',
      'Never use data-enhance on forms that redirect after login/logout.',
      'Always test the no-JS fallback for critical user flows.',
    ],
    interviewFocus: [
      'How does a Blazor Static SSR form work without JavaScript?',
      'What is the difference between a plain POST form and an enhanced form?',
      'Why should login forms not use data-enhance?',
    ]
  };
}
