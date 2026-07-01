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
  selector: 'app-blazor-maui-hybrid',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './maui-hybrid.html',
  styleUrl: './maui-hybrid.scss'
})
export class BlazorMauiHybrid {
  quickRef: QuickRefItem[] = [
    { name: 'BlazorWebView', type: 'keyword', desc: 'MAUI control that hosts a Blazor component tree natively.' },
    { name: 'MauiProgram.cs', type: 'keyword', desc: 'App entry point — configure DI and register Blazor.' },
    { name: 'builder.Services.AddMauiBlazorWebView()', type: 'method', desc: 'Registers Blazor in the MAUI DI container.' },
    { name: 'HostPage', type: 'keyword', desc: 'BlazorWebView property pointing to the root HTML file (wwwroot/index.html).' },
    { name: 'RootComponent', type: 'keyword', desc: 'Maps a CSS selector to a root Razor component.' },
    { name: 'IFileSystem (MAUI)', type: 'interface', desc: 'Access device files — not available in web Blazor.' },
    { name: 'IDeviceInfo (MAUI)', type: 'interface', desc: 'Query device platform, model, OS version.' },
    { name: 'Shared project (RCL)', type: 'keyword', desc: 'Razor Class Library holding UI components shared by MAUI and web.' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Blazor Hybrid?',
      points: ['Blazor Hybrid embeds Blazor components inside a native app shell using a WebView control. On MAUI this is `BlazorWebView`; on WPF and WinForms it is a similar control. The Blazor UI renders in the embedded browser, but C# code runs natively — not in a browser sandbox. This means full access to platform APIs, the file system, hardware, and native app packages without a remote server.',
      'Runs natively — C# is not sandboxed like WASM.', 'BlazorWebView is the host control for MAUI/WPF/WinForms.', 'Full access to device APIs (camera, location, storage).', 'No SignalR circuit — component state lives in the native process.']
    },
    {
      heading: 'Project structure and code sharing',
      points: ['The recommended pattern is a Razor Class Library (RCL) shared project that contains all Blazor components and business logic. The MAUI project references the RCL and adds platform-specific services (IFileSystem, INotificationService). A Blazor WASM or Server web project can also reference the same RCL, keeping one set of components for all targets.',
      'RCL is the sharing unit — components live there.', 'MAUI project adds platform service implementations.', 'Use interfaces for platform services so the RCL stays portable.', 'wwwroot/index.html in the RCL is the HostPage for MAUI.']
    },
    {
      heading: 'Calling native platform APIs',
      points: ['Inside a Blazor component in a MAUI Hybrid app, inject MAUI Essentials services (IFileSystem, IDeviceInfo, IGeolocation, etc.) directly — they are registered in the DI container by MAUI. Avoid using these interfaces in the shared RCL directly; instead define abstractions and inject platform-specific implementations, so the same component can render in a web context without MAUI.',
      'MAUI Essentials APIs are available via DI injection.', 'Wrap platform-specific APIs behind interfaces for web compatibility.', 'IJSRuntime is still available in Hybrid — calls execute in the embedded WebView.', 'There is no network latency — JS interop is in-process.']
    },
    {
      heading: 'Sharing Code Between Web and MAUI Hybrid Targets',
      points: [
        'A .NET MAUI Blazor Hybrid app and a separate Blazor web app can share the same Razor component library — components written without direct dependencies on browser-only or native-only APIs work unmodified across both targets, maximizing code reuse.',
        'Platform-specific functionality (camera access, native file system, push notifications) requires abstracting behind an interface implemented differently per platform — a shared component depends on the interface, while platform-specific projects (MAUI native, or a JS interop shim for web) provide the concrete implementation.',
        'Dependency injection registration differs slightly between a pure web Blazor app and a MAUI Hybrid app\'s MauiProgram.cs — shared component libraries should avoid assuming any specific DI registration pattern, instead documenting what services they expect to be registered by whichever host application consumes them.',
        'Testing a MAUI Hybrid app\'s Blazor components can still use bUnit for the component logic itself, since bUnit does not care whether the components are ultimately hosted in a browser or a native WebView — platform-specific integration (native API calls) still requires MAUI-specific testing or manual verification.',
      ],
    },
    {
      heading: 'Debugging Hybrid Apps Across the Native/Web Boundary',
      points: [
        'Debugging a MAUI Blazor Hybrid app spans two distinct layers — the native .NET/MAUI code (debuggable with standard .NET debugging tools) and the Blazor component code running inside the embedded WebView, which may require browser-style DevTools access to the WebView\'s rendering for full visibility into the web layer.',
        'Platform-specific WebView debugging tools (Chrome DevTools for Android\'s WebView, Safari Web Inspector for iOS/macOS WKWebView) can be attached to inspect the actual rendered DOM and JavaScript console output within a running Hybrid app, similar to debugging a regular web page.',
        'Performance profiling a Hybrid app requires considering both native startup overhead (MAUI app launch, WebView initialization) and web-layer rendering performance (Blazor component rendering within the WebView) — a slow-feeling Hybrid app could have its bottleneck in either layer, requiring different diagnostic tools to identify which.',
        'Platform-specific quirks in WebView implementations (older Android WebView versions, WKWebView\'s stricter security policies) can cause behavior differences between platforms even with identical Blazor component code — testing on all actually-targeted platforms, not just one, is necessary to catch these platform-specific WebView behavior differences.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'MauiProgram.cs setup',
      language: 'csharp',
      code: `// MauiProgram.cs
public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder.UseMauiApp<App>()
               .ConfigureFonts(fonts =>
                   fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular"));

        builder.Services.AddMauiBlazorWebView();

#if DEBUG
        builder.Services.AddBlazorWebViewDeveloperTools();
#endif

        // Register shared and platform services
        builder.Services.AddScoped<IWeatherService, WeatherApiService>();
        builder.Services.AddSingleton<IFilePickerService, MauiFilePickerService>();

        return builder.Build();
    }
}`
    },
    {
      label: 'BlazorWebView in XAML',
      language: 'csharp',
      code: `<!-- MainPage.xaml -->
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:blazor="clr-namespace:Microsoft.AspNetCore.Components.WebView.Maui;assembly=Microsoft.AspNetCore.Components.WebView.Maui"
             Title="MyApp">
    <blazor:BlazorWebView HostPage="wwwroot/index.html">
        <blazor:BlazorWebView.RootComponents>
            <blazor:RootComponent Selector="#app"
                                  ComponentType="{x:Type local:Routes}" />
        </blazor:BlazorWebView.RootComponents>
    </blazor:BlazorWebView>
</ContentPage>`
    },
    {
      label: 'Platform service abstraction',
      language: 'csharp',
      code: `// Shared RCL
public interface IFilePickerService
{
    Task<string?> PickFileAsync();
}

// MAUI implementation
public class MauiFilePickerService : IFilePickerService
{
    public async Task<string?> PickFileAsync()
    {
        var result = await FilePicker.Default.PickAsync();
        return result?.FullPath;
    }
}

// Web stub (for running the same components in browser)
public class WebFilePickerService : IFilePickerService
{
    public Task<string?> PickFileAsync()
        => Task.FromResult<string?>(null); // or use JS interop
}

// Blazor component in RCL
@inject IFilePickerService FilePicker
<button @onclick="Pick">Pick File</button>
<p>@selectedPath</p>
@code {
    private string? selectedPath;
    private async Task Pick()
        => selectedPath = await FilePicker.PickFileAsync();
}`
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using MAUI APIs directly in shared RCL components',
      wrong: '@inject IGeolocation Geo  // in a shared RCL component',
      right: '@inject ILocationService Loc  // inject an abstraction\n// implement with Geolocation in MAUI, stub in web',
      explanation: 'MAUI platform APIs are only available in the MAUI project. Using them in the RCL prevents the same components from running in a Blazor web app.'
    },
    {
      title: 'Setting HostPage to the wrong path',
      wrong: 'HostPage="index.html"',
      right: 'HostPage="wwwroot/index.html"',
      explanation: 'BlazorWebView\'s HostPage must be relative to the app project root and include the wwwroot prefix. An incorrect path results in a blank screen with no error.'
    },
    {
      title: 'Not adding AddMauiBlazorWebView()',
      wrong: 'builder.Services.AddBlazorWebAssembly();  // wrong API',
      right: 'builder.Services.AddMauiBlazorWebView();',
      explanation: 'AddMauiBlazorWebView is the MAUI-specific registration. Using WASM or Server registration APIs in a MAUI project causes runtime errors.'
    },
    {
      title: 'Expecting offline WASM semantics',
      wrong: '// Assuming Blazor Hybrid can serve the app from a CDN or offline cache',
      right: '// Hybrid apps are native — they are installed on the device like any native app',
      explanation: 'Blazor Hybrid is not WASM. The .NET runtime is embedded in the native app. There is no WASM download or browser cache — the app is distributed and installed natively.'
    },
    {
      title: 'Forgetting to enable Developer Tools in debug builds',
      wrong: 'builder.Services.AddMauiBlazorWebView();  // no dev tools',
      right: '#if DEBUG\nbuilder.Services.AddBlazorWebViewDeveloperTools();\n#endif',
      explanation: 'Without developer tools, you cannot open browser DevTools inside the embedded WebView during development, making CSS and JS debugging extremely difficult.'
    },
  ];

  challenge: Challenge = {
    title: 'Cross-Platform Device Info Page',
    language: 'csharp',
    description: 'In a MAUI Hybrid app, create a `DeviceInfoPage` component that shows Platform, Manufacturer, Model, and OS Version using MAUI Essentials IDeviceInfo. Also show the app\'s theme (light/dark) using IAppInfo. Make it cross-target compatible by wrapping the API behind an IDeviceInfoService interface with a MAUI implementation and a web stub.',
    hints: [
      'Register IDeviceInfo and IAppInfo with builder.Services.AddSingleton in MauiProgram.',
      'Define IDeviceInfoService in the RCL with Platform, Model, OsVersion properties.',
      'The web stub returns "N/A" or "Browser" values.',
    ],
    starterCode: `// IDeviceInfoService.cs (in RCL)
public interface IDeviceInfoService
{
    string Platform { get; }
    string Manufacturer { get; }
    string Model { get; }
    string OsVersion { get; }
}`,
    solution: `// MauiDeviceInfoService.cs (in MAUI project)
public class MauiDeviceInfoService(IDeviceInfo info) : IDeviceInfoService
{
    public string Platform => info.Platform.ToString();
    public string Manufacturer => info.Manufacturer;
    public string Model => info.Model;
    public string OsVersion => info.VersionString;
}

// WebDeviceInfoService.cs (in web project)
public class WebDeviceInfoService : IDeviceInfoService
{
    public string Platform => "Browser";
    public string Manufacturer => "N/A";
    public string Model => "N/A";
    public string OsVersion => "N/A";
}

// MauiProgram.cs
builder.Services.AddSingleton<IDeviceInfoService, MauiDeviceInfoService>();

// DeviceInfoPage.razor (in RCL)
@inject IDeviceInfoService DeviceInfo
<h2>Device Info</h2>
<p>Platform: @DeviceInfo.Platform</p>
<p>Manufacturer: @DeviceInfo.Manufacturer</p>
<p>Model: @DeviceInfo.Model</p>
<p>OS Version: @DeviceInfo.OsVersion</p>`
  };

  quiz: QuizQuestion[] = [
    { q: 'What control hosts Blazor components in a MAUI app?', options: ['WebView', 'BlazorWebView', 'HybridView', 'NativeWebControl'], answer: 1, explanation: 'BlazorWebView is the MAUI control that embeds a Blazor component tree into a native app using an embedded browser.' },
    { q: 'How does C# code run in Blazor Hybrid?', options: ['In a browser sandbox like WASM', 'Via SignalR from a server', 'Natively in the device process', 'Through Node.js'], answer: 2, explanation: 'Blazor Hybrid runs .NET natively on the device — not in a browser sandbox. This gives full access to device APIs, file system, and hardware.' },
    { q: 'What is the recommended way to share components between MAUI and a web Blazor app?', options: ['Copy-paste components', 'Razor Class Library (RCL)', 'A shared NuGet package', 'Shared WASM project'], answer: 1, explanation: 'A Razor Class Library contains shared Blazor components. Both the MAUI project and the web Blazor project reference it, keeping one UI codebase.' },
    { q: 'Which service method registers Blazor for MAUI?', options: ['AddBlazorWebAssembly()', 'AddServerSideBlazor()', 'AddMauiBlazorWebView()', 'AddBlazorHybrid()'], answer: 2, explanation: 'AddMauiBlazorWebView() is the MAUI-specific registration. It wires up the BlazorWebView control and the Blazor DI integration for native apps.' },
    { q: 'Why wrap MAUI platform APIs behind interfaces in the shared RCL?', options: ['Performance', 'To enable the same components to compile in a web Blazor project', 'Required by MAUI', 'To support theming'], answer: 1, explanation: 'MAUI APIs are not available in web projects. Abstraction behind interfaces lets the same Razor component run in MAUI (real implementation) and web (stub implementation) without code changes.' },
    { q: 'What is BlazorWebView and where is it placed in a MAUI application?', options: ['A server that hosts Blazor', 'A MAUI control (<BlazorWebView>) that renders a Blazor component tree inside a native app using a system WebView', 'A debugging tool', 'A MAUI-specific router'], answer: 1, explanation: 'BlazorWebView is a native control that embeds Chromium (Android/Windows) or WKWebView (iOS/macOS) to host the Blazor component tree. It is placed in a ContentPage XAML just like any other MAUI control. Blazor runs locally — no network required — which is why device APIs are accessible.' },
  ];

  qna: QnaItem[] = [
    { q: 'Can Blazor Hybrid work offline?', a: 'Yes. Because the app is installed natively, the Blazor components run entirely from the device without needing a server or internet connection. Any API calls to a backend can fail gracefully with local caching — the UI itself is always available.' },
    { q: 'Is JavaScript interop available in Blazor Hybrid?', a: 'Yes. IJSRuntime works in Hybrid — it calls into the embedded WebView\'s JavaScript engine. Since C# and JS are in the same process, there is no network latency for interop calls, making them much faster than Blazor Server.' },
    { q: 'Can I use CSS and third-party UI components in Blazor Hybrid?', a: 'Yes. The BlazorWebView renders an HTML/CSS UI just like a browser. Third-party Blazor component libraries (MudBlazor, Radzen, etc.) work without modification.' },
    { q: 'What is the difference between Blazor Hybrid and a PWA (Progressive Web App)?', a: 'A PWA runs in a browser and requires internet access to install. Blazor Hybrid is distributed through app stores and runs natively. Hybrid has full device API access; PWA is sandboxed by the browser. Hybrid is a better fit when you need deep platform integration or store distribution.' },
    { q: 'What is a BlazorWebView in .NET MAUI, and how does it differ from a typical Blazor WASM app?',
      a: 'BlazorWebView is a control that hosts Razor components inside a native MAUI app using an embedded web view (WebView2 on Windows, WKWebView on iOS, etc.), running the Blazor app with full access to the device\'s native APIs through MAUI\'s platform abstractions. Unlike Blazor WASM running in a regular browser sandbox, a MAUI Hybrid app can directly call native device features (camera, GPS, file system, push notifications) by injecting platform-specific services into the same dependency injection container the Blazor components use.' },
    { q: 'Why might you choose a .NET MAUI Blazor Hybrid app over a pure Blazor WASM PWA for mobile development?',
      a: 'A Blazor WASM PWA runs entirely within browser sandbox constraints — limited access to native device APIs, app store distribution requires extra wrapping, and performance/startup time depends on WASM download and JIT/AOT compilation in the browser. A MAUI Hybrid app packages as a true native app (proper app store presence, native performance for the shell, full native API access via MAUI) while still reusing the same Razor component codebase as a web version — ideal when deep native integration or official app store distribution matters more than the simplicity of a pure web deployment.' },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Blazor Hybrid embeds Blazor components into native MAUI/WPF/WinForms apps via BlazorWebView, running C# natively on the device with full platform API access.',
    mustKnow: [
      'BlazorWebView hosts Blazor UI inside a native MAUI app.',
      'C# runs natively — not sandboxed like WASM, no SignalR circuit.',
      'Razor Class Library is the sharing mechanism between MAUI and web.',
      'Wrap MAUI platform APIs behind interfaces for web portability.',
      'AddMauiBlazorWebView() is the DI registration method.',
      'JS interop works in Hybrid and is in-process (fast — no network).',
    ],
    interviewFocus: [
      'How does Blazor Hybrid differ from Blazor WebAssembly?',
      'How do you share Blazor components between a MAUI app and a web app?',
      'When would you choose Blazor Hybrid over a PWA?',
    ]
  };
}
