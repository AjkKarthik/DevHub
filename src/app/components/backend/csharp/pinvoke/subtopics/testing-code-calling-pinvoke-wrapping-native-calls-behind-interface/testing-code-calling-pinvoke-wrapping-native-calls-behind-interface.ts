import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-code-calling-pinvoke-wrapping-native-calls-behind-interface-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-code-calling-pinvoke-wrapping-native-calls-behind-interface.html',
  styleUrl: './testing-code-calling-pinvoke-wrapping-native-calls-behind-interface.scss',
})
export class TestingCodeCallingPinvokeWrappingNativeCallsBehindInterfaceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Every code example on the main page calls a static [LibraryImport] method directly — this is genuinely untestable in isolation',
      points: [
        'The main P/Invoke page\'s <code>FileInterop.CreateFile()</code>, <code>Win32.GetWindowRect()</code>, and similar examples are all <code>static partial</code> methods calling INTO a real native library. A unit test calling these directly is really an INTEGRATION test — it requires the actual DLL/.so to be present, actually opens real files or queries real windows, and behaves differently across Windows/Linux/macOS CI runners. None of this is what you actually want when testing your OWN business logic that happens to USE these P/Invoke calls.',
      ],
    },
    {
      heading: 'The fix: wrap the static P/Invoke class behind a thin interface your business logic depends on, not the P/Invoke class itself',
      points: [
        'Extract an interface (e.g. <code>IFileSystemInterop</code>) with methods matching the SHAPE of what your business logic needs, and a real implementation that simply forwards to the actual <code>static partial</code> P/Invoke methods. Business logic depends on the INTERFACE (injected via DI, exactly like any other service) — never on the static P/Invoke class directly.',
        'This is NOT about making the interop code itself more testable in a deep sense (the interop code\'s CORRECTNESS still ultimately depends on the real native library behaving as documented, which no amount of interface-wrapping changes) — it is about making everything ELSE that calls into it (retry logic, error translation, higher-level orchestration) testable via a mock/fake implementation of the interface, completely independent of whether the real native library is even installed on the test-running machine.',
      ],
    },
    {
      heading: 'What stays a genuine integration test versus what becomes a fast unit test',
      points: [
        'A THIN smoke-test suite, run separately (and possibly platform-conditionally, since P/Invoke targets are often OS-specific) verifies the REAL interop implementation actually calls the REAL native library correctly — this remains a genuine integration test, and should stay one. Everything ELSE — the business logic deciding what to DO with the result, how to retry on a specific error code, how to translate a native error into a domain exception — moves to fast, deterministic unit tests against the FAKE implementation of the interface.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The interface — matching the SHAPE the main page\'s FileInterop needs',
      language: 'csharp',
      code: `// The interface business logic depends on — NOT the static P/Invoke class:
public interface IFileSystemInterop
{
    NativeFileHandle CreateFile(string path);
    int ReadFile(NativeFileHandle handle, byte[] buffer);
}

// The REAL implementation — a thin forwarding layer over the main
// page's actual static partial P/Invoke methods:
public sealed class Win32FileSystemInterop : IFileSystemInterop
{
    public NativeFileHandle CreateFile(string path) =>
        FileInterop.CreateFile(path, 0x80000000, 1, 0, 3, 0, 0);

    public int ReadFile(NativeFileHandle handle, byte[] buffer)
    {
        FileInterop.ReadFile(handle, buffer, (uint)buffer.Length, out uint read, 0);
        return (int)read;
    }
}

// Registered in DI like any other service:
services.AddSingleton<IFileSystemInterop, Win32FileSystemInterop>();`,
    },
    {
      label: 'Business logic depends on the interface, not the static P/Invoke class',
      language: 'csharp',
      code: `// The code actually worth unit testing — retry/error-handling LOGIC
// built AROUND the native call, not the native call itself:
public class ConfigFileReader
{
    private readonly IFileSystemInterop _interop;

    public ConfigFileReader(IFileSystemInterop interop) => _interop = interop;

    public string ReadConfigOrThrow(string path)
    {
        using var handle = _interop.CreateFile(path);
        if (handle.IsInvalid)
            throw new FileNotFoundException(\$"Could not open config file: {path}");

        var buffer = new byte[4096];
        int bytesRead = _interop.ReadFile(handle, buffer);

        if (bytesRead == 0)
            throw new InvalidDataException(\$"Config file is empty: {path}");

        return System.Text.Encoding.UTF8.GetString(buffer, 0, bytesRead);
    }
}`,
    },
    {
      label: 'Fast, deterministic unit tests — no real native library involved at all',
      language: 'csharp',
      code: `using Xunit;
using Moq;

public class ConfigFileReaderTests
{
    [Fact]
    public void ReadConfigOrThrow_HandleInvalid_ThrowsFileNotFoundException()
    {
        var mockInterop = new Mock<IFileSystemInterop>();
        // A FAKE invalid handle — no real native call ever happens:
        mockInterop.Setup(i => i.CreateFile(It.IsAny<string>()))
            .Returns(CreateInvalidHandleForTesting());

        var reader = new ConfigFileReader(mockInterop.Object);

        Assert.Throws<FileNotFoundException>(() => reader.ReadConfigOrThrow("missing.cfg"));
        // This test runs in milliseconds, on ANY OS, with NO real file
        // system access and NO dependency on the actual native DLL —
        // it proves ConfigFileReader's OWN error-translation logic is
        // correct, completely independent of Win32 CreateFile's real
        // behavior.
    }

    [Fact]
    public void ReadConfigOrThrow_EmptyFile_ThrowsInvalidDataException()
    {
        var mockInterop = new Mock<IFileSystemInterop>();
        mockInterop.Setup(i => i.CreateFile(It.IsAny<string>()))
            .Returns(CreateValidHandleForTesting());
        mockInterop.Setup(i => i.ReadFile(It.IsAny<NativeFileHandle>(), It.IsAny<byte[]>()))
            .Returns(0);  // simulate an empty file read — no real I/O at all

        var reader = new ConfigFileReader(mockInterop.Object);

        Assert.Throws<InvalidDataException>(() => reader.ReadConfigOrThrow("empty.cfg"));
    }
}`,
    },
    {
      label: 'What STAYS a real integration test — verifying the actual interop implementation',
      language: 'csharp',
      code: `// A SEPARATE, smaller test suite — genuinely calls the real native
// library, runs conditionally (often OS-specific), and is NOT part of
// the fast everyday unit-test loop:
public class Win32FileSystemInteropIntegrationTests
{
    [Fact]
    [Trait("Category", "Integration")]  // excluded from the default fast run
    public void CreateFile_ExistingFile_ReturnsValidHandle()
    {
        if (!OperatingSystem.IsWindows())
            return;  // this specific interop implementation is Windows-only

        var interop = new Win32FileSystemInterop();
        var tempPath = Path.GetTempFileName();

        using var handle = interop.CreateFile(tempPath);

        // THIS test genuinely exercises the real Win32 CreateFileW —
        // it is slower, OS-dependent, and touches the real file system,
        // which is exactly why it is a SEPARATE, explicitly-tagged
        // integration test rather than mixed into the fast unit suite:
        Assert.False(handle.IsInvalid);

        File.Delete(tempPath);
    }
}

// CI runs the fast unit suite on EVERY commit, and the "Integration"
// category separately (e.g. only on the target OS, less frequently) —
// the SAME two-tier structure recommended elsewhere in this hub for
// slow, environment-dependent verification.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate argues that wrapping <code>FileInterop</code> behind <code>IFileSystemInterop</code> is pointless because "the interface still just calls the same native code — you haven\'t actually tested P/Invoke." Explain precisely what the interface DOES and does NOT make testable, and why that distinction still has real value.',
    hint: 'Separate two different things being tested: the CORRECTNESS of the native call itself (does CreateFileW actually open a file the way documented) versus the CORRECTNESS of the C# logic that decides what to do with the result (error translation, retry policy, validation) — the interface only changes what\'s testable for the SECOND category.',
    solution: `// The teammate is CORRECT about one thing, and missing another:
//
// WHAT THE INTERFACE DOES NOT MAKE TESTABLE:
// Whether Win32's real CreateFileW function actually behaves as the
// Win32 documentation says — that remains entirely outside the reach
// of ANY unit test, mock, or interface wrapper. If Windows itself has
// a bug, or the marshalling attributes are subtly wrong (e.g. the
// classic Win32 BOOL vs C# bool mismatch from the main P/Invoke page),
// NO amount of interface abstraction changes that — this can ONLY be
// caught by an actual integration test that calls the real API.
//
// WHAT THE INTERFACE DOES MAKE TESTABLE — and this is the actual
// value proposition, not a consolation prize:
public class ConfigFileReader
{
    public string ReadConfigOrThrow(string path)
    {
        using var handle = _interop.CreateFile(path);
        if (handle.IsInvalid)
            throw new FileNotFoundException(/* ... */);   // <-- THIS logic

        var buffer = new byte[4096];
        int bytesRead = _interop.ReadFile(handle, buffer);
        if (bytesRead == 0)
            throw new InvalidDataException(/* ... */);    // <-- THIS logic

        return System.Text.Encoding.UTF8.GetString(buffer, 0, bytesRead); // <-- and THIS
    }
}
// Every line ABOVE the actual _interop calls is decision logic written
// BY YOUR TEAM, in C#, with real bugs possible: off-by-one buffer
// sizing, wrong exception type for a given failure mode, forgetting to
// handle a partial read, incorrect encoding assumptions. NONE of these
// bugs live inside the native library — they live in YOUR code, and
// THAT code is exactly what the interface + mock makes fast and
// deterministic to test, across every possible native-call OUTCOME
// (success, invalid handle, empty read, partial read) without needing
// to actually engineer those specific native conditions on a real file
// system.
//
// The honest framing: interface-wrapping P/Invoke does not test P/Invoke
// itself — it isolates and makes testable the (often larger, and more
// bug-prone in practice) BUSINESS LOGIC layered on top of it, while a
// SEPARATE, smaller, explicitly-tagged integration test suite remains
// responsible for verifying the real native call still behaves as
// documented.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'wrapping a static P/Invoke class behind an interface and mocking it in tests means you no longer need any real integration tests for that native code.',
      reality: 'the interface only makes the BUSINESS LOGIC around the native call testable — a separate, genuine integration test suite is still needed to verify the real native call actually behaves as documented, since no mock can prove that.',
    },
    {
      thought: 'unit tests calling a static [LibraryImport] method directly are meaningfully different from integration tests, as long as they run fast on the developer\'s machine.',
      reality: 'a test that calls a real native library — even quickly — is an integration test by nature: it depends on the actual OS/library being present and correctly installed, and behaves differently across platforms, which is exactly the class of dependency a unit test should not have.',
    },
    {
      thought: 'the value of interface-wrapping P/Invoke code is purely about following a DI convention, with no concrete testing benefit.',
      reality: 'it enables fast, deterministic tests of every possible native-call OUTCOME (success, failure, edge cases like an empty read) that would otherwise require actually engineering those specific conditions on a real file system, network, or OS resource — often impractical or flaky to set up for real.',
    },
  ];
}
