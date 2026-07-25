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
  templateUrl: './mixing-newbits-in-cidrsubnet-can-overlap-cidrsubnets-avoids-it.html',
  styleUrl: './mixing-newbits-in-cidrsubnet-can-overlap-cidrsubnets-avoids-it.scss'
})
export class MixingNewbitsInCidrsubnetCanOverlapCidrsubnetsAvoidsItSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own cidrsubnet() examples only ever use ONE consistent newbits value',
      points: [
        'Every <code>cidrsubnet()</code> call across the main page\'s theory, codeTabs, and challenge uses the SAME <code>newbits</code> argument (8) throughout a given configuration — carving a consistent set of /24s from a /16. The page never shows what happens when different calls against the same parent CIDR use DIFFERENT <code>newbits</code> values, which is exactly where subnets can silently overlap.',
      ]
    },
    {
      heading: 'cidrsubnet() picks a specific subnet by number — it has no awareness of subnets from OTHER calls',
      points: [
        'Each <code>cidrsubnet(parent, newbits, netnum)</code> call is independent — it computes ONE specific subnet based purely on its own three arguments, with no built-in memory of what any other <code>cidrsubnet()</code> call against the same parent CIDR has already carved out.',
        'When every call in a configuration uses the SAME <code>newbits</code>, the <code>netnum</code> index values naturally correspond to a clean, non-overlapping sequence of equal-sized subnets — which is exactly why the main page\'s own consistent-newbits examples never run into a problem.',
        'The moment DIFFERENT <code>newbits</code> values are mixed for the same parent CIDR (say, some subnets sized as /20 and others as /24), the <code>netnum</code> indices no longer correspond to the same "slot size" across calls — a low <code>netnum</code> under a small <code>newbits</code> value (a large subnet) can numerically overlap the address range a separate call already claimed under a different <code>newbits</code>/<code>netnum</code> combination, and Terraform does not detect or warn about this at all.',
      ]
    },
    {
      heading: 'The safer tool for exactly this case: cidrsubnets() (plural), which allocates automatically',
      points: [
        '<code>cidrsubnets(parent, newbits_1, newbits_2, ...)</code> takes MULTIPLE newbits values in one call and returns a list of subnet prefixes that are GUARANTEED not to overlap each other, computed together as a set rather than as independent, uncoordinated calls — this is the tool specifically designed for the mixed-size-subnet case the main page\'s own single-newbits examples never needed.',
        'When every subnet in a configuration genuinely is the same size, <code>cidrsubnet()</code> with sequential <code>netnum</code> indices (matching the main page\'s own pattern) remains perfectly correct and simpler to read — the overlap risk specifically appears once different subnet sizes need to be carved from the same parent CIDR.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The overlap risk: independent calls, different newbits',
      language: 'bash',
      code: `# Attempting to carve a large /20 subnet AND several /24
# subnets from the same 10.0.0.0/16 parent, using separate
# cidrsubnet() calls with DIFFERENT newbits per call:
locals {
  # /20 subnet (newbits = 4): index 0 -> 10.0.0.0/20
  #   (covers the full range 10.0.0.0 - 10.0.15.255)
  large_subnet = cidrsubnet("10.0.0.0/16", 4, 0)

  # /24 subnets (newbits = 8): index 2 -> 10.0.2.0/24
  #   (10.0.2.0 - 10.0.2.255)
  small_subnet = cidrsubnet("10.0.0.0/16", 8, 2)
}
# 10.0.2.0/24 falls COMPLETELY INSIDE the range already
# claimed by 10.0.0.0/20 -- a genuine, silent overlap.
# cidrsubnet() has no way to know about the OTHER call and
# gives no warning at all -- each call only knows its own
# three arguments.`,
    },
    {
      label: 'The fix: cidrsubnets() (plural) allocates them together, guaranteed non-overlapping',
      language: 'bash',
      code: `locals {
  # ONE call, multiple newbits values -- Terraform computes
  # all the resulting prefixes TOGETHER, as a coordinated set,
  # guaranteeing none of them overlap each other:
  subnets = cidrsubnets("10.0.0.0/16", 4, 8, 8, 8)
  # subnets[0] -- the /20 (newbits=4): 10.0.0.0/20
  # subnets[1] -- a /24 (newbits=8):   10.0.16.0/24
  # subnets[2] -- a /24 (newbits=8):   10.0.17.0/24
  # subnets[3] -- a /24 (newbits=8):   10.0.18.0/24
  # Every prefix is automatically placed AFTER the previous
  # one's range -- no manual netnum bookkeeping, no overlap.
}

resource "aws_subnet" "large" {
  cidr_block = local.subnets[0]
}
resource "aws_subnet" "small" {
  count      = 3
  cidr_block = local.subnets[count.index + 1]
}

# When every subnet genuinely IS the same size, the main
# page's own consistent-newbits cidrsubnet() pattern remains
# correct and simpler -- the overlap risk is specific to
# MIXING different sizes from the same parent.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A configuration needs one large /20 subnet and several smaller /24 subnets, all carved from the same 10.0.0.0/16 VPC CIDR. A developer writes `cidrsubnet("10.0.0.0/16", 4, 0)` for the large subnet and separately `cidrsubnet("10.0.0.0/16", 8, 2)`, `cidrsubnet("10.0.0.0/16", 8, 3)` for two of the smaller ones, following the main page\'s own cidrsubnet() pattern for each size individually. What silently goes wrong here, and what single function call would replace all three, guaranteeing no overlap?',
    hint: 'Each cidrsubnet() call only knows its own three arguments — it has no awareness of what any OTHER cidrsubnet() call against the same parent has already claimed. What happens when the newbits (and therefore the resulting subnet size) differs between calls?',
    solution: 'The /20 subnet from `cidrsubnet("10.0.0.0/16", 4, 0)` covers the entire range 10.0.0.0–10.0.15.255, while `cidrsubnet("10.0.0.0/16", 8, 2)` (10.0.2.0/24) and `cidrsubnet("10.0.0.0/16", 8, 3)` (10.0.3.0/24) both fall completely inside that already-claimed /20 range — a genuine, silent overlap, since each independent cidrsubnet() call has no awareness of what any other call has claimed. The fix is a single `cidrsubnets("10.0.0.0/16", 4, 8, 8)` call (plural, with all three newbits values passed together) — Terraform computes all three resulting prefixes as one coordinated set, guaranteeing none of them overlap, with no manual netnum bookkeeping needed.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'cidrsubnet() is aware of every other cidrsubnet() call made against the same parent CIDR in a configuration, and automatically avoids producing an overlapping subnet.',
      reality: 'Per this subtopic\'s theory, each cidrsubnet() call is completely independent — it computes one subnet from its own three arguments with no memory of any other call, so mixing different newbits values across calls can silently produce overlapping ranges with no warning.'
    },
    {
      thought: 'Overlapping subnets from cidrsubnet() calls can only happen from an obvious mistake, like passing the exact same newbits and netnum twice.',
      reality: 'Per this subtopic\'s theory, the more common and much less obvious trigger is MIXING different newbits values (different subnet sizes) for the same parent CIDR — a low netnum under a small newbits value can numerically overlap a range already claimed under a different newbits/netnum combination.'
    },
    {
      thought: 'cidrsubnets() (plural) is just a shorthand convenience for calling cidrsubnet() (singular) multiple times with less typing — functionally equivalent either way.',
      reality: 'Per this subtopic\'s theory, cidrsubnets() is functionally different, not just shorter: it computes all the requested prefixes TOGETHER as a coordinated set with a guarantee of no overlap, which independent cidrsubnet() calls with mixed newbits values cannot provide on their own.'
    }
  ];
}
