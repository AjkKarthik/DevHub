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
    heading: 'Two LogLevel Values the Adapter Originally Ignored',
    points: [
      '<code>Microsoft.Extensions.Logging.LogLevel</code> has seven values: Trace, Debug, Information, ' +
      'Warning, Error, Critical, and None. The main page\'s <code>SerilogAdapter&lt;T&gt;.IsEnabled()</code> ' +
      'switch originally had explicit cases for only four of them (Debug, Information, Warning, Error), with ' +
      'a catch-all <code>_ =&gt; false</code> for everything else.',
      'That catch-all silently swallowed BOTH ends of the severity spectrum: <code>LogLevel.Trace</code> (the ' +
      'lowest severity) and <code>LogLevel.Critical</code> (the HIGHEST severity) both fell into the same ' +
      '"disabled" bucket as <code>LogLevel.None</code>, which is supposed to mean "logging is off."',
      'Critical is the one severity level that should almost always report as enabled — it is reserved for ' +
      'failures serious enough to demand immediate attention. Having the adapter\'s own <code>IsEnabled()</code> ' +
      'answer "no" for Critical defeats the purpose of the level.',
    ],
  },
  {
    heading: 'The Log() Method Compounded the Same Gap',
    points: [
      'The <code>Log&lt;TState&gt;()</code> method\'s own switch handled only Error and Warning explicitly, ' +
      'with every other level — including Critical — falling into a <code>default</code> branch that called ' +
      '<code>serilog.Information(message)</code>.',
      'This meant a caller who bypassed <code>IsEnabled()</code> and logged directly at ' +
      '<code>LogLevel.Critical</code> would still have the message WRITTEN, but demoted to Serilog\'s ' +
      'Information level — losing exactly the severity signal that made it worth calling Critical in the ' +
      'first place.',
      'A monitoring rule watching for Serilog Fatal-level events (a common alerting setup) would never fire ' +
      'for these misclassified Critical logs, since they never actually reach Fatal.',
    ],
  },
  {
    heading: 'The Complete, Correct Mapping',
    points: [
      '.NET\'s <code>LogLevel</code> and Serilog\'s <code>LogEventLevel</code> are both six-tier severity ' +
      'scales that map cleanly one-to-one, except for .NET\'s extra <code>None</code> sentinel value (Serilog ' +
      'has no "off" level of its own — that concept lives in Serilog\'s sink/filter configuration instead).',
      'Trace → Verbose, Debug → Debug, Information → Information, Warning → Warning, Error → Error, Critical ' +
      '→ Fatal — every real severity level has a genuine Serilog counterpart. Only <code>LogLevel.None</code> ' +
      'has nothing to map to, which is exactly why it is the correct (and only) case that should fall through ' +
      'to <code>false</code>/no-op.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Complete Mapping',
    language: 'csharp',
    code: `public class SerilogAdapter<T>(Serilog.ILogger serilog) : ILogger<T>
{
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

    public bool IsEnabled(LogLevel logLevel) => logLevel switch
    {
        LogLevel.Trace       => serilog.IsEnabled(Serilog.Events.LogEventLevel.Verbose),
        LogLevel.Debug       => serilog.IsEnabled(Serilog.Events.LogEventLevel.Debug),
        LogLevel.Information => serilog.IsEnabled(Serilog.Events.LogEventLevel.Information),
        LogLevel.Warning     => serilog.IsEnabled(Serilog.Events.LogEventLevel.Warning),
        LogLevel.Error       => serilog.IsEnabled(Serilog.Events.LogEventLevel.Error),
        LogLevel.Critical    => serilog.IsEnabled(Serilog.Events.LogEventLevel.Fatal),
        _                    => false // LogLevel.None — the only value with no Serilog counterpart
    };

    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state,
        Exception? exception, Func<TState, Exception?, string> formatter)
    {
        var message = formatter(state, exception);
        switch (logLevel)
        {
            case LogLevel.Critical: serilog.Fatal(exception, message); break;
            case LogLevel.Error:    serilog.Error(exception, message); break;
            case LogLevel.Warning:  serilog.Warning(message); break;
            case LogLevel.Trace:    serilog.Verbose(message); break;
            default:                serilog.Information(message); break; // Information + Debug
        }
    }
}`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'Before this fix, a call like <code>logger.LogCritical("Payment processor is down!")</code> would still ' +
    'produce SOME output in the Serilog sink. What severity would that output actually be tagged with, and ' +
    'what real-world consequence could that mismatch cause for an on-call engineer relying on a ' +
    'Fatal-level alert rule?',
  hint:
    'Trace which branch of the original Log() switch a LogLevel.Critical call falls into — Error, Warning, or ' +
    'the default case?',
  solution:
    'LogLevel.Critical was not one of the two explicit cases (Error, Warning) in the original switch, so it ' +
    'fell into the default branch and was logged via serilog.Information(message) — meaning the output was ' +
    'tagged Information, not Fatal. An on-call alert rule configured to page someone whenever a Fatal-level ' +
    'event appears would never trigger for this message, even though the application code explicitly called ' +
    'LogCritical to signal exactly that kind of urgency. The message would still be visible in logs if someone ' +
    'went looking, but the automated alerting path that Critical-level logging exists to feed would silently ' +
    'miss it.',
};

const misconceptions: Misconception[] = [
  {
    thought: 'A default/catch-all case in a LogLevel switch is always a safe, harmless fallback.',
    reality:
      'A catch-all is only safe if every value that reaches it is genuinely equivalent in meaning. Here, ' +
      'Trace (near-noise, lowest priority) and Critical (the most urgent level that exists) both fell into the ' +
      'exact same fallback as each other AND as None (logging disabled) — three semantically opposite ' +
      'situations collapsed into one branch.',
  },
  {
    thought: 'IsEnabled() and Log() just need to individually work — they do not need to agree with each ' +
      'other.',
    reality:
      'They must stay in sync, or the adapter is internally inconsistent: if IsEnabled(Critical) answers ' +
      'false, calling code that checks it first will skip logging entirely for Critical, while code that logs ' +
      'unconditionally still gets output — just silently downgraded. Both methods need the SAME mental model ' +
      'of which levels exist and what they mean.',
  },
  {
    thought: 'Since .NET has 7 LogLevel values and Serilog has 6, a perfect one-to-one mapping is impossible.',
    reality:
      'Six of .NET\'s seven values map to Serilog\'s six levels exactly one-to-one (Trace/Verbose, Debug/Debug, ' +
      'Information/Information, Warning/Warning, Error/Error, Critical/Fatal). The seventh, ' +
      'LogLevel.None, is not a severity at all — it is .NET\'s way of saying "logging is turned off," a concept ' +
      'Serilog expresses through sink/filter configuration rather than a log-event level. It genuinely has no ' +
      'counterpart to map to, which is why it is the one case that correctly stays in the fallback branch.',
  },
];

@Component({
  selector: 'app-adapter-missing-loglevel-mappings',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './missing-loglevel-mappings.html',
  styleUrl: './missing-loglevel-mappings.scss',
})
export class MissingLoglevelMappingsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
