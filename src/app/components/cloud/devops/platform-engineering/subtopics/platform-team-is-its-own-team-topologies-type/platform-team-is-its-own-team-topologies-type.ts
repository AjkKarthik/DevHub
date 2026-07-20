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
  templateUrl: './platform-team-is-its-own-team-topologies-type.html',
  styleUrl: './platform-team-is-its-own-team-topologies-type.scss'
})
export class PlatformTeamIsItsOwnTeamTopologiesTypeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Quick Reference calls Platform Team a "stream-aligned enabler" — Team Topologies treats these as three separate things',
      points: [
        'The main page\'s own Quick Reference defines Platform Team as: "Team Topologies stream-aligned enabler — builds the platform as a product that other teams self-serve." Read literally, this phrase splices together the names of TWO other Team Topologies team types — "stream-aligned" and "enabler" (short for Enabling team) — as if Platform Team were a variant or combination of them.',
        'Team Topologies\' own official definitions describe four SEPARATE, DISTINCT fundamental team types, not a hierarchy where one is a subtype of another: "Stream-aligned team: aligned to a flow of work from (usually) a segment of the business domain." "Enabling team: helps a Stream-aligned team to overcome obstacles. Also detects missing capabilities." "Platform team: a grouping of other team types that provide a compelling internal product to accelerate delivery by Stream-aligned teams."',
        'The source material itself is explicit that these four types are meant to be treated as genuinely separate categories, not blended: it describes "Four fundamental topologies" and specifically warns that "Adding more types or creating hybrids just confuses everyone." Calling Platform Team a "stream-aligned enabler" is exactly the kind of hybrid-naming the framework\'s own authors caution against.',
      ]
    },
    {
      heading: 'Why the distinction matters beyond terminology precision',
      points: [
        'Enabling teams and Platform teams solve genuinely different problems, and conflating their names obscures that difference: an Enabling team is temporary-by-design and works DIRECTLY WITH a stream-aligned team to close a specific capability gap (e.g. helping a team adopt a new testing framework, then moving on) — it is a coaching/consulting relationship. A Platform team, per its own definition, provides a standing, self-service "compelling internal product" that stream-aligned teams consume independently, with no ongoing embedded relationship required.',
        'The main page\'s own theory elsewhere gets this distinction functionally right without naming it precisely — its "Interaction mode: X-as-a-Service" description for Platform Team matches Team Topologies\' own X-as-a-Service interaction mode specifically, which the framework reserves for Platform-team-to-stream-aligned-team relationships. Enabling teams instead typically use "Collaboration mode" (working closely, side-by-side) — a genuinely different interaction pattern the main page never contrasts against.',
        'Practically: an organization designing its team structure around the main page\'s own "stream-aligned enabler" phrasing risks building one blended team meant to do both jobs — ongoing self-service infrastructure (Platform team\'s actual job) AND temporary embedded coaching (Enabling team\'s actual job) — when Team Topologies\' own model treats these as needing different team shapes, different lifespans (standing vs. temporary), and different interaction modes entirely.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own team-type language -- a blended description',
      language: 'bash',
      code: `# Matches the main page's own Quick Reference entry verbatim:

Platform Team:
  "Team Topologies stream-aligned enabler — builds the platform
   as a product that other teams self-serve"

# This single phrase borrows language from what are, per Team
# Topologies' own definitions, THREE separate concepts:
#
#   "stream-aligned"  -> the name of a DIFFERENT team type entirely
#                         (Stream-aligned team)
#   "enabler"          -> short for a DIFFERENT team type entirely
#                         (Enabling team)
#   "builds the platform as a product that other teams self-serve"
#                       -> this part IS an accurate description of
#                          Platform team's actual job`,
    },
    {
      label: 'Team Topologies\' own four separate definitions',
      language: 'bash',
      code: `# Per Team Topologies' own official key-concepts page --
# four DISTINCT fundamental team types, no hybrids:

Stream-aligned team:
  "aligned to a flow of work from (usually) a segment of the
   business domain"
  -- e.g. the "payments" team, the "checkout" team

Enabling team:
  "helps a Stream-aligned team to overcome obstacles. Also
   detects missing capabilities."
  -- TEMPORARY, works DIRECTLY alongside a stream-aligned team,
     e.g. coaching a team through adopting a new test framework,
     then moving on once the gap is closed

Complicated-subsystem team:
  "where significant mathematics/calculation/technical expertise
   is needed"
  -- e.g. a team owning a video-encoding codec or a pricing engine

Platform team:
  "a grouping of other team types that provide a compelling
   internal product to accelerate delivery by Stream-aligned teams"
  -- STANDING, self-service, consumed via APIs/portals/CLI tools,
     no ongoing embedded relationship required

# Per the source material's own explicit warning:
# "Adding more types or creating hybrids just confuses everyone."
# Platform team is NOT a subtype or blend of Stream-aligned + Enabling
# -- it is its own, fourth, separate category.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An organization reads the main page\'s own "stream-aligned enabler" description of Platform Team and builds one combined team: it maintains the company\'s self-service infrastructure tooling FULL-TIME, and its members also rotate through 3-month embedded stints coaching individual product teams through specific technology adoptions. Six months in, the team is struggling — the platform\'s reliability is slipping because members keep getting pulled onto embedded coaching engagements, and the coaching engagements feel rushed because members are also on call for platform incidents. Using this subtopic\'s theory, explain which two distinct Team Topologies team types got blended here, and why splitting them apart would resolve the specific symptoms described.',
    hint: 'Per this subtopic\'s theory, is a standing, self-service platform (with real reliability/on-call obligations) the same kind of team commitment as a temporary, embedded coaching engagement? Do Team Topologies\' own definitions for Platform team and Enabling team describe the same lifespan and interaction mode, or different ones?',
    solution: 'This organization blended Platform team and Enabling team — exactly the two concepts the main page\'s own "stream-aligned enabler" phrasing (borrowing "enabler" language into a Platform Team description) conflates. Per this subtopic\'s theory, these are genuinely different jobs: Platform team provides "a compelling internal product" on a STANDING basis — self-service tooling with real reliability and on-call obligations, consumed independently by other teams (X-as-a-Service interaction mode) — while Enabling team "helps a Stream-aligned team to overcome obstacles" through a TEMPORARY, embedded engagement (Collaboration interaction mode) that ends once the specific capability gap closes. The organization\'s two symptoms map directly onto this blend: platform reliability slips because members with platform on-call responsibilities are simultaneously committed to embedded coaching engagements elsewhere, and coaching engagements feel rushed because the same members are pulled back for platform incidents — each role\'s own natural rhythm (standing/always-on for platform, temporary/focused for enabling) is being disrupted by the other. Splitting them into two separate teams — a genuine Platform team with stable on-call ownership, and a genuine Enabling team whose members are NOT simultaneously carrying platform reliability obligations — would let each team operate in its own appropriate interaction mode and time horizon, exactly as Team Topologies\' own four-distinct-types model (with its explicit warning against hybrids) is designed to prevent.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Platform Team is a variant or combination of Stream-aligned team and Enabling team in Team Topologies — a "stream-aligned enabler," as the main page\'s own Quick Reference describes it.',
      reality: 'This subtopic\'s theory shows Team Topologies defines four SEPARATE fundamental team types with no hybrids intended: Stream-aligned, Enabling, Complicated-subsystem, and Platform. The source material explicitly warns "adding more types or creating hybrids just confuses everyone" — Platform team is its own distinct category, not a blend of the other two.'
    },
    {
      thought: 'Since both Enabling teams and Platform teams exist to help stream-aligned teams move faster, the specific distinction between them is mostly semantic and doesn\'t affect how an organization should actually structure either team.',
      reality: 'This subtopic\'s exercise shows the distinction has real structural consequences: Enabling teams work in temporary, embedded Collaboration mode with a defined end point, while Platform teams provide a standing, self-service product consumed via X-as-a-Service mode with ongoing reliability obligations — blending the two into one team creates real scheduling and priority conflicts between coaching engagements and platform on-call duty.'
    },
    {
      thought: 'The main page\'s own "X-as-a-Service" interaction-mode description for Platform teams is a minor detail — any of Team Topologies\' interaction modes would work reasonably well for a Platform team.',
      reality: 'This subtopic\'s theory shows X-as-a-Service is specifically the interaction mode Team Topologies reserves for Platform-team-to-stream-aligned-team relationships, distinct from the Collaboration mode Enabling teams typically use — the main page\'s own theory gets this detail functionally right elsewhere on the page, even though its Quick Reference entry\'s naming does not reflect it.'
    }
  ];
}
