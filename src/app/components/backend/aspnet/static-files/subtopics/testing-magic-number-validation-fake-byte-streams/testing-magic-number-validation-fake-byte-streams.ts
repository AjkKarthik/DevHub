import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-magic-number-validation-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-magic-number-validation-fake-byte-streams.html',
  styleUrl: './testing-magic-number-validation-fake-byte-streams.scss',
})
export class TestingMagicNumberValidationFakeByteStreamsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Common Mistakes section shows the FIX for Content-Type spoofing — but the fix itself is exactly the kind of security-critical logic that needs a real test, not a visual code review',
      points: [
        'The main Static Files page\'s "Trusting client-supplied Content-Type" mistake shows reading the first 3 bytes and comparing against <code>[0xFF, 0xD8, 0xFF]</code> for JPEG validation. This is CORRECT security logic — but it is also exactly the kind of boundary-condition-heavy code (off-by-one byte offsets, wrong-length reads, an inverted comparison) that silently accepts an invalid file or silently rejects a valid one without ever throwing an exception, making a code review the only defense unless a test exists.',
      ],
    },
    {
      heading: 'A test can construct byte arrays for KNOWN-GOOD and KNOWN-BAD files entirely in memory — no real image files need to exist on disk',
      points: [
        'Since magic-number validation only reads the FIRST FEW BYTES of a stream, a test does not need a real JPEG or PNG file at all — it only needs a <code>MemoryStream</code> wrapping a byte array whose first bytes match (or deliberately do NOT match) the expected signature. This makes the test fast, hermetic, and able to enumerate EVERY edge case explicitly: a valid signature, a completely wrong signature, a stream shorter than the signature length, and a signature that matches PART of the expected bytes but not all of them (e.g., <code>FF D8 00</code> instead of <code>FF D8 FF</code>).',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Extracting the main page\'s magic-number check into a testable, file-agnostic method',
      language: 'csharp',
      code: `public static class FileSignatureValidator
{
    private static readonly byte[] JpegSignature = [0xFF, 0xD8, 0xFF];
    private static readonly byte[] PngSignature  = [0x89, 0x50, 0x4E, 0x47];

    public static async Task<bool> IsValidJpegAsync(Stream stream)
    {
        if (stream.Length < JpegSignature.Length) return false;

        var header = new byte[JpegSignature.Length];
        var originalPosition = stream.Position;
        stream.Position = 0;
        await stream.ReadExactlyAsync(header);
        stream.Position = originalPosition;   // rewind for the caller

        return header.AsSpan().SequenceEqual(JpegSignature);
    }

    public static async Task<bool> IsValidPngAsync(Stream stream)
    {
        if (stream.Length < PngSignature.Length) return false;

        var header = new byte[PngSignature.Length];
        var originalPosition = stream.Position;
        stream.Position = 0;
        await stream.ReadExactlyAsync(header);
        stream.Position = originalPosition;

        return header.AsSpan().SequenceEqual(PngSignature);
    }
}`,
    },
    {
      label: 'Testing every edge case with in-memory byte arrays — no real image files needed',
      language: 'csharp',
      code: `public class FileSignatureValidatorTests
{
    [Fact]
    public async Task IsValidJpegAsync_ReturnsTrue_ForCorrectSignature()
    {
        using var stream = new MemoryStream([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
        Assert.True(await FileSignatureValidator.IsValidJpegAsync(stream));
    }

    [Fact]
    public async Task IsValidJpegAsync_ReturnsFalse_ForCompletelyWrongSignature()
    {
        // A PNG signature disguised with a .jpg extension and
        // Content-Type: image/jpeg — the exact spoofing attack the main
        // page's mistake section describes:
        using var stream = new MemoryStream([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A]);
        Assert.False(await FileSignatureValidator.IsValidJpegAsync(stream));
    }

    [Fact]
    public async Task IsValidJpegAsync_ReturnsFalse_ForPartiallyMatchingSignature()
    {
        // The FIRST TWO bytes match JPEG (FF D8) but the third byte is
        // wrong (00 instead of FF) — this specifically catches an
        // off-by-one or "close enough" comparison bug, e.g. a broken
        // implementation that only checked the first TWO bytes instead
        // of all three:
        using var stream = new MemoryStream([0xFF, 0xD8, 0x00, 0x00]);
        Assert.False(await FileSignatureValidator.IsValidJpegAsync(stream));
    }

    [Fact]
    public async Task IsValidJpegAsync_ReturnsFalse_ForStreamShorterThanSignature()
    {
        // A 2-byte stream can never contain a valid 3-byte JPEG signature
        // — this specifically catches a bug where ReadExactlyAsync would
        // otherwise throw an unhandled EndOfStreamException instead of
        // gracefully returning false:
        using var stream = new MemoryStream([0xFF, 0xD8]);
        Assert.False(await FileSignatureValidator.IsValidJpegAsync(stream));
    }

    [Fact]
    public async Task IsValidJpegAsync_RewindsStreamPosition_SoCallerCanStillReadTheFile()
    {
        // This is the mistake the main page's own code comment
        // ("rewind before saving") explicitly warns about — a test can
        // directly verify the rewind actually happens, rather than
        // trusting the comment:
        using var stream = new MemoryStream([0xFF, 0xD8, 0xFF, 0xE0]);
        await FileSignatureValidator.IsValidJpegAsync(stream);

        Assert.Equal(0, stream.Position);
    }
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The main page\'s <code>IsValidJpegAsync</code>-style check (as extracted in this subtopic) only validates the FIRST few bytes. Propose a test case that demonstrates a REAL limitation of magic-number validation alone, and explain what additional validation step — beyond what this subtopic covers — a production system would need to fully close the gap.',
    hint: 'Consider a file that has a perfectly valid JPEG header in its first 3 bytes, but ALSO contains additional malicious content appended somewhere later in the same file — does a magic-number check alone catch this?',
    solution: `A test demonstrating the real limitation:

[Fact]
public async Task IsValidJpegAsync_ReturnsTrue_EvenWhenMaliciousContentIsAppendedAfterValidHeader()
{
    // A file with a PERFECTLY VALID JPEG header, followed by embedded
    // HTML/JavaScript appended after the image data — a real
    // "polyglot file" attack technique (a single file that is
    // simultaneously a valid JPEG AND valid HTML, depending on which
    // parser reads it):
    var maliciousBytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 }
        .Concat(Encoding.UTF8.GetBytes("<script>alert(document.cookie)</script>"))
        .ToArray();

    using var stream = new MemoryStream(maliciousBytes);

    // This PASSES the magic-number check — proving that magic-number
    // validation alone is necessary but NOT sufficient:
    Assert.True(await FileSignatureValidator.IsValidJpegAsync(stream));
}

This demonstrates that magic-number validation only proves a file BEGINS
with the correct signature — it says nothing about what else the file
contains. A production system handling untrusted uploads needs additional
layers beyond what this subtopic's tests cover:

1. Re-encoding the image through a trusted image-processing library
   (e.g., ImageSharp or SkiaSharp) rather than storing the uploaded bytes
   verbatim — a genuine re-encode strips any appended non-image data,
   since the encoder only reads valid image structure and writes fresh
   output.
2. Serving all user-uploaded files from a separate origin (exactly as the
   main page's own "Serving user-uploaded files from the same origin"
   mistake describes) so that even if a polyglot file WERE served, any
   embedded script would not execute with access to the main
   application's cookies or session.

The key lesson: magic-number validation is one necessary layer in a
defense-in-depth strategy, not a complete solution on its own — this
subtopic's tests prove what it DOES catch (spoofed Content-Type, wrong
file type), while this exercise proves what it does NOT catch (a
polyglot file with valid header bytes but malicious trailing content).`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing magic-number file validation requires real sample image files checked into the test project.',
      reality: 'a MemoryStream wrapping a hand-constructed byte array is sufficient — magic-number validation only reads the first few bytes, so a test can enumerate every edge case (valid, invalid, partial-match, too-short) without any real file on disk.',
    },
    {
      thought: 'a magic-number check that returns true for a file\'s header guarantees the entire file is a safe, valid image.',
      reality: 'magic-number validation only proves the file BEGINS with the correct signature — a polyglot file can have a perfectly valid image header followed by appended malicious content, which the check alone cannot detect.',
    },
    {
      thought: 'a stream shorter than the expected signature length will throw an exception when read, which is acceptable error-handling behavior for invalid uploads.',
      reality: 'an unhandled EndOfStreamException from a naive ReadExactlyAsync call on a too-short stream is a genuine bug, not acceptable behavior — the validator should explicitly check stream.Length first and return false gracefully, which is exactly what a dedicated test for this case catches.',
    },
  ];
}
