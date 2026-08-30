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
  templateUrl: './a-registry-based-factory-selector-made-concrete.html',
  styleUrl: './a-registry-based-factory-selector-made-concrete.scss'
})
export class ARegistryBasedFactorySelectorMadeConcreteSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Described in one dense QnA paragraph, never shown in code',
      points: [
        'The page\'s own QnA answers this directly: "Implement a factory registry or use dependency injection: the concrete factory is selected based on configuration or environment variables, not hardcoded in client code... To add a new theme, create a new factory class and register it for the new configuration value. No existing code changes."',
        'The main page\'s own "Classic Pattern" codeTab, by contrast, hardcodes the factory choice directly: <code>var app = new Application(new WindowsUiFactory());</code> — correct for a composition root, but it does not show what the QnA describes: SELECTING which concrete factory to use based on configuration, without an if/else or switch naming every possible factory by hand.',
      ]
    },
    {
      heading: 'What a registry actually buys you over an if/else chain',
      points: [
        'A naive "configuration-driven" selector could just be a switch statement mapping a config string to a factory type — but that switch statement itself would need editing every time a new theme is added, which is exactly the same structural cost this hub\'s own Factory Method topic identifies as an OCP violation.',
        'A REGISTRY avoids this: concrete factories register THEMSELVES into a shared dictionary (keyed by name) at startup, and the selection code just does a dictionary lookup — no switch statement anywhere has to know the full list of possible themes in advance.',
        'Adding a new theme becomes: write the new concrete factory class, add ONE registration line at startup. No existing selection logic is touched at all — the registry\'s own lookup code is identical whether there are 2 registered factories or 20.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A factory registry — no switch statement, ever',
      language: 'csharp',
      code: `public static class UiFactoryRegistry
{
    private static readonly Dictionary<string, Func<IUiFactory>> _factories = new();

    // Each concrete factory registers ITSELF -- the registry never
    // needs to know the full list of themes in advance.
    public static void Register(string themeName, Func<IUiFactory> create) =>
        _factories[themeName] = create;

    public static IUiFactory Resolve(string themeName)
    {
        if (!_factories.TryGetValue(themeName, out var create))
            throw new ArgumentException($"Unknown theme: {themeName}");
        return create();
    }
}

// Startup registration -- one line per theme, added independently
UiFactoryRegistry.Register("windows", () => new WindowsUiFactory());
UiFactoryRegistry.Register("mac", () => new MacUiFactory());

// Adding Linux later: ONE new line, nothing else in this file changes
UiFactoryRegistry.Register("linux", () => new LinuxUiFactory());

// Selection is a plain lookup -- driven by config, an env var, whatever
string theme = Configuration["ui.theme"] ?? "windows";
IUiFactory factory = UiFactoryRegistry.Resolve(theme);
var app = new Application(factory);
app.BuildUi();

// Compare to the naive alternative this registry avoids:
IUiFactory GetFactoryTheWrongWay(string theme) => theme switch
{
    "windows" => new WindowsUiFactory(),
    "mac"     => new MacUiFactory(),
    // Every new theme means editing THIS switch -- the registry's
    // whole point is that Register() calls replace this entirely.
    _ => throw new ArgumentException($"Unknown theme: {theme}")
};`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says: "The registry still has a switch-like structure somewhere — the dictionary lookup inside Resolve() is really just a switch statement in disguise." Is looking something up in a dictionary the same kind of maintenance cost as a switch statement?',
    hint: 'When a new theme is added, does Resolve()\'s own code have to change at all?',
    solution: 'No -- the key difference is not about the LOOKUP mechanism, it is about WHO has to change WHAT. A switch statement enumerates every known case directly in its own source code -- adding a new case means editing that exact block of code, in that exact file, every time. Resolve()\'s dictionary lookup is generic: it works identically for 2 registered factories or 200, and its own source code never changes no matter how many themes exist. Adding a new theme only ever touches the NEW factory\'s own Register() call, added independently, wherever that new factory happens to live -- Resolve() itself is never touched again after it is written once. That is the actual Open/Closed benefit: the SELECTION logic is closed for modification permanently, while the SET of available factories stays open for extension.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A registry-based factory selector is just a switch statement with extra ceremony — it has the same maintenance cost as directly switching on a theme name.',
      reality: 'Per this subtopic\'s theory, a switch statement requires editing its own source code for every new case, while a registry\'s lookup code never changes — only the independent Register() calls for each factory need to be added.'
    },
    {
      thought: 'Using a registry means giving up compile-time safety, since factories are now selected by a string key rather than referenced directly by type.',
      reality: 'Per this subtopic\'s theory, this is a real, worth-acknowledging trade-off, but it is about WHEN errors are caught (a typo\'d theme name fails at runtime via the registry\'s own exception, rather than being caught at compile time) — it does not affect the actual Open/Closed benefit of not needing to edit selection logic for new themes.'
    },
    {
      thought: 'The page\'s "Composition root" example (hardcoding new WindowsUiFactory()) and a registry-based selector solve the same problem, just with different syntax.',
      reality: 'Per this subtopic\'s theory, they solve different problems — the composition-root example is a single, fixed choice made once at startup, while a registry exists specifically for when the choice needs to be driven by configuration and extended without touching existing code.'
    }
  ];
}
