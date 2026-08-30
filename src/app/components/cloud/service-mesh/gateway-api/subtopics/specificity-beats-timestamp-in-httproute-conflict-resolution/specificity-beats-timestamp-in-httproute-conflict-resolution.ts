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
  templateUrl: './specificity-beats-timestamp-in-httproute-conflict-resolution.html',
  styleUrl: './specificity-beats-timestamp-in-httproute-conflict-resolution.scss'
})
export class SpecificityBeatsTimestampInHttpRouteConflictResolutionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine, repeated inaccuracy caught during this batch — wrong in three separate sections',
      points: [
        'The main page\'s theory, mistakes block, and quiz all originally described HTTPRoute conflict resolution as "creation timestamp — older routes win," treated as the PRIMARY rule. The mistakes block\'s own example went further and showed a MORE SPECIFIC route (<code>/api/v2</code>) LOSING to a LESS SPECIFIC one (<code>/api</code>) purely because the less-specific route was created first. Verified against the Gateway API specification\'s own documented precedence, this ordering was backwards. The main page has been corrected in all three places.',
      ]
    },
    {
      heading: 'The reality: specificity is checked FIRST, across several dimensions — timestamp is only the final tiebreaker',
      points: [
        'The Gateway API spec\'s own documented precedence order for resolving overlapping HTTPRoute matches: (1) method match takes precedence over rules without one, (2) the rule with the LARGEST NUMBER OF HEADER MATCHES wins, (3) the rule with the LARGEST NUMBER OF QUERY PARAM MATCHES wins, (4) path-match specificity (exact match beats prefix match; a longer prefix beats a shorter one).',
        'Creation timestamp (oldest wins) is used ONLY when two candidate rules are tied on EVERY ONE of those specificity dimensions — it is a tiebreaker of last resort, not the primary mechanism. If ties still remain even after timestamp, the final tiebreaker is alphabetical order by `{namespace}/{name}`.',
      ]
    },
    {
      heading: 'Why the corrected mental model changes how you should actually design routes',
      points: [
        'Under the (incorrect) "timestamp is primary" model, a team might believe route ORDER OF CREATION is the main lever for controlling precedence — leading to fragile practices like deliberately controlling deploy order to "win" a routing conflict.',
        'Under the CORRECT model, specificity is the real lever: a genuinely more specific route (more header matches, a longer path prefix, an exact match) reliably wins regardless of when it was created — making routing behavior predictable from the RULES THEMSELVES, not from deploy timing. The main page\'s own advice to consolidate overlapping matches into one HTTPRoute with explicitly ordered rules is still the best practice — but the REASON it\'s good practice is to avoid relying on any of these implicit tie-breaking rules at all, not specifically to avoid a timestamp race.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Specificity wins regardless of creation order (the corrected behavior)',
      language: 'bash',
      code: `# Route A: PathPrefix /api           -- created FIRST (09:00)
# Route B: PathPrefix /api/v2/reports -- created SECOND (10:00)
#
# Under the corrected model: Route B wins for requests to
# /api/v2/reports/anything, because its path match is MORE
# SPECIFIC (longer prefix) -- even though it was created
# LATER. Creation order never even gets consulted here,
# because specificity alone already resolved the conflict.

cat <<EOF | kubectl apply -f -
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api-general
  namespace: production
spec:
  parentRefs:
  - name: main-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api
    backendRefs:
    - name: api-service-v1
      port: 8080
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api-reports-v2
  namespace: production
spec:
  parentRefs:
  - name: main-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /api/v2/reports
    backendRefs:
    - name: reports-service-v2
      port: 8080
EOF`,
    },
    {
      label: 'When timestamp actually matters: TRUE ties',
      language: 'bash',
      code: `# Two routes with the EXACT SAME path specificity, method
# match, header count, and query param count -- a genuine
# tie on every specificity dimension. ONLY here does creation
# timestamp actually decide the winner:

# Route X: PathPrefix /checkout (created 09:00)
# Route Y: PathPrefix /checkout (created 10:00, different
#          HTTPRoute resource, identical match otherwise)
# -> Route X wins, because it's the ONLY differentiator left
#    once specificity is fully tied.

# This is the ONLY scenario where the main page's ORIGINAL
# "oldest wins" claim was actually correct -- it was just
# incorrectly presented as the PRIMARY rule instead of the
# last-resort tiebreaker it actually is.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team deliberately creates a broad PathPrefix /api HTTPRoute FIRST, then later needs to add a more specific override for /api/admin. Worried that Gateway API\'s conflict resolution favors older routes, they consider deleting and recreating the /api route AFTER the /api/admin route, just to "win" on timestamp. Is this necessary?',
    hint: 'Does path-match specificity get checked before creation timestamp, or does timestamp override specificity?',
    solution: 'This is unnecessary — specificity is checked BEFORE creation timestamp in Gateway API\'s conflict resolution, so the more specific /api/admin route will correctly take precedence over the broader /api route for matching requests, completely independent of which one was created first or in what order. Recreating the /api route to manipulate timestamp would have no effect on this outcome, since specificity alone already resolves the conflict before timestamp is ever consulted. The team can safely add the /api/admin route at any time without worrying about creation order.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When two HTTPRoutes have overlapping matches, Gateway API resolves the conflict primarily by creation timestamp — the older route wins, regardless of how specific each match is.',
      reality: 'Per this subtopic\'s theory (a genuine inaccuracy caught and corrected on the main page during this batch, repeated across the theory, mistakes block, and quiz), match SPECIFICITY (method, header count, query param count, path specificity) is checked first — timestamp is only the tiebreaker between equally-specific rules.'
    },
    {
      thought: 'A less specific route (e.g. PathPrefix /api) can "win" over a more specific route (e.g. PathPrefix /api/v2) for requests matching both, simply by being created earlier.',
      reality: 'Per this subtopic\'s theory, this cannot happen — the more specific match always wins regardless of creation order; timestamp is never even consulted unless the two rules are tied on every specificity dimension first.'
    },
    {
      thought: 'To control which of two overlapping HTTPRoutes takes precedence, the reliable lever is controlling their creation/deployment order.',
      reality: 'Per this subtopic\'s theory, the reliable lever is match specificity (path length, header/query param match count), not deployment order — designing routes with genuinely different specificity levels produces predictable, timing-independent precedence.'
    }
  ];
}
