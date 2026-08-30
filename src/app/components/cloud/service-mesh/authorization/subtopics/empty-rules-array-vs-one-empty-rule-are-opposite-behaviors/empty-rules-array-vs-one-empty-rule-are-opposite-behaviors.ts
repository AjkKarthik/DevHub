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
  templateUrl: './empty-rules-array-vs-one-empty-rule-are-opposite-behaviors.html',
  styleUrl: './empty-rules-array-vs-one-empty-rule-are-opposite-behaviors.scss'
})
export class EmptyRulesArrayVsOneEmptyRuleAreOppositeBehaviorsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine inaccuracy caught during this batch: the main page had ALLOW and DENY empty-rules semantics backwards',
      points: [
        'The main page\'s own "mistakes" block originally claimed that an ALLOW policy with empty rules "does not deny all traffic — it is effectively meaningless," and recommended reaching for DENY with an explicit universal-match rule instead. Verified directly against Istio\'s own AuthorizationPolicy reference, this had the two actions\' empty-rules behavior BACKWARDS. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality, straight from Istio\'s own reference docs',
      points: [
        'Empty or unset <code>rules</code> under <code>action: DENY</code>: "the match will never occur" — this has NO EFFECT. Nothing is ever denied by this policy, since there\'s no rule for a request to match against.',
        'Empty or unset <code>rules</code> under <code>action: ALLOW</code> (ALLOW is also the default when <code>action</code> is omitted entirely): per Istio\'s own docs, this "is equivalent to setting a default of deny for the target workloads." Since an ALLOW policy now exists but never matches anything, and the workload\'s default flips to deny-by-default the moment ANY ALLOW policy exists for it, the net effect is deny-ALL.',
        'This asymmetry is genuinely counterintuitive: reaching for DENY to block everything (the "obvious" choice) does nothing at all, while reaching for ALLOW with nothing in it (which sounds like it should permit, not restrict) is what actually produces deny-all.',
      ]
    },
    {
      heading: 'A THIRD, distinct state that matters just as much: one EMPTY RULE, not an empty rules ARRAY',
      points: [
        'There is a meaningful difference between <code>rules: []</code> (a rules array with ZERO entries) and <code>rules: [{}]</code> (a rules array with exactly ONE entry, and that entry is an empty rule object with no <code>from</code>/<code>to</code>/<code>when</code>).',
        'Per Istio\'s own docs: "An empty rule is always matched" — meaning <code>rules: [{}]</code> under <code>action: ALLOW</code> is a genuine ALLOW-ALL policy (opposite of the deny-all effect of a truly empty array). The single rule has no conditions, so every request satisfies it trivially.',
        'This means THREE distinct configurations exist along a spectrum that\'s easy to conflate: (1) rules entirely absent/empty array — never matches; (2) rules containing one empty rule object — always matches; (3) rules containing an actual condition — matches selectively. Getting (1) and (2) confused is a real, documented source of authorization misconfiguration.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'DENY with empty rules -- has NO EFFECT (a real trap)',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: attempted-deny-all
  namespace: production
spec:
  selector:
    matchLabels:
      app: payment
  action: DENY
  rules: []   # Intuitively "block everything" -- ACTUALLY blocks
               # NOTHING. Rules never matches under DENY, so this
               # policy has zero observable effect on traffic.
EOF`,
    },
    {
      label: 'ALLOW with empty rules -- the CORRECT deny-all idiom',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: correct-deny-all
  namespace: production
spec:
  selector:
    matchLabels:
      app: payment
  action: ALLOW   # (or omit "action" -- ALLOW is the default)
  rules: []         # Empty rules under ALLOW = nothing ever
                      # matches = deny-by-default kicks in for
                      # this workload = genuinely denies everything.
EOF`,
    },
    {
      label: 'The THIRD state -- one empty rule -- is allow-ALL, not deny-all',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: accidental-allow-all
  namespace: production
spec:
  selector:
    matchLabels:
      app: payment
  action: ALLOW
  rules:
  - {}   # ONE empty rule object (not an empty ARRAY!) --
          # "an empty rule is always matched" per Istio's
          # own docs. This ALLOWS EVERY request -- the
          # opposite of the deny-all example above, despite
          # looking almost identical at a glance.
EOF`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security engineer wants to lock down a newly-deployed "internal-tools" workload to deny all traffic by default, planning to add specific ALLOW rules for individual teams later. They write an AuthorizationPolicy with action: DENY and rules: [] , apply it, and move on — believing the workload is now fully locked down. A week later, a penetration test shows the workload is still accepting traffic from anywhere. What went wrong, and what should the policy have been instead?',
    hint: 'Per Istio\'s own reference docs, what does an empty or unset rules field actually do under action: DENY versus action: ALLOW?',
    solution: 'The engineer had the semantics backwards — an AuthorizationPolicy with action: DENY and empty rules has NO EFFECT at all, since empty rules never match anything under DENY, so nothing is ever denied. The workload was never actually locked down; it remained fully open (allow-all, since no ALLOW policy existed for it either). The correct deny-all policy uses action: ALLOW (not DENY) with empty rules — counterintuitively, this is what produces deny-all, because empty rules never match under ALLOW either, but the mere EXISTENCE of an ALLOW policy for the workload flips it to deny-by-default for anything unmatched. The fix: change action: DENY to action: ALLOW (or omit action entirely, since ALLOW is the default), keeping rules: [] — then add specific ALLOW rules per team as planned.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An AuthorizationPolicy with action: DENY and empty rules is the correct way to block all traffic to a workload — DENY should mean "deny," after all.',
      reality: 'Per this subtopic\'s theory (a genuine inaccuracy caught and corrected on the main page during this batch), empty rules under DENY match nothing, so this policy has NO EFFECT — nothing is ever denied. The correct deny-all idiom is ALLOW with empty rules.'
    },
    {
      thought: 'rules: [] (an empty array) and rules: [{}] (an array containing one empty rule object) are functionally the same thing — both represent "no conditions."',
      reality: 'Per this subtopic\'s theory, these are OPPOSITE behaviors — an empty array never matches anything (deny-all under ALLOW), while an array containing one empty rule object ALWAYS matches every request (allow-all under ALLOW), per Istio\'s own explicit documentation of "an empty rule is always matched."'
    },
    {
      thought: 'Since ALLOW policies are meant to grant access, an ALLOW policy with no rules at all should logically have no restrictive effect on traffic.',
      reality: 'Per this subtopic\'s theory, an ALLOW policy with empty rules is Istio\'s own documented idiom for deny-all — the mere existence of an ALLOW policy for a workload flips it into deny-by-default for any request that doesn\'t match, and an empty rules list means nothing ever matches.'
    }
  ];
}
