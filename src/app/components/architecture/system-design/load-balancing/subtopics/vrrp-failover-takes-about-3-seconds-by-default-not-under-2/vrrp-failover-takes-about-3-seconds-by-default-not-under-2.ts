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
  templateUrl: './vrrp-failover-takes-about-3-seconds-by-default-not-under-2.html',
  styleUrl: './vrrp-failover-takes-about-3-seconds-by-default-not-under-2.scss'
})
export class VrrpFailoverTakesAbout3SecondsByDefaultNotUnder2Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A precise-sounding number that didn\'t match the default math',
      points: [
        'The main page\'s "Single load balancer (SPOF)" fix stated that a keepalived/VRRP secondary claims the virtual IP "in < 2 seconds" after the primary fails. This is close, but the arithmetic behind VRRP\'s own default timers doesn\'t actually produce a sub-2-second figure. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: ~3 seconds by default, derived directly from VRRP\'s own timers',
      points: [
        'VRRP\'s failure-detection formula is (advertisement_interval × 3) + skew_time — the backup declares the master down after missing THREE consecutive advertisements, not one.',
        'keepalived\'s default advertisement interval (advert_int) is 1 second — so with default settings, the failure-detection window alone is 3 × 1s = 3 seconds (plus a small additional skew_time), meaningfully over the "< 2 seconds" figure the main page originally stated.',
        'This is fully tunable: lowering advert_int (e.g. to 0.1s / centi-second granularity, supported since RHEL7-era keepalived) genuinely CAN push failover under 2 seconds or even into sub-second territory — but that requires deliberately changing the default, not something you get "out of the box."',
      ]
    },
    {
      heading: 'Why the distinction between "default" and "tuned" matters here too',
      points: [
        'This is the same category of imprecision as this batch\'s other correction (ALB\'s deregistration delay) — a plausible-sounding number that\'s actually describing a TUNED value, stated as if it were the untouched default.',
        'A team relying on the main page\'s original "< 2 seconds" claim without checking their actual advert_int setting might be surprised that their real failover window is 50% longer than expected during an actual incident — worth verifying the ACTUAL configured interval rather than assuming a specific number from memory.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The VRRP failure-detection formula, with default and tuned values',
      language: 'bash',
      code: `# VRRP failure detection: (advert_int * 3) + skew_time

# DEFAULT keepalived config (advert_int = 1s):
#   Failover window ~= (1 * 3) + skew_time ~= 3 seconds
vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 150
    advert_int 1          # DEFAULT -- 1 second
    virtual_ipaddress { 10.0.0.100 }
}

# TUNED for faster failover (advert_int = 0.1s, centi-second
# granularity, supported since RHEL7-era keepalived):
vrrp_instance VI_1 {
    ...
    advert_int 0.1        # TUNED -- 100ms
    # Failover window now ~= (0.1 * 3) + skew_time ~= 0.3-0.5s
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An SRE, citing the main page\'s original (now-corrected) "< 2 seconds" VRRP failover claim, sets an alert threshold that pages on-call if failover takes longer than 2 seconds. Using default keepalived settings (advert_int=1s), would this alert fire during a completely normal, healthy failover?',
    hint: 'What is the actual expected failover window using VRRP\'s own formula with the default 1-second advertisement interval?',
    solution: 'Yes, very likely — with the default advert_int of 1 second, VRRP\'s own failure-detection formula ((advert_int × 3) + skew_time) produces an expected failover window of roughly 3 seconds, which exceeds a 2-second alert threshold. This alert would fire on essentially EVERY normal failover using default settings, not just genuinely slow or broken ones — a false-positive-prone threshold built on the main page\'s original, too-optimistic number. The SRE should either set the threshold based on the real ~3-second default, or explicitly lower advert_int (accepting the added gossip/network overhead of more frequent advertisements) if sub-2-second failover is a genuine requirement.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A keepalived/VRRP secondary claims the virtual IP within 2 seconds of the primary failing, using standard default settings.',
      reality: 'Per this subtopic\'s theory (a figure corrected on the main page during this batch), VRRP\'s own failure-detection formula with the default 1-second advertisement interval produces a ~3-second failover window — sub-2-second failover requires deliberately tuning advert_int lower.'
    },
    {
      thought: 'VRRP declares the master down after missing a single advertisement.',
      reality: 'Per this subtopic\'s theory, VRRP requires missing THREE consecutive advertisements before declaring the master down — this "×3" is baked into the protocol\'s own failure-detection formula, not an implementation detail.'
    },
    {
      thought: 'Achieving sub-second VRRP failover would require switching to a fundamentally different HA protocol.',
      reality: 'Per this subtopic\'s theory, modern keepalived supports centi-second advertisement intervals (e.g. advert_int 0.1) within the SAME VRRP protocol, genuinely achieving sub-second failover through configuration tuning alone.'
    }
  ];
}
