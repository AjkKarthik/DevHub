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
  templateUrl: './peered-service-dns-names-include-the-peers-own-name-as-a-segment.html',
  styleUrl: './peered-service-dns-names-include-the-peers-own-name-as-a-segment.scss'
})
export class PeeredServiceDnsNamesIncludeThePeersOwnNameAsASegmentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A DNS format claim worth checking before hardcoding a lookup pattern',
      points: [
        'The main page originally described exported cluster-peering services as appearing "in the peer\'s service catalog as <code>&lt;svc&gt;.svc.peer.consul</code> DNS names" — a fixed-looking literal template with no place for the PEER\'S OWN NAME at all. Checking this against Consul\'s own DNS reference documentation, the real format is structurally different. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: the peer\'s own name is a required, distinct segment in the DNS query',
      points: [
        'Per Consul\'s own DNS reference, the query format for a peered service is <code>&lt;service&gt;.service.&lt;peer-name&gt;.peer.&lt;domain&gt;</code> — for example, looking up a <code>redis</code> service exported from a peer named <code>phx1</code> resolves via <code>redis.service.phx1.peer.consul</code>.',
        'The critical structural difference from the main page\'s original claim: the literal word "peer" is a fixed marker segment, but the PEER\'S OWN NAME (like <code>phx1</code>) is a required, variable segment that appears BEFORE it — omitted entirely from the page\'s original <code>&lt;svc&gt;.svc.peer.consul</code> template, which had no place for a peer name at all.',
        'Consul also supports the RFC 2782-style SRV form for the same peered lookup: <code>_&lt;service&gt;._&lt;tag&gt;.service.&lt;peer-name&gt;.peer.&lt;domain&gt;</code> — useful when you need the advertised port back in the DNS response, not just an address.',
      ]
    },
    {
      heading: 'Why a missing peer-name segment breaks a real lookup, not just a documentation nitpick',
      points: [
        'A DNS query built from the main page\'s original template (something like <code>redis.svc.peer.consul</code>, with no peer name at all) has no way to tell Consul WHICH peer\'s exported <code>redis</code> service you mean — in any multi-peer setup (more than one cluster peered to yours), this query is fundamentally ambiguous or simply won\'t resolve, since Consul\'s actual resolver expects the peer name in that position.',
        'This matters most exactly when cluster peering is most useful: connecting to MULTIPLE independent clusters, where disambiguating "which peer\'s redis" by name is the whole point of the query structure — a template missing that segment fails precisely in the scenario cluster peering exists to serve.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The real DNS query shape for a peered service',
      language: 'bash',
      code: `# WRONG (main page's original claim -- no place for the peer name):
#   redis.svc.peer.consul

# CORRECT, per Consul's own DNS reference:
#   <service>.service.<peer-name>.peer.<domain>
dig redis.service.phx1.peer.consul

# SRV form (returns the advertised port too):
#   _<service>._<tag>.service.<peer-name>.peer.<domain>
dig SRV _redis._tcp.service.phx1.peer.consul

# Confirm which peers are actually connected and what
# they've exported to you, before building any DNS query:
consul peering list
consul peering exported-services phx1`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Your cluster has TWO active peering connections — one to a cluster named <code>phx1</code>, another named <code>dfw2</code> — and both peers export a service called <code>redis</code>. Using the main page\'s original (now-corrected) DNS template <code>&lt;svc&gt;.svc.peer.consul</code>, write the query for <code>redis.svc.peer.consul</code>. Which peer\'s <code>redis</code> does this resolve to?',
    hint: 'Does the original template have anywhere to put a peer NAME at all — and if your cluster has two peers both exporting <code>redis</code>, how would Consul disambiguate which one you mean?',
    solution: 'The original template can\'t disambiguate at all — it has no segment for a peer name, so a query like `redis.svc.peer.consul` doesn\'t correspond to Consul\'s actual DNS resolver behavior in the first place; it isn\'t simply "ambiguous," it\'s not the real query shape. The correct queries, using the real `<service>.service.<peer-name>.peer.<domain>` format, are `redis.service.phx1.peer.consul` and `redis.service.dfw2.peer.consul` — two clearly distinct queries, each naming the specific peer whose exported `redis` you want. This exact two-peers-same-service-name scenario is precisely why the peer name is a required part of the real query format, not an optional nicety.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A peered Consul service is reachable via a generic, fixed DNS template like <code>&lt;svc&gt;.svc.peer.consul</code>, with no need to reference the specific peer by name.',
      reality: 'Per this subtopic\'s theory (a DNS format claim corrected on the main page during this batch), the real query format requires the peer\'s own name as a distinct, mandatory segment: <code>&lt;service&gt;.service.&lt;peer-name&gt;.peer.&lt;domain&gt;</code>.'
    },
    {
      thought: 'If two different peers both export a service with the same name, referencing that service by a generic DNS pattern would be ambiguous but still technically resolve to one of them.',
      reality: 'Per this subtopic\'s theory, Consul\'s actual DNS format sidesteps this problem entirely by requiring the peer name in the query — there\'s no ambiguity to resolve because the peer name disambiguates by construction.'
    },
    {
      thought: 'DNS naming details for a specific feature like cluster peering are a minor implementation detail, not worth verifying precisely.',
      reality: 'Per this subtopic\'s theory, an imprecise DNS template isn\'t just cosmetically wrong — it fails outright the moment more than one peer is involved, exactly the scenario cluster peering is meant to support.'
    }
  ];
}
