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
  templateUrl: './decimal-vendor-gb-vs-binary-os-gib-diverge-by-7-percent.html',
  styleUrl: './decimal-vendor-gb-vs-binary-os-gib-diverge-by-7-percent.scss'
})
export class DecimalVendorGbVsBinaryOsGibDivergeBy7PercentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A "convenient approximation" that quietly hides a real, growing error',
      points: [
        'The main page\'s Quick Reference originally stated the storage scale (KB → MB → GB → TB → PB) as flatly "each step is 1,024×" — true for one common convention, but presented as if it were the only one. In practice, two DIFFERENT conventions coexist and diverge more as the numbers get bigger. The main page has been corrected to note this.',
      ]
    },
    {
      heading: 'The reality: binary (×1,024) and decimal (×1,000) are both in active use',
      points: [
        'Operating systems and most software report storage using BINARY prefixes internally: 1 KB = 1,024 bytes, 1 MB = 1,024 KB, and so on — this is the ×1,024 convention the main page describes, technically named KiB/MiB/GiB (kibibyte/mebibyte/gibibyte) per IEC standards, though almost nobody uses those names in casual conversation.',
        'Storage VENDORS and marketing, however, almost universally use DECIMAL (SI) prefixes: 1 GB = 1,000³ bytes, matching how every other metric unit (kilometers, kilograms) scales. This is why a drive marketed as "1 TB" (10^12 bytes, decimal) shows up in an OS file browser as roughly "931 GB" (the same byte count, expressed in binary GiB).',
        'The gap between the two conventions GROWS with scale: about 2.4% at the kilobyte level, growing to roughly 7.4% by the gigabyte/terabyte level, and larger still at petabyte scale — precisely the range most system design capacity estimates operate in.',
      ]
    },
    {
      heading: 'Why a ~7% ambiguity matters for a back-of-envelope estimate that already rounds liberally',
      points: [
        'The main page\'s own guidance elsewhere is to round liberally (e.g. "57,870 → ~60k") since estimation is about order-of-magnitude reasoning — a ~7% unit-convention gap is genuinely small relative to that rounding, and rarely worth agonizing over in a live interview.',
        'Where it DOES matter is when an estimate is later compared against a REAL vendor quote or provisioned capacity number (e.g. "we estimated 355 TB, let\'s buy a 400TB array") — silently mixing the two conventions across that comparison can make a genuinely-adequate estimate look short, or a genuinely-short estimate look adequate, purely from unit confusion rather than an actual sizing error.',
        'The practical habit worth stating out loud in an interview: pick ONE convention for the whole estimate (decimal is simpler for quick mental math, since it lines up with plain powers of 10) and note the assumption, rather than silently mixing 1,000 and 1,024 across different steps of the same calculation.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Seeing the 1,000 vs 1,024 gap grow with scale',
      language: 'bash',
      code: `# Decimal (vendor/SI) vs Binary (OS/IEC) at each scale step:

# 1 KB  (decimal) = 1,000 bytes   | 1 KiB (binary) = 1,024 bytes    -> 2.4% gap
# 1 MB  (decimal) = 1,000,000     | 1 MiB (binary) = 1,048,576      -> 4.9% gap
# 1 GB  (decimal) = 1,000,000,000 | 1 GiB (binary) = 1,073,741,824  -> 7.4% gap
# 1 TB  (decimal) = 10^12         | 1 TiB (binary) = 1,024^4        -> ~10% gap

# The classic real-world symptom:
# A drive marketed as "1 TB" (decimal, 10^12 bytes)
# shows up in Windows/Linux as "~931 GB" (binary, GiB)
# -- same physical bytes, two different unit conventions.

# For a system design estimate, pick ONE and say so:
echo "Assuming decimal (1000x) throughout this estimate for simplicity."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Your back-of-envelope estimate concludes a system needs "400 TB" of storage, computed using the decimal (×1,000) convention throughout. Your team then provisions hardware described by the vendor as "400 TB," and later your monitoring dashboard (which reports usage in OS-native binary units) shows the array is "at capacity" well before you expected. What likely happened?',
    hint: 'Vendor-marketed drive capacity and OS-reported free space use different conventions — which one reports a SMALLER number for the same physical bytes?',
    solution: 'The vendor\'s "400 TB" almost certainly uses the DECIMAL convention (400 × 10^12 bytes) since that\'s standard for storage marketing, but the OS/monitoring dashboard reports usage in BINARY units (TiB, though often still labeled "TB" in the UI) — meaning the same physical array shows up as roughly 400 × 0.909 ≈ 364 TiB of USABLE capacity by the OS\'s own count. If the original estimate silently assumed the OS-reported number would also read "400," the array will appear to fill up (in the OS\'s binary units) noticeably before the naive decimal-based estimate expected — not because the estimate\'s underlying byte-count math was wrong, but because two different unit conventions were compared without accounting for the ~9-10% gap between them at that scale.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Storage units always scale by exactly 1,024x at every step — KB to MB to GB to TB.',
      reality: 'Per this subtopic\'s theory (a "convenient approximation" tightened on the main page during this batch), that\'s true for the BINARY convention (KiB/MiB/GiB) OS and software use — but storage vendors and marketing use the DECIMAL ×1,000 convention instead, and the two diverge more as scale increases.'
    },
    {
      thought: 'A drive marketed as "1 TB" and an OS reporting "931 GB" for that same drive indicates a manufacturing defect or missing capacity.',
      reality: 'Per this subtopic\'s theory, this is the expected, well-documented result of comparing decimal (vendor) and binary (OS) unit conventions for the identical physical byte count — no bytes are actually missing.'
    },
    {
      thought: 'The 1,000-vs-1,024 unit ambiguity is too small a detail to matter for an order-of-magnitude system design estimate.',
      reality: 'Per this subtopic\'s theory, it\'s genuinely small relative to the liberal rounding system design estimates already use — but worth naming explicitly when an estimate is later compared against a real vendor quote or provisioned capacity number, where silently mixing conventions can make an adequate estimate look short or vice versa.'
    }
  ];
}
