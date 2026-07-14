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
  templateUrl: './a-wrong-hostpage-path-produces-a-blank-screen-with-no-error.html',
  styleUrl: './a-wrong-hostpage-path-produces-a-blank-screen-with-no-error.scss'
})
export class AWrongHostpagePathProducesABlankScreenWithNoErrorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'HostPage is a file-system path into the compiled app bundle, resolved BEFORE any Blazor or .NET error-reporting machinery is even running yet',
      points: [
        'The main page\'s mistake entry states the correct path format, worth explaining why an incorrect one produces total silence rather than an error message: BlazorWebView loads HostPage as the literal HTML document the embedded WebView control navigates to FIRST — this happens at the native WebView layer, essentially identical to a browser being pointed at a local file that does not exist, before Blazor\'s own component rendering, DI container, or exception-reporting pipeline has started doing anything at all.',
        'Because the failure happens at this very early, WebView-navigation layer rather than inside .NET code, there is no .NET exception to catch, no stack trace to log, and no Blazor error boundary to display anything — the WebView control simply fails to load a document, and from the user\'s perspective, the app opens to a blank white screen with nothing further happening, since nothing downstream of that failed navigation ever gets a chance to run.',
      ]
    },
    {
      heading: 'Why the exact path format matters — it must match how the file was actually bundled, not how it "looks" relative to the project',
      points: [
        'wwwroot/index.html (the correct form) reflects where the build process actually PLACES the file inside the compiled app package — MAUI\'s build tooling copies the RCL\'s or app\'s own wwwroot folder contents into the app bundle with that same relative structure preserved, so HostPage must reference that same bundled path, not a path that merely looks correct relative to the source project layout.',
        'A subtly WRONG but plausible-looking path (a missing wwwroot/ prefix, an extra leading slash, incorrect casing on a case-sensitive target platform) produces the exact same blank-screen symptom as a completely wrong path — there is no partial-credit "close enough" behavior, since the WebView either successfully resolves the exact bundled path or it does not, with the same silent failure either way.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The silent failure — a plausible-looking wrong path',
      language: 'csharp',
      code: `<!-- MainPage.xaml -->
<blazor:BlazorWebView HostPage="index.html">
    <!-- Missing the "wwwroot/" prefix — LOOKS reasonable if you are
         thinking about the file's location relative to the project
         ROOT, but the build process actually bundles it as
         "wwwroot/index.html" inside the compiled app package. -->
    <blazor:BlazorWebView.RootComponents>
        <blazor:RootComponent Selector="#app" ComponentType="{x:Type local:Routes}" />
    </blazor:BlazorWebView.RootComponents>
</blazor:BlazorWebView>

<!-- Result when the app launches: -->
<!-- A blank white screen. No exception in the debugger's Exceptions
     window. No entry in the Output/Debug log pointing at this file.
     No Blazor error UI, since Blazor's own rendering pipeline never
     got a chance to start — the WebView itself never successfully
     navigated to any document at all. -->`,
    },
    {
      label: 'The fix — the exact bundled path',
      language: 'csharp',
      code: `<!-- MainPage.xaml -->
<blazor:BlazorWebView HostPage="wwwroot/index.html">
    <!-- This matches EXACTLY where the build process placed the
         file inside the compiled app package — the WebView control
         can now successfully navigate to a real document, and
         everything downstream (Blazor's own bootstrapping script
         inside index.html, the DI container, RootComponent mounting)
         gets a chance to run. -->
    <blazor:BlazorWebView.RootComponents>
        <blazor:RootComponent Selector="#app" ComponentType="{x:Type local:Routes}" />
    </blazor:BlazorWebView.RootComponents>
</blazor:BlazorWebView>`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer hits the blank-screen symptom, checks their HostPage path and confirms it correctly says "wwwroot/index.html", but the app still shows a blank screen. They ask a teammate for help, insisting "it can\'t be a HostPage path problem, I already checked that." What is a reasonable next thing to verify, given this subtopic\'s explanation of WHY the path must match the BUNDLED location specifically?',
    hint: 'Think about what could make a CORRECTLY-WRITTEN "wwwroot/index.html" string still fail to resolve — is the path string itself the only thing that needs to be right, or does something ELSE need to genuinely exist at that bundled location too?',
    solution: 'A reasonable next thing to verify is whether index.html actually EXISTS at that location inside the compiled app bundle in the first place — not just whether the HostPage STRING is spelled correctly. This subtopic\'s theory explains the path must match where the build process actually PLACED the file; if index.html itself was accidentally excluded from the project\'s build action (e.g. its Build Action is not set to MauiAsset, or it lives in a folder the build process does not copy into wwwroot), a perfectly-spelled "wwwroot/index.html" HostPage value will STILL fail to resolve, since there is genuinely nothing there to navigate to — producing the identical blank-screen symptom as a misspelled path. Checking the file\'s actual presence in the build OUTPUT (not just the source project structure) and its build action/properties is the next logical step, since the developer has correctly ruled out a typo but not yet ruled out the file being missing from the bundle entirely.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An incorrect HostPage path produces a .NET exception or an error message somewhere in the debugger or app logs, even if it is not immediately obvious where to look.',
      reality: 'This subtopic\'s theory clarifies the failure happens at the native WebView-navigation layer, BEFORE any .NET/Blazor code has started running — there is no .NET exception to throw, since nothing downstream of the failed navigation ever executes; the blank screen genuinely has no accompanying error to find, anywhere.'
    },
    {
      thought: 'If the HostPage path STRING is spelled exactly correctly ("wwwroot/index.html"), that alone guarantees the WebView will successfully load the app.',
      reality: 'This subtopic\'s exercise shows a correctly-spelled path string is not sufficient on its own — the file itself must actually exist at that location in the BUILT app bundle; a build-configuration issue (wrong Build Action, a file excluded from packaging) can produce the identical blank-screen symptom even with a perfectly correct-looking HostPage value.'
    },
    {
      thought: 'The HostPage path is resolved relative to the SOURCE project\'s folder structure, the same way a relative file path would work when directly editing files in an IDE.',
      reality: 'This subtopic\'s theory clarifies HostPage is resolved relative to the COMPILED APP BUNDLE\'s own internal structure, which the build process constructs by copying wwwroot contents into a specific location — this can differ from how the source project folders are organized, which is exactly why "it looks right relative to my project" is not the same guarantee as "it matches the bundled path."'
    }
  ];
}
