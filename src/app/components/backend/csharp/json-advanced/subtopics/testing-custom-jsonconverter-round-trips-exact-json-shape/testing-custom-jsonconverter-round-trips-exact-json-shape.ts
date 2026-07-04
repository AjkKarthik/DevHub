import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-custom-jsonconverter-round-trips-exact-json-shape-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-custom-jsonconverter-round-trips-exact-json-shape.html',
  styleUrl: './testing-custom-jsonconverter-round-trips-exact-json-shape.scss',
})
export class TestingCustomJsonconverterRoundTripsExactJsonShapeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A round-trip test (serialize then deserialize, compare objects) can pass even when Read and Write are BOTH wrong, in matching ways',
      points: [
        'The main System.Text.Json Advanced page\'s <code>UnixTimestampConverter</code> example converts a <code>DateTime</code> to/from a Unix timestamp <code>long</code>. A tempting but INCOMPLETE test is: serialize an object, deserialize the JSON back, and assert the resulting object equals the original. This only proves <code>Read(Write(x)) == x</code> — it says NOTHING about whether the actual JSON produced is in the format any OTHER system (a JavaScript frontend, a third-party API consumer) actually expects.',
        'A genuinely thorough converter test asserts the EXACT JSON STRING produced by <code>Write</code>, independently of ever calling <code>Read</code> — and separately, asserts <code>Read</code> against a HAND-WRITTEN JSON literal, independently of ever calling <code>Write</code>. This is the only way to catch a converter whose <code>Write</code> emits milliseconds where <code>Read</code> expects seconds (a "matching" bug that a round-trip test cannot detect, since <code>Read</code> would consistently misinterpret whatever <code>Write</code> consistently mis-emits).',
      ],
    },
    {
      heading: 'Testing Utf8JsonReader/Writer-based converters directly, without going through JsonSerializer at all',
      points: [
        'A <code>JsonConverter&lt;T&gt;</code>\'s <code>Write</code> method can be invoked directly against a <code>Utf8JsonWriter</code> wrapping a <code>MemoryStream</code>/<code>ArrayBufferWriter&lt;byte&gt;</code>, without ever calling <code>JsonSerializer.Serialize</code> — this isolates the converter\'s own logic from the rest of the serialization pipeline (property naming policy, other converters, options merging), which matters because those OTHER settings can accidentally mask or interact with a converter bug when tested only through the full <code>JsonSerializer</code> call.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The incomplete test — a round-trip that hides an asymmetric bug',
      language: 'csharp',
      code: `// The main page's UnixTimestampConverter, but with a subtle bug:
// Write emits MILLISECONDS, Read expects SECONDS (a copy-paste/unit mismatch)
public class BuggyUnixTimestampConverter : JsonConverter<DateTime>
{
    private static readonly DateTime Epoch =
        new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    public override DateTime Read(ref Utf8JsonReader reader, Type type, JsonSerializerOptions options)
    {
        long seconds = reader.GetInt64();
        return Epoch.AddSeconds(seconds);       // expects SECONDS
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        long milliseconds = (long)(value.ToUniversalTime() - Epoch).TotalMilliseconds;
        writer.WriteNumberValue(milliseconds);  // BUG: emits MILLISECONDS
    }
}

[Fact]
public void RoundTrip_Passes_DespiteTheBug()
{
    var opts = new JsonSerializerOptions { Converters = { new BuggyUnixTimestampConverter() } };
    var original = new DateTime(2024, 6, 1, 12, 0, 0, DateTimeKind.Utc);

    string json = JsonSerializer.Serialize(original, opts);
    var restored = JsonSerializer.Deserialize<DateTime>(json, opts);

    // THIS PASSES — Write emits milliseconds, Read reads them back as
    // "seconds", producing a WILDLY wrong DateTime (centuries in the
    // future) — but since Read just re-consumes whatever Write emitted,
    // the round trip is self-consistent and the assertion below is
    // comparing "original" to a value that happens to equal it only
    // because both sides share the SAME bug:
    Assert.Equal(original, restored); // PASSES — masks the real bug entirely
}`,
    },
    {
      label: 'The real test — assert the EXACT JSON shape independently of Read',
      language: 'csharp',
      code: `[Fact]
public void Write_ProducesUnixTimestampInSeconds_NotMilliseconds()
{
    var opts = new JsonSerializerOptions { Converters = { new BuggyUnixTimestampConverter() } };
    var value = new DateTime(2024, 6, 1, 12, 0, 0, DateTimeKind.Utc);

    string json = JsonSerializer.Serialize(value, opts);

    // A known-correct external tool (any Unix-epoch calculator) gives
    // 1717243200 for this exact instant — asserting the LITERAL JSON
    // text, independent of ever calling Read, immediately reveals the
    // real bug:
    Assert.Equal("1717243200000", json);  // FAILS — proves Write is
                                           // emitting milliseconds, not
                                           // seconds, regardless of what
                                           // Read does with it afterwards
}

[Fact]
public void Read_ParsesHandWrittenSecondsCorrectly()
{
    var opts = new JsonSerializerOptions { Converters = { new BuggyUnixTimestampConverter() } };

    // A hand-written JSON literal, from an EXTERNAL source (e.g. a real
    // third-party API response) — not generated by this converter's OWN
    // Write method, so it cannot share Write's bug:
    var restored = JsonSerializer.Deserialize<DateTime>("1717243200", opts);

    Assert.Equal(new DateTime(2024, 6, 1, 12, 0, 0, DateTimeKind.Utc), restored);
    // This test ALSO passes on its own, in isolation — proving Read's
    // logic is individually correct. Only by testing Write and Read
    // SEPARATELY, against known-correct literals rather than against
    // each other, does the millisecond-vs-second mismatch surface.
}`,
    },
    {
      label: 'Testing a converter directly against Utf8JsonWriter — bypassing JsonSerializer entirely',
      language: 'csharp',
      code: `[Fact]
public void Converter_Write_EmitsExpectedBytes_ViaUtf8JsonWriterDirectly()
{
    var converter = new UnixTimestampConverter(); // the CORRECT converter
    var buffer = new ArrayBufferWriter<byte>();

    using (var writer = new Utf8JsonWriter(buffer))
    {
        converter.Write(writer, new DateTime(2024, 6, 1, 12, 0, 0, DateTimeKind.Utc),
                         new JsonSerializerOptions());
    }

    string written = Encoding.UTF8.GetString(buffer.WrittenSpan);

    // Testing the converter's OWN Write method directly, with no
    // JsonSerializer, no other registered converters, and no naming
    // policy in the mix — isolates exactly what THIS converter emits,
    // independent of anything else in the serialization pipeline:
    Assert.Equal("1717243200", written);
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A <code>JsonConverter&lt;decimal&gt;</code> is meant to serialize money values rounded to 2 decimal places. Its <code>Write</code> method has a bug: it rounds using <code>MidpointRounding.AwayFromZero</code>, but <code>Read</code> parses the string back with no rounding at all. Explain why a round-trip test on the value <code>10.005m</code> could still pass, and how to write a test that catches the <code>Write</code> bug specifically.',
    hint: 'Consider what "the value that comes back out" actually proves versus what "the exact JSON text produced" proves — a round-trip only checks the FIRST, and a rounding bug in Write can be invisible to it if Read simply parses back whatever Write wrote, correctly rounded or not.',
    solution: `// The buggy converter — Write rounds AwayFromZero (which may not match
// the actual business requirement, e.g. banker's rounding / MidpointRounding.ToEven):
public class MoneyConverter : JsonConverter<decimal>
{
    public override decimal Read(ref Utf8JsonReader reader, Type type, JsonSerializerOptions options)
        => decimal.Parse(reader.GetString()!); // no rounding — just parses whatever string it's given

    public override void Write(Utf8JsonWriter writer, decimal value, JsonSerializerOptions options)
        => writer.WriteStringValue(Math.Round(value, 2, MidpointRounding.AwayFromZero).ToString("F2"));
}

// A round-trip test on 10.005m:
[Fact]
public void RoundTrip_Passes_ButHidesTheRoundingChoice()
{
    var opts = new JsonSerializerOptions { Converters = { new MoneyConverter() } };
    string json = JsonSerializer.Serialize(10.005m, opts);   // "10.01" (AwayFromZero)
    decimal restored = JsonSerializer.Deserialize<decimal>(json, opts); // parses "10.01" back

    // PASSES — but only because Read just re-parses whatever string
    // Write produced. If the business requirement was actually
    // MidpointRounding.ToEven ("10.00"), this test gives ZERO signal
    // that the WRONG rounding mode was used — restored simply equals
    // whatever Write happened to emit, correct or not:
    Assert.Equal(10.01m, restored); // "passes", proves nothing about correctness
}

// The real test — assert the EXACT JSON string Write produces,
// independent of Read, against the actual business requirement:
[Fact]
public void Write_RoundsToEven_NotAwayFromZero()
{
    var opts = new JsonSerializerOptions { Converters = { new MoneyConverter() } };

    string json = JsonSerializer.Serialize(10.005m, opts);

    // If the business requirement is banker's rounding (ToEven), this
    // assertion FAILS against the buggy converter above, immediately
    // revealing the wrong MidpointRounding mode was used — a failure a
    // round-trip test could never produce, since Read simply trusts
    // whatever numeric string Write already committed to:
    Assert.Equal("\\"10.00\\"", json);
}`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a passing round-trip test (serialize then deserialize equals the original) proves a JsonConverter&lt;T&gt; is correct.',
      reality: 'it only proves Read can undo whatever Write produced — if both methods share a consistent but wrong assumption (wrong unit, wrong rounding mode, wrong format), the round trip is self-consistent and the test passes despite the real bug.',
    },
    {
      thought: 'testing a custom converter requires going through JsonSerializer.Serialize/Deserialize.',
      reality: 'a converter\'s Write and Read methods can be called directly against a Utf8JsonWriter/Utf8JsonReader, isolating the converter\'s own logic from the rest of the options pipeline (other converters, naming policies) entirely.',
    },
    {
      thought: 'asserting the deserialized object equals the original is a stronger test than asserting the exact JSON string.',
      reality: 'asserting the exact JSON string is the STRONGER check — it verifies the actual wire format against a known-correct expectation, which is what any external consumer (a frontend, a third-party API) actually depends on, not just internal round-trip consistency.',
    },
  ];
}
