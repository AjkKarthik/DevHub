import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-dispose-actually-called-spy-wrapper-double-dispose-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-dispose-actually-called-spy-wrapper-double-dispose.html',
  styleUrl: './testing-dispose-actually-called-spy-wrapper-double-dispose.scss',
})
export class TestingDisposeActuallyCalledSpyWrapperDoubleDisposeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own challenge never verifies Dispose() was actually called — that is exactly what a test should check',
      points: [
        'The main GC & IDisposable page\'s own <code>ManagedFileLogger</code> challenge requires Dispose()/DisposeAsync() to flush and close a <code>StreamWriter</code>, and to be safe to call multiple times. None of that is verified by any test in the main page — it is demonstrated only by prose description. Two distinct, genuinely testable claims hide in those requirements: "the underlying resource\'s Dispose() was actually invoked" and "calling Dispose() twice does not throw or double-cleanup."',
      ],
    },
    {
      heading: 'A spy wrapper lets you assert Dispose() was actually called on the wrapped resource',
      points: [
        'A common technique: wrap the REAL disposable dependency in a tiny "spy" class that records whether <code>Dispose()</code> was invoked, then inject the spy in place of the real dependency. This directly answers "did my class actually dispose its field?" instead of relying on inspecting whether the underlying file handle was released (hard to observe directly and OS-dependent).',
        'This spy pattern generalizes the main page\'s own <code>DatabaseSession</code>/<code>NativeFileWrapper</code> examples — anywhere a class wraps an <code>IDisposable</code> field and is expected to dispose it, a spy substituted for that field turns "did cleanup happen" into a directly assertable boolean, without needing real I/O at all.',
      ],
    },
    {
      heading: 'Testing double-dispose safety is a distinct, equally important assertion',
      points: [
        'The main page\'s own Common Mistakes section states the <code>IDisposable</code> contract REQUIRES that calling <code>Dispose()</code> twice be safe (a no-op the second time) — this is a genuinely testable behavioral contract: call <code>Dispose()</code> twice and assert NO exception is thrown, and (using the same spy) assert the underlying resource\'s <code>Dispose()</code> was called exactly ONCE, not twice, confirming the <code>_disposed</code> guard actually works rather than just trusting that it was written correctly.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A spy wrapper — records whether Dispose() was actually called',
      language: 'csharp',
      code: `public class DisposeSpy : IDisposable
{
    public int DisposeCallCount { get; private set; }
    public void Dispose() => DisposeCallCount++;
}

// A class under test that SHOULD dispose its field:
public class DatabaseSession : IDisposable
{
    private readonly IDisposable _connection;
    private bool _disposed;

    public DatabaseSession(IDisposable connection) => _connection = connection;

    public void Dispose()
    {
        if (_disposed) return;
        _connection.Dispose();
        _disposed = true;
    }
}`,
    },
    {
      label: 'Testing Dispose() was actually called, and exactly once',
      language: 'csharp',
      code: `using Xunit;

public class DatabaseSessionTests
{
    [Fact]
    public void Dispose_DisposesUnderlyingConnection()
    {
        var spy = new DisposeSpy();
        var session = new DatabaseSession(spy);

        session.Dispose();

        // Directly verifies the CLAIM "my class disposes its field" —
        // not just "no exception was thrown":
        Assert.Equal(1, spy.DisposeCallCount);
    }

    [Fact]
    public void Dispose_CalledTwice_DisposesUnderlyingConnectionOnlyOnce()
    {
        var spy = new DisposeSpy();
        var session = new DatabaseSession(spy);

        session.Dispose();
        session.Dispose(); // second call — must be a safe no-op

        // Proves the _disposed guard actually prevents a redundant
        // second call to the underlying resource's Dispose(), rather
        // than just trusting the guard was written correctly:
        Assert.Equal(1, spy.DisposeCallCount);
    }
}`,
    },
    {
      label: 'Extending the spy to IAsyncDisposable for the main page\'s own async pattern',
      language: 'csharp',
      code: `public class AsyncDisposeSpy : IAsyncDisposable
{
    public int DisposeAsyncCallCount { get; private set; }
    public ValueTask DisposeAsync()
    {
        DisposeAsyncCallCount++;
        return ValueTask.CompletedTask;
    }
}

public class AsyncDbSession : IAsyncDisposable
{
    private readonly IAsyncDisposable _conn;
    private bool _disposed;
    public AsyncDbSession(IAsyncDisposable conn) => _conn = conn;

    public async ValueTask DisposeAsync()
    {
        if (_disposed) return;
        await _conn.DisposeAsync();
        _disposed = true;
    }
}

public class AsyncDbSessionTests
{
    [Fact]
    public async Task DisposeAsync_DisposesUnderlyingConnectionExactlyOnce()
    {
        var spy = new AsyncDisposeSpy();
        var session = new AsyncDbSession(spy);

        await session.DisposeAsync();
        await session.DisposeAsync(); // second call — safe no-op

        Assert.Equal(1, spy.DisposeAsyncCallCount);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The main topic page\'s own <code>ManagedFileLogger</code> wraps a <code>StreamWriter</code> field directly (a concrete type, not an injected interface). Explain what change would be needed to make "Dispose() flushes and disposes the writer" independently testable with a spy, without touching a real file.',
    hint: 'StreamWriter is a concrete class — to substitute a spy, the constructor would need to accept an abstraction (an interface like IDisposable, or a custom interface exposing Flush/Write members) instead of constructing a real StreamWriter internally.',
    solution: `// As originally written — StreamWriter is constructed INSIDE the class,
// so there is no seam to substitute a spy:
public class ManagedFileLogger : IDisposable
{
    private StreamWriter? _writer;
    public ManagedFileLogger(string filePath) =>
        _writer = new StreamWriter(filePath, append: true);
    // ...
}

// To make disposal independently testable, accept the dependency
// through the constructor instead of constructing it internally —
// the same "depend on an abstraction, inject it" principle used for
// file-system testing elsewhere in this topic's sibling material:
public interface ILogWriter : IDisposable
{
    void WriteLine(string line);
}

public class StreamWriterLogWriter : ILogWriter
{
    private readonly StreamWriter _writer;
    public StreamWriterLogWriter(string path) => _writer = new StreamWriter(path, append: true);
    public void WriteLine(string line) => _writer.WriteLine(line);
    public void Dispose() => _writer.Dispose();
}

public class ManagedFileLogger : IDisposable
{
    private readonly ILogWriter _writer;
    public ManagedFileLogger(ILogWriter writer) => _writer = writer; // injected

    public void Dispose() => _writer.Dispose();
}

// Now a spy can be substituted for ILogWriter in tests, exactly like
// the DatabaseSession/DisposeSpy example — no real file ever touched,
// and "Dispose() disposes the writer" becomes a direct, one-line
// assertion instead of an unverifiable claim.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a test that calls Dispose() and confirms no exception is thrown has verified the disposal logic is correct.',
      reality: 'that only proves Dispose() didn\'t crash — it says nothing about whether the underlying resource\'s own Dispose() was actually invoked. A spy wrapper that records call counts is needed to verify the claim directly.',
    },
    {
      thought: 'double-dispose safety (calling Dispose() twice) is guaranteed by the IDisposable interface itself and doesn\'t need testing.',
      reality: 'the IDisposable CONTRACT requires double-dispose to be safe, but the interface provides no enforcement — a class\'s own _disposed guard is what makes it safe, and that guard is exactly the kind of easily-broken logic worth a dedicated test.',
    },
    {
      thought: 'you can only verify Dispose() was called by inspecting real OS-level effects, like whether a file handle was actually released.',
      reality: 'a spy wrapper substituted for the disposable dependency turns "was Dispose() called" into a directly assertable in-memory boolean or counter — no real OS resources need to be involved in the test at all.',
    },
  ];
}
