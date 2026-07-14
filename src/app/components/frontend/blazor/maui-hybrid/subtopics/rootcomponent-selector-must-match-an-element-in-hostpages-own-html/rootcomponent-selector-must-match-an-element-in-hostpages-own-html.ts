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
  templateUrl: './rootcomponent-selector-must-match-an-element-in-hostpages-own-html.html',
  styleUrl: './rootcomponent-selector-must-match-an-element-in-hostpages-own-html.scss'
})
export class RootcomponentSelectorMustMatchAnElementInHostpagesOwnHtmlSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'RootComponent.Selector is a genuine CSS selector, matched against the ACTUAL HTML markup inside HostPage — not a symbolic name Blazor invents on its own',
      points: [
        'The main page\'s code sample shows Selector="#app", which is easy to read as just a conventional Blazor identifier — it is actually a real CSS selector, evaluated by the embedded WebView\'s own DOM against whatever elements genuinely exist in HostPage\'s (wwwroot/index.html\'s) own markup, exactly the same mechanism a JavaScript SPA framework uses to mount itself into a specific DOM element.',
        'This means the HostPage HTML file must contain an element that GENUINELY matches the selector — typically a &lt;div id="app"&gt;&lt;/div&gt; for Selector="#app" — for the Blazor component tree to have anywhere to actually render into; the selector and the markup are two independently-editable things that must agree with each other, not a single concept Blazor manages automatically.',
      ]
    },
    {
      heading: 'What happens when the selector and the markup genuinely disagree — another largely silent failure mode',
      points: [
        'If Selector references an id/class that does not exist anywhere in HostPage\'s actual HTML (a typo, or the &lt;div&gt; was accidentally removed while editing the HTML file), the Blazor component tree has been successfully bootstrapped by the WebView (unlike the HostPage-path failure, which prevents the page from loading AT ALL) — but it has nowhere to mount, so the RESULT is a WebView showing whatever static HTML the HostPage file already contained around the missing mount point, with no Blazor UI ever appearing, and again typically no loud .NET exception surfacing to explain why.',
        'This is a genuinely different failure signature than the HostPage-path mistake: a wrong HostPage path shows a COMPLETELY blank screen (the WebView never loaded anything at all), while a mismatched Selector shows the STATIC parts of index.html\'s own markup (any hardcoded loading text, styling, or other elements) with the dynamic Blazor content simply never appearing where it was supposed to — a subtle but genuinely useful diagnostic distinction when debugging "nothing is showing up."',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Selector and markup must genuinely agree',
      language: 'csharp',
      code: `<!-- wwwroot/index.html — the HostPage file -->
<!DOCTYPE html>
<html>
<head><title>MyApp</title></head>
<body>
    <div id="app">Loading...</div>
    <!-- ↑ This element GENUINELY exists in the actual HTML —
         "Loading..." is placeholder text shown before Blazor
         finishes bootstrapping and mounts its own content here. -->
    <script src="_framework/blazor.webview.js"></script>
</body>
</html>

<!-- MainPage.xaml -->
<blazor:BlazorWebView HostPage="wwwroot/index.html">
    <blazor:BlazorWebView.RootComponents>
        <blazor:RootComponent Selector="#app" ComponentType="{x:Type local:Routes}" />
        <!-- "#app" is a REAL CSS ID selector, matched against the
             <div id="app"> that genuinely exists above — these two
             independently-editable things must agree. -->
    </blazor:BlazorWebView.RootComponents>
</blazor:BlazorWebView>`,
    },
    {
      label: 'A mismatched Selector — a different silent failure',
      language: 'csharp',
      code: `<!-- wwwroot/index.html — someone renamed the div while editing -->
<body>
    <div id="root">Loading...</div>
    <!-- Renamed from "app" to "root" — maybe copied from a
         different project's template without updating the
         BlazorWebView Selector to match. -->
    <script src="_framework/blazor.webview.js"></script>
</body>

<!-- MainPage.xaml — still references the OLD selector -->
<blazor:RootComponent Selector="#app" ComponentType="{x:Type local:Routes}" />

<!-- RESULT: the WebView successfully loads index.html (unlike the
     HostPage-path failure) — the user sees the STATIC "Loading..."
     text forever, since there is no element matching "#app" for
     Blazor's component tree to mount into. No error dialog, no
     exception — the app just appears permanently stuck on the
     static placeholder content. -->`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer sees their MAUI Hybrid app stuck showing a static "Loading..." message that never goes away, and initially assumes this means their Blazor app\'s own startup code (OnInitializedAsync, a slow API call) is genuinely still loading. Based on this subtopic, what alternative explanation is worth checking first, and how would it look different from an ACTUALLY slow-loading app?',
    hint: 'Think about what this subtopic\'s second code example shows happening — is the "Loading..." text in that scenario coming from Blazor\'s own rendering, or from somewhere else entirely? Would a genuinely slow app eventually finish, versus this specific failure mode?',
    solution: 'A mismatched RootComponent Selector is worth checking first, alongside the genuinely-slow-startup possibility. In this subtopic\'s second code example, the "Loading..." text is STATIC HTML markup that was already sitting in index.html from the very start — it is not Blazor\'s own rendering output at all, since Blazor\'s component tree never successfully mounted anywhere. The key distinguishing behavior: a genuinely slow app (a real slow API call in OnInitializedAsync) will EVENTUALLY finish and show real content, however long that takes — a mismatched-Selector failure will NEVER resolve on its own, no matter how long you wait, since there is no Blazor rendering process running at all to eventually finish. Confirming whether the "Loading..." text persists indefinitely with zero change (Selector mismatch) versus eventually resolving into real, dynamic content (a genuinely slow but working app) is the fastest way to distinguish the two without needing to attach a debugger.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'RootComponent.Selector (like "#app") is a special, Blazor-reserved identifier — Blazor automatically creates a matching mount point in HostPage without the developer needing to add it themselves.',
      reality: 'This subtopic\'s first code example shows the mount-point element must genuinely EXIST in HostPage\'s own HTML markup — Selector is a real CSS selector evaluated against whatever the developer actually wrote in that file, with no automatic element creation happening on Blazor\'s part.'
    },
    {
      thought: 'A mismatched Selector produces the same total-blank-screen symptom as an incorrect HostPage path, making the two mistakes indistinguishable without a debugger.',
      reality: 'This subtopic\'s theory and exercise both show these produce genuinely DIFFERENT visible symptoms — a wrong HostPage path shows a completely blank screen (the WebView never loaded any document), while a mismatched Selector shows whatever STATIC markup already existed in the successfully-loaded HostPage file, just without any Blazor content ever appearing — a real, usable diagnostic distinction.'
    },
    {
      thought: 'If a MAUI Hybrid app appears stuck on a "Loading..." message, the most likely explanation is always a genuinely slow OnInitializedAsync method or a slow network call somewhere in the app\'s own startup logic.',
      reality: 'This subtopic\'s exercise shows a Selector/markup mismatch produces the IDENTICAL visible symptom (a stuck "Loading..." message) with a completely different root cause — the app is not slow at all, Blazor never started rendering in the first place; the key distinguishing test is whether the message EVER resolves, which a genuinely slow app will eventually do and a mismatched Selector never will.'
    }
  ];
}
