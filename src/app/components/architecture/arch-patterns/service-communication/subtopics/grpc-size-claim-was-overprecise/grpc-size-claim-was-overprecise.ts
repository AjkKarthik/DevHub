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
  templateUrl: './grpc-size-claim-was-overprecise.html',
  styleUrl: './grpc-size-claim-was-overprecise.scss'
})
export class GrpcSizeClaimWasOverpreciseSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A precise-sounding number that outran what the benchmarks actually show',
      points: [
        'The page originally stated Protobuf binary encoding is "~7× smaller than JSON" — a specific, confident-sounding multiplier repeated in both the theory section and a code comment.',
        'Verified via WebSearch across several independent benchmarks: the commonly cited figure is 3-5× smaller (uncompressed), with one source describing "approximately 56% smaller" (roughly 2.3×) as typical, and payload SHAPE matters more than any single fixed ratio — messages dominated by integers/enums/booleans compress much better than messages with many string fields, since strings are encoded verbatim in both formats.',
        '"~7×" isn\'t pure fiction — one specific benchmark did report protobuf reaching as small as 16% of gzipped JSON size (roughly 6×) for small messages — but presenting that edge case as THE general figure, without the shape-dependency caveat, overstates what a typical service-to-service payload will actually see.',
        'The page has been corrected to "commonly 3-5× smaller... more for integer/enum-heavy payloads, less for string-heavy ones" — a range with the caveat that actually explains WHY the number varies, instead of one falsely-precise figure.',
      ]
    },
    {
      heading: 'Why a specific number is worth double-checking even when the general direction is correct',
      points: [
        'The underlying claim — Protobuf binary encoding is smaller than JSON — is completely true and not in question. What needed correcting was the SPECIFIC MULTIPLIER, not the direction of the comparison.',
        'A precise-looking number ("~7×") reads as more authoritative than a vague one ("smaller"), which paradoxically makes it LESS likely to get double-checked before publishing — the same pattern already caught elsewhere in this codebase with specific dashboard IDs and version numbers that turned out to be off.',
        'The fix here isn\'t "always avoid numbers" — a caveated range (3-5×, with the shape-dependency explanation) is MORE useful to a reader than either an unqualified "smaller" or an overprecise single figure, because it tells them what actually determines the ratio for their own specific payload.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why payload shape changes the ratio',
      language: 'typescript',
      code: `// Integer/enum-heavy: Protobuf's varint encoding wins big
interface StockLevel {
  productId: number;   // varint: 1-5 bytes vs JSON's full decimal digits + quotes
  quantity: number;    // varint: compact for small numbers
  inStock: boolean;    // 1 bit-ish vs JSON's "true"/"false" (4-5 bytes)
}
// Typical reduction here: on the higher end of the 3-5x range, sometimes more

// String-heavy: both formats encode strings almost identically
interface ProductDescription {
  productId: string;
  name: string;         // stored verbatim in both formats
  description: string;  // long text -- Protobuf's tag overhead is a rounding error here
}
// Typical reduction here: much closer to 1x -- the field NAMES disappear
// (Protobuf uses numbered tags, not repeated string keys like JSON), but the
// actual string VALUES cost roughly the same in both formats

// Lesson: "Protobuf is smaller" is reliably true; "by how much" depends on
// which of these two shapes your actual payload looks more like.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate says "we should switch our internal price-lookup API from REST/JSON to gRPC — it\'ll cut our payload size by 7x, guaranteed." Your price-lookup responses look like { productId: 40219, price: 29.99, currency: "USD", inStock: true }. Is "guaranteed 7x" the right expectation to set?',
    hint: 'Compare the shape of this specific payload (numbers, a short currency code, a boolean) against the two contrasting cases in this subtopic\'s own code example.',
    solution: 'Not as a guarantee, though a meaningful reduction is a safe bet. This payload leans toward the integer/enum-heavy shape (productId, price as a number, a boolean) with only one short string field (currency) — so it should land on the higher end of the realistic 3-5x range, not the string-heavy end closer to 1x. But "guaranteed 7x" oversells it: that figure only showed up in one specific small-message benchmark, not as a general rule. The honest framing is "a meaningful reduction, likely in the 3-5x range for a payload shaped like this one" -- accurate, and still a strong enough case to justify the migration without setting an expectation that might not hold up when someone actually measures it.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A specific multiplier like "7x smaller" found in a technical reference is inherently more trustworthy than a vague range like "3-5x smaller."',
      reality: 'Per this subtopic\'s theory, precision is not the same as accuracy — the specific "7x" figure was actually LESS representative of typical results than the caveated 3-5x range, since it came from one edge-case benchmark rather than the general pattern.'
    },
    {
      thought: 'Protobuf vs JSON size reduction is a fixed, universal ratio you can quote regardless of what the payload actually contains.',
      reality: 'Per this subtopic\'s theory, payload SHAPE is the dominant factor — integer/enum-heavy payloads compress far better than string-heavy ones, because strings are encoded almost identically in both formats.'
    },
    {
      thought: 'Since the specific "7x" number was wrong, the underlying claim that Protobuf is smaller than JSON is also questionable.',
      reality: 'Per this subtopic\'s theory, the DIRECTION of the claim (Protobuf binary encoding is smaller) was never in doubt across any benchmark found — only the specific multiplier needed correcting, not the underlying fact.'
    }
  ];
}
