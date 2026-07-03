import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-caller-info-attributes-callermembername-callerlinenumber-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './caller-info-attributes-callermembername-callerlinenumber.html',
  styleUrl: './caller-info-attributes-callermembername-callerlinenumber.scss',
})
export class CallerInfoAttributesCallerMemberNameCallerLineNumberSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A parameter feature the main page never mentions at all',
      points: [
        'The main Methods page covers optional parameters, named arguments, <code>ref</code>/<code>out</code>/<code>in</code> — but never <code>CallerMemberName</code>, <code>CallerLineNumber</code>, and <code>CallerFilePath</code>, three attributes from <code>System.Runtime.CompilerServices</code> that turn an optional parameter into a compiler-filled diagnostic value, automatically capturing information about the CALL SITE rather than requiring the caller to pass it explicitly.',
      ],
    },
    {
      heading: 'How it works — compiler-substituted optional parameters',
      points: [
        'Each attribute decorates an OPTIONAL parameter (it must have a default value, exactly like the main page\'s optional-parameter rules) — but instead of using the literal default when omitted, the COMPILER substitutes a value derived from the call site itself: the calling member\'s name, the source line number, or the source file path.',
        'This substitution happens entirely at COMPILE TIME, baked into the generated IL at each call site — there is no runtime reflection or stack-walking involved, making it essentially free at runtime (unlike, say, capturing a stack trace).',
      ],
    },
    {
      heading: 'The classic use case — free diagnostic context without manual string literals',
      points: [
        'A logging method like <code>Log(string message, [CallerMemberName] string caller = "")</code> automatically receives the name of whatever method called <code>Log</code> — no need for the CALLER to manually pass <code>nameof(SomeMethod)</code> or hardcode a string that can drift out of sync when the method is renamed.',
        '<code>INotifyPropertyChanged</code> implementations use this extensively: <code>protected void OnPropertyChanged([CallerMemberName] string propertyName = "")</code> lets every property setter call <code>OnPropertyChanged()</code> with NO arguments at all — the compiler fills in the correct property name automatically, and a rename via IDE refactoring tools updates it correctly since it is a real identifier, not a string literal.',
      ],
    },
    {
      heading: 'Interacts with the main page\'s optional-parameter rules — position and explicit override',
      points: [
        'Because these are genuinely optional parameters (just with compiler-supplied defaults instead of literal ones), they follow the SAME positional rule from the main page: they must come after all required parameters in the parameter list, same as any other optional parameter.',
        'A caller CAN still explicitly pass a value for a caller-info parameter, overriding the compiler-supplied one — useful for forwarding the ORIGINAL caller\'s info through a wrapper method rather than capturing the wrapper\'s own location, though this defeats the "automatic" convenience and should be done deliberately, not accidentally.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'CallerMemberName — automatic method-name context for logging',
      language: 'csharp',
      code: `using System.Runtime.CompilerServices;

public static class Logger
{
    public static void Log(
        string message,
        [CallerMemberName] string caller = "",
        [CallerLineNumber] int line = 0,
        [CallerFilePath] string file = "")
    {
        var fileName = Path.GetFileName(file);
        Console.WriteLine($"[{fileName}:{line}] {caller}() — {message}");
    }
}

public class OrderService
{
    public void PlaceOrder(int id)
    {
        // No arguments passed for caller/line/file — the compiler fills
        // them in automatically at THIS exact call site:
        Logger.Log("Processing order");
        // Output: [OrderService.cs:15] PlaceOrder() — Processing order
    }

    public void CancelOrder(int id)
    {
        Logger.Log("Cancelling order");
        // Output: [OrderService.cs:22] CancelOrder() — Cancelling order
        // — a DIFFERENT caller name, automatically, with zero extra code
        // at either call site. Renaming PlaceOrder or CancelOrder via an
        // IDE updates this automatically too — no hardcoded string to drift.
    }
}`,
    },
    {
      label: 'INotifyPropertyChanged — the classic real-world use case',
      language: 'csharp',
      code: `using System.ComponentModel;
using System.Runtime.CompilerServices;

public class ViewModel : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler? PropertyChanged;

    // CallerMemberName captures the NAME OF THE PROPERTY whose setter
    // called this method — not the name of OnPropertyChanged itself:
    protected void OnPropertyChanged([CallerMemberName] string propertyName = "") =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));

    private string _name = "";
    public string Name
    {
        get => _name;
        set
        {
            if (_name == value) return;
            _name = value;
            OnPropertyChanged(); // no argument needed — compiler supplies "Name"
        }
    }

    private int _age;
    public int Age
    {
        get => _age;
        set
        {
            if (_age == value) return;
            _age = value;
            OnPropertyChanged(); // compiler supplies "Age" here — different call site
        }
    }
}

var vm = new ViewModel();
vm.PropertyChanged += (s, e) => Console.WriteLine($"Changed: {e.PropertyName}");
vm.Name = "Alice"; // Changed: Name
vm.Age  = 30;      // Changed: Age
// Without CallerMemberName, every setter would need OnPropertyChanged(nameof(Name))
// — a string/identifier that could silently go stale if the property is renamed
// without updating the nameof() call (though nameof() itself is refactor-safe;
// the OLDER pre-nameof() pattern used raw string literals, which were NOT).`,
    },
    {
      label: 'Explicit override — forwarding the ORIGINAL caller through a wrapper',
      language: 'csharp',
      code: `using System.Runtime.CompilerServices;

public static class Logger
{
    public static void Log(string message, [CallerMemberName] string caller = "") =>
        Console.WriteLine($"{caller}: {message}");
}

public static class LoggerWrapper
{
    // Without explicit forwarding, EVERY call through this wrapper would
    // report "LogWarning" as the caller — hiding the ACTUAL calling method:
    public static void LogWarning(string message, [CallerMemberName] string caller = "")
    {
        // Explicitly passing "caller" here forwards the ORIGINAL caller's
        // name through to Logger.Log, overriding what CallerMemberName
        // would otherwise auto-capture (which would be "LogWarning" itself,
        // since THIS is the immediate call site from Logger.Log's perspective):
        Logger.Log($"WARNING: {message}", caller);
    }
}

public class PaymentService
{
    public void Process()
    {
        LoggerWrapper.LogWarning("Payment retry limit reached");
        // Output: Process: WARNING: Payment retry limit reached
        // — correctly shows "Process" (the real caller), NOT "LogWarning"
        // (the wrapper), because "caller" was explicitly forwarded rather
        // than left for the compiler to auto-fill at the wrapper's own call site.
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'If <code>LoggerWrapper.LogWarning</code> in the third example had NOT explicitly forwarded the <code>caller</code> parameter (just called <code>Logger.Log($"WARNING: {message}")</code> with no second argument), what would the output of <code>PaymentService.Process()</code> show as the caller name, and why?',
    hint: 'Think about WHERE the compiler-supplied CallerMemberName value gets determined — it is always the name of whatever member directly makes the call at that exact line, not some deeper original caller further up the stack. Without explicit forwarding, that "directly calling member" from Logger.Log\'s perspective is LoggerWrapper.LogWarning itself.',
    solution: `// Without explicit forwarding:
public static void LogWarning(string message, [CallerMemberName] string caller = "")
{
    Logger.Log($"WARNING: {message}"); // no second argument passed
}

// CallerMemberName is resolved at EACH call site independently — it has
// no concept of "the original caller further up the stack," only "who
// directly called ME at this exact line." From Logger.Log's perspective,
// the direct caller at this line is LoggerWrapper.LogWarning itself —
// NOT PaymentService.Process, which is one level further removed.

public class PaymentService
{
    public void Process()
    {
        LoggerWrapper.LogWarning("Payment retry limit reached");
        // Output WITHOUT forwarding: LogWarning: WARNING: Payment retry limit reached
        // — shows "LogWarning" (the wrapper), NOT "Process" (the real
        // caller) — losing the actually useful diagnostic information.
    }
}

// This is exactly why the explicit-forwarding pattern from the third code
// example matters: any wrapper/helper method that itself calls a
// CallerMemberName-using method needs to explicitly accept its OWN
// [CallerMemberName] parameter and forward it manually — otherwise every
// call through the wrapper reports the wrapper's own name instead of the
// genuinely useful original caller.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'CallerMemberName, CallerLineNumber, and CallerFilePath work via reflection or stack-walking at runtime, similar to capturing an exception\'s stack trace.',
      reality: 'these attributes are resolved entirely at COMPILE TIME — the compiler substitutes the appropriate literal value directly into the generated IL at each call site, making them essentially free at runtime with no stack-walking involved.',
    },
    {
      thought: 'a method using [CallerMemberName] through a wrapper/helper method automatically reports the ORIGINAL, outermost caller further up the call stack.',
      reality: 'CallerMemberName always resolves to whoever directly calls the method AT THAT EXACT CALL SITE — a wrapper method that itself calls a CallerMemberName-using method reports the WRAPPER\'s name unless it explicitly accepts and forwards its own [CallerMemberName] parameter.',
    },
    {
      thought: 'these caller-info attributes can be applied to any parameter, required or optional, in any position.',
      reality: 'they must decorate an OPTIONAL parameter (one with a default value) and follow the same positional rule as any other optional parameter — appearing after all required parameters in the method signature.',
    },
  ];
}
