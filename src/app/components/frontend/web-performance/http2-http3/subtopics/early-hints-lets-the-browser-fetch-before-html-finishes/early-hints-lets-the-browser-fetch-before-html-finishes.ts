import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './early-hints-lets-the-browser-fetch-before-html-finishes.html',
  styleUrl: './early-hints-lets-the-browser-fetch-before-html-finishes.scss'
})
export class EarlyHintsLetsTheBrowserFetchBeforeHtmlFinishesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A normal response has exactly one status code — Early Hints lets the server send a SECOND, earlier response for the same request',
      points: [
        'Normally, a request gets one HTTP response: the server does whatever work it needs (query a database, render a template, call an API) and THEN sends a single <code>200 OK</code> with the full HTML.',
        'A <code>103 Early Hints</code> response is a genuinely separate, earlier response the server can send for the SAME request, before the real response is ready — containing only <code>Link</code> headers, no body. The browser processes these hints immediately, then keeps waiting for the eventual <code>200</code>.',
        'This closes a real, common gap: if the server takes 400ms to generate HTML (a slow database query, a template render), the browser previously could not discover ANY of the page\'s CSS/font/image URLs until that full 400ms elapsed and the HTML itself started arriving — Early Hints lets it start those fetches immediately, in parallel with the server still working.',
      ]
    },
    {
      heading: 'Early Hints is not "faster Server Push" — it uses the browser\'s own cache logic, unlike Push',
      points: [
        'HTTP/2 Server Push (the main page\'s earlier, now-discouraged technique) had the server unilaterally shove resources at the client — with no way to know if the client already had them cached, frequently wasting bandwidth on already-cached assets.',
        'A <code>103 Early Hints</code> response contains ordinary <code>Link: &lt;url&gt;; rel=preload</code> headers — the exact same hint the browser already knows how to evaluate against its own cache. If the resource is already cached, the browser simply does not re-fetch it. Early Hints gets the TIMING benefit of Push (starting the fetch earlier) without Push\'s cache-blindness problem.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The timeline without Early Hints',
      language: 'bash',
      code: `# Without Early Hints — everything waits for the full response
t=0ms    Browser sends GET /
t=0ms    Server starts querying database, rendering template...
t=400ms  Server finally sends 200 OK with the full HTML
t=400ms  Browser starts parsing HTML, discovers <link>/<img> tags
t=400ms  Browser starts fetching CSS, fonts, hero image
t=550ms  CSS/fonts/image download complete
t=560ms  First paint

# Total time to first paint: ~560ms
# The 400ms server-processing time is spent doing NOTHING browser-side`,
    },
    {
      label: 'The timeline WITH Early Hints',
      language: 'bash',
      code: `# With Early Hints — asset discovery happens DURING server processing
t=0ms    Browser sends GET /
t=5ms    Server immediately sends 103 Early Hints with Link headers
t=5ms    Browser starts fetching CSS, fonts, hero image RIGHT NOW
t=5-155ms  CSS/fonts/image download IN PARALLEL with server still working
t=400ms  Server finally sends 200 OK with the full HTML
t=400ms  Browser parses HTML — CSS/fonts/image are ALREADY cached/ready
t=410ms  First paint (only waiting on HTML parse, not asset downloads)

# Total time to first paint: ~410ms — the 150ms asset download time
# was fully hidden behind the server's own 400ms processing time`,
    },
    {
      label: 'Server config (Nginx)',
      language: 'bash',
      code: `server {
    listen 443 ssl http2;
    server_name example.com;

    location / {
        # These Link headers are sent as a 103 Early Hints response
        # BEFORE the proxied backend even starts responding
        add_header Link "</css/styles.css>; rel=preload; as=style" always;
        add_header Link "</fonts/inter.woff2>; rel=preload; as=font; crossorigin" always;
        add_header Link "</img/hero.avif>; rel=preload; as=image; fetchpriority=high" always;

        # Requires Nginx 1.25.1+ with ngx_http_v2_module for 103 support
        proxy_pass http://slow_app_server;  # the 400ms backend
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A news site\'s homepage has a genuinely slow TTFB (~600ms) because it aggregates data from several internal services before rendering. The team wants to improve perceived load speed without touching the slow backend logic at all — that refactor is scheduled for next quarter. Is there a purely infrastructure-level change that could help right now?',
    hint: 'Ask whether the browser needs to wait for the full 600ms response before it can start downloading the CSS, fonts, and hero image the page will need regardless of what the backend eventually returns.',
    solution: 'Yes — enabling 103 Early Hints at the reverse proxy/CDN layer (Cloudflare, Fastly, or Nginx 1.25.1+) lets the server send Link: rel=preload headers for the page\'s known-static assets (main stylesheet, critical fonts, hero image) immediately, before the slow 600ms backend aggregation finishes. The browser starts downloading those assets in parallel with the backend still working, so by the time the actual HTML arrives, the assets are already cached and ready — hiding some or all of the asset-download time behind the existing slow TTFB, with zero changes to the backend aggregation logic itself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Early Hints (103) is just a renamed version of HTTP/2 Server Push — same idea, new number.',
      reality: 'They work fundamentally differently: Server Push unilaterally sends resource DATA regardless of cache state, while Early Hints sends only Link headers that the browser evaluates against its own cache exactly like a normal preload — the browser decides whether to actually fetch anything.'
    },
    {
      thought: 'Early Hints requires rewriting application/backend code to generate the hint headers as part of the response logic.',
      reality: 'It is typically implemented entirely at the reverse proxy/CDN layer (Nginx, Cloudflare, Fastly) — the origin application server can stay completely unmodified while the proxy in front of it sends the 103 response before the slow backend even replies.'
    },
    {
      thought: 'Early Hints only helps pages with fast servers — if TTFB is already slow, there is nothing left to optimise at the network-hint level.',
      reality: 'It is precisely the opposite — Early Hints delivers the MOST benefit on pages with genuinely slow TTFB, since a slower backend means more asset-download time can be hidden behind the existing wait, while a page with a already-fast TTFB has little idle time to fill in the first place.'
    }
  ];
}
