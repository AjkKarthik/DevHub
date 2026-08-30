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
  templateUrl: './external-data-source-query-and-result-are-both-string-only-maps.html',
  styleUrl: './external-data-source-query-and-result-are-both-string-only-maps.scss'
})
export class ExternalDataSourceQueryAndResultAreBothStringOnlyMapsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA describes the external data source in one general sentence',
      points: [
        'The main page\'s QnA says: the external data source block runs a script or program and reads its stdout as JSON, used for lookups Terraform does not natively support, and the script must be idempotent and return a JSON object. True, but "a JSON object" undersells a specific, strict constraint that trips up almost everyone\'s first attempt at using it.',
      ]
    },
    {
      heading: 'Both directions of the protocol are string-only — no numbers, booleans, or nesting',
      points: [
        'The <code>query</code> argument passed INTO the external program arrives on its stdin as a JSON object — and every value in that object is always a string, even if it looks numeric in the Terraform configuration.',
        'The program\'s own stdout, which becomes the data source\'s <code>result</code> attribute back in Terraform, must ALSO be a flat JSON object where every value is a string — nested objects, arrays, numbers, and booleans are all invalid in this specific protocol, even though they are perfectly normal JSON values everywhere else.',
        'This is stricter than JSON itself allows — the external data source protocol is a deliberately narrow subset, not "any valid JSON object," and a program returning <code>{"count": 3}</code> (a real number) or <code>{"tags": {"env": "prod"}}</code> (a nested object) fails, even though both are completely valid JSON.',
      ]
    },
    {
      heading: 'The workaround for anything beyond a flat string map: encode it as a JSON string',
      points: [
        'To return something structurally richer than flat strings, the standard workaround is having the external program itself <code>JSON.stringify</code> (or equivalent) the complex value into a single STRING, put that string as one value in the otherwise-flat result object, and then call Terraform\'s own <code>jsondecode()</code> function on that string back in the calling configuration to recover the original structure.',
        'This means an external data source\'s practical output shape is usually "a flat map where one or more values happen to be JSON-encoded strings that the caller immediately decodes," not a naturally nested result — worth planning for from the start rather than discovering the string-only constraint through a cryptic error partway through implementation.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The failure: returning a number and a nested object',
      language: 'bash',
      code: `data "external" "lookup" {
  program = ["python3", "lookup.py"]
  query = {
    environment = "prod"
  }
}

# lookup.py's own (broken) output:
# {
#   "instance_count": 3,              <- a real JSON number, not a string
#   "tags": {"env": "prod"}           <- a nested object
# }
#
# Terraform errors processing this:
# Error: external program returned invalid JSON: json: cannot
#   unmarshal number into Go value of type string
# The protocol requires EVERY value in the result object to be
# a string -- "a JSON object" (the main page's own phrasing)
# undersells how strict this actually is.`,
    },
    {
      label: 'The fix: flatten to strings, JSON-encode anything complex',
      language: 'bash',
      code: `# lookup.py's corrected output -- every value now a string,
# the nested object JSON-encoded into one string value:
# {
#   "instance_count": "3",
#   "tags_json": "{\\"env\\":\\"prod\\"}"
# }

data "external" "lookup" {
  program = ["python3", "lookup.py"]
  query = {
    environment = "prod"
  }
}

locals {
  # jsondecode() recovers the original structure Terraform-side
  instance_count = tonumber(data.external.lookup.result.instance_count)
  tags           = jsondecode(data.external.lookup.result.tags_json)
}

resource "aws_instance" "app" {
  count = local.instance_count
  tags  = local.tags
}`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own brief external-data-source description, a developer writes a Python script that returns `{"replica_count": 3, "config": {"region": "us-east-1"}}` as its lookup result. Running terraform plan immediately fails with a JSON unmarshal error about a number/object where a string was expected. What is the actual constraint the main page\'s own "returns a JSON object" phrasing doesn\'t make clear, and how would the script need to change its output to work?',
    hint: 'JSON itself allows numbers and nested objects freely — but the external data source protocol specifically is stricter than JSON in general. What type must every value in the result object be?',
    solution: 'The external data source protocol requires every value in the result JSON object to be a STRING — not a number, not a boolean, not a nested object — which is stricter than JSON allows in general, even though the main page\'s own phrasing ("returns a JSON object") doesn\'t convey that narrower constraint. The script needs to change its output so every value is a string, with the nested object JSON-encoded into a single string value: replica_count becomes "3" and config becomes the JSON-encoded text of the region object. Back in the Terraform configuration, `tonumber(data.external.lookup.result.replica_count)` recovers the number, and `jsondecode(data.external.lookup.result.config)` recovers the nested object structure.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'An external data source\'s program can return any valid JSON object, including numbers, booleans, and nested objects, the same as any other JSON API.',
      reality: 'Per this subtopic\'s theory, the external data source protocol is stricter than general JSON — every value in BOTH the query sent in and the result returned must be a string, with numbers, booleans, and nested objects all rejected.'
    },
    {
      thought: 'The query argument values passed into an external program preserve their original Terraform type (number, bool, etc.) when the program reads them from stdin.',
      reality: 'Per this subtopic\'s theory, every value in the query object arrives on stdin as a string, regardless of what type it appeared to be in the Terraform configuration — the program must parse/convert as needed on its own side.'
    },
    {
      thought: 'There is no way to return structured (nested) data from an external data source — it is limited to flat string key-value pairs only, with no workaround.',
      reality: 'Per this subtopic\'s theory, a workaround exists: encode the structured value as a JSON string within the flat result map, then call jsondecode() on that specific value back in the Terraform configuration to recover the original structure.'
    }
  ];
}
