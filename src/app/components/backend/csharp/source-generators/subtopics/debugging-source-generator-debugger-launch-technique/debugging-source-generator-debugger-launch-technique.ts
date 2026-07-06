import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-debugging-source-generator-debugger-launch-technique-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './debugging-source-generator-debugger-launch-technique.html',
  styleUrl: './debugging-source-generator-debugger-launch-technique.scss',
})
export class DebuggingSourceGeneratorDebuggerLaunchTechniqueSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s EmitCompilerGeneratedFiles tip helps you INSPECT output — it does not help you debug BUGGY generator logic',
      points: [
        'The main Source Generators page recommends <code>EmitCompilerGeneratedFiles</code> to write generated <code>.g.cs</code> files to disk "for inspection" — genuinely useful for confirming WHAT a generator produced. It does nothing to help when the generator\'s OWN C# logic (the code inside <code>Initialize</code>, your transform functions, your emit function) has a bug — you cannot set a breakpoint in your normal IDE debug session and hit it, because a source generator does not run as part of YOUR application\'s process at all.',
      ],
    },
    {
      heading: 'A generator runs INSIDE the compiler process, not inside your application — that is why ordinary debugging does not reach it',
      points: [
        'Source generators execute as part of the C# COMPILER itself — <code>csc.exe</code> on the command line, or the long-running <code>VBCSCompiler.exe</code> / language-server compiler process your IDE keeps alive for fast incremental builds. When you press "Start Debugging" on your APPLICATION project, you attach a debugger to YOUR application\'s process — the compiler process that already ran your generator (as part of building that application) is a COMPLETELY SEPARATE process that finished and exited before your application even started running.',
        'This is precisely why breakpoints placed inside a generator project\'s own source code are simply never hit during a normal "run my application" debug session — the debugger is watching the wrong process entirely.',
      ],
    },
    {
      heading: 'Debugger.Launch() inside Initialize() is the standard technique — it pauses the COMPILER process itself and offers to attach a debugger',
      points: [
        'Calling <code>System.Diagnostics.Debugger.Launch()</code> as literally the first line inside your generator\'s <code>Initialize(IncrementalGeneratorInitializationContext context)</code> method causes the COMPILER PROCESS ITSELF to pop up a "choose a debugger to attach" dialog the moment that generator runs during a build — letting you attach Visual Studio (or another debugger) DIRECTLY to the compiler process, set breakpoints in your generator\'s own code, and step through <code>Initialize</code>, your transform lambdas, and your emit function exactly as you would any other C# code.',
        'A common refinement: guard the <code>Debugger.Launch()</code> call behind a conditional (an environment variable, a <code>#if DEBUG</code>, or a check for a specific flag file) so it does not interrupt EVERY normal build with a debugger-attach prompt — only opt-in explicitly when you are actively debugging generator logic.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why a normal "Start Debugging" session never hits a breakpoint inside a generator',
      language: 'csharp',
      code: `// Your generator project (MyGenerator.csproj):
public class MyToStringGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
        var pipeline = context.SyntaxProvider.ForAttributeWithMetadataName(/* ... */);
        // <-- setting a breakpoint HERE and pressing "Start Debugging"
        //     on your APPLICATION project (MyApp.csproj, which
        //     references MyGenerator as an analyzer) will NEVER hit
        //     this breakpoint.
        //
        // WHY: building MyApp.csproj runs the C# COMPILER, which
        // loads and executes MyGenerator's Initialize() method AS
        // PART OF COMPILATION — a process that starts, generates
        // source, and finishes BEFORE MyApp.exe is even produced,
        // let alone started running under your debugger. "Start
        // Debugging" attaches to MyApp.exe's process — a totally
        // different, LATER process than the compiler that already
        // ran and exited.
    }
}`,
    },
    {
      label: 'Debugger.Launch() — attaching a debugger to the compiler process itself',
      language: 'csharp',
      code: `public class MyToStringGenerator : IIncrementalGenerator
{
    public void Initialize(IncrementalGeneratorInitializationContext context)
    {
#if DEBUG_GENERATOR
        // The FIRST line — causes the COMPILER PROCESS (csc.exe /
        // VBCSCompiler.exe) to pause here and prompt "choose a
        // debugger to attach" the moment this generator runs during
        // the NEXT build:
        System.Diagnostics.Debugger.Launch();
#endif

        var pipeline = context.SyntaxProvider.ForAttributeWithMetadataName(
            "MyNamespace.MyToStringAttribute",
            predicate: (node, _) => node is ClassDeclarationSyntax,
            transform: (ctx, _) =>
            {
                // NOW a breakpoint here IS reachable — once you've
                // attached a debugger to the compiler process via the
                // Debugger.Launch() prompt, you can step through this
                // transform function exactly like ordinary code:
                var symbol = (INamedTypeSymbol)ctx.TargetSymbol;
                return symbol.Name;
            });

        context.RegisterSourceOutput(pipeline, (spc, className) =>
        {
            // Breakpoints here work too, once attached:
            spc.AddSource($"{className}.g.cs", $"// generated for {className}");
        });
    }
}

// Build MyApp.csproj (which references MyGenerator as an analyzer) —
// the DEBUG_GENERATOR-conditional Launch() call fires during THAT
// build, prompting you to attach a debugger to the compiler process
// running RIGHT NOW, before it finishes generating source.`,
    },
    {
      label: 'Guarding Debugger.Launch() so it only interrupts builds when you actually want it to',
      language: 'csharp',
      code: `public void Initialize(IncrementalGeneratorInitializationContext context)
{
    // A guard checking an environment variable — set it ONLY in your
    // shell before running the specific build you want to debug,
    // rather than baking a build-configuration conditional into the
    // generator project permanently:
    if (Environment.GetEnvironmentVariable("DEBUG_MY_GENERATOR") == "1")
    {
        System.Diagnostics.Debugger.Launch();
    }

    // ... rest of Initialize() unchanged ...
}

// In a terminal, before triggering the build you want to debug:
//   PowerShell:  $env:DEBUG_MY_GENERATOR = "1"
//   Bash:        export DEBUG_MY_GENERATOR=1
// Then trigger the build (dotnet build, or rebuild in the IDE) —
// ONLY this specific build session prompts for a debugger attach;
// every other ordinary build proceeds uninterrupted, since the
// environment variable is not set globally.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says "I set a breakpoint inside my generator\'s emit function, ran my app in the debugger, and it never hit." Explain the root cause and the fix, in terms of which PROCESS the breakpoint needs to actually be attached to.',
    hint: 'Consider that "running the app in the debugger" attaches to the application\'s own process — and that the generator already finished running, in an entirely different process (the compiler), before the application process even started.',
    solution: `// Root cause: the breakpoint IS correctly placed in the generator's
// source code — the problem is WHICH PROCESS the debugger is
// attached to. "Running my app in the debugger" attaches Visual
// Studio's debugger to the APPLICATION's own process (MyApp.exe).
//
// But the generator's emit function does not run inside MyApp.exe at
// all — it runs inside the C# COMPILER process (csc.exe /
// VBCSCompiler.exe) during the BUILD step that happens BEFORE
// MyApp.exe is even produced. By the time MyApp.exe starts running
// (and the debugger attaches to IT), the compiler process that ran
// the generator has ALREADY FINISHED and exited. There is no way for
// a debugger attached to MyApp.exe to ever reach code that ran in a
// different, already-terminated process.
//
// The fix: add a Debugger.Launch() call (ideally guarded behind an
// environment variable or #if, so it doesn't interrupt every build)
// as the first line of the generator's Initialize() method. This
// causes the COMPILER PROCESS ITSELF — while it is still running,
// during the NEXT build — to prompt for a debugger to attach directly
// to IT. Once attached to the compiler process (not the application
// process), breakpoints inside the generator's transform and emit
// functions become reachable, because the debugger is now watching
// the correct process where that code actually executes.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a breakpoint set inside a source generator project\'s code will be hit when you debug your application project normally, since the generator project is referenced by the application.',
      reality: 'a source generator runs inside the C# COMPILER process during the build step, entirely separate from and finished before your application\'s own process ever starts — "Start Debugging" on the application attaches to the wrong process to ever reach generator code.',
    },
    {
      thought: 'EmitCompilerGeneratedFiles is sufficient for debugging a source generator\'s logic, not just inspecting its output.',
      reality: 'it only writes the FINAL generated text to disk for manual inspection — it provides no way to step through the generator\'s own Initialize/transform/emit code when that code itself has a bug.',
    },
    {
      thought: 'Debugger.Launch() should be left unconditionally in a generator\'s Initialize() method for convenience.',
      reality: 'an unconditional Debugger.Launch() call prompts a debugger-attach dialog on EVERY single build, including ones where you have no intention of debugging the generator — guarding it behind an environment variable or build configuration keeps ordinary builds uninterrupted.',
    },
  ];
}
