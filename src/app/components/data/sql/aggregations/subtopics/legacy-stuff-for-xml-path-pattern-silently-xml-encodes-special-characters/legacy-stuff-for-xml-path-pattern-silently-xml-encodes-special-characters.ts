import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-legacy-for-xml-path-encoding-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './legacy-stuff-for-xml-path-pattern-silently-xml-encodes-special-characters.html',
  styleUrl: './legacy-stuff-for-xml-path-pattern-silently-xml-encodes-special-characters.scss',
})
export class LegacyStuffForXmlPathPatternSilentlyXmlEncodesSpecialCharactersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'FOR XML PATH Genuinely Builds XML — and XML Escapes Reserved Characters',
      points: [
        'The main page\'s own "MSSQL pre-2017 equivalent" pattern builds the concatenated string by serializing rows as XML (FOR XML PATH(\'\')) and then extracting the result as plain text via .value(\'.\', \'NVARCHAR(MAX)\'). Because the intermediate representation genuinely IS XML — not just text that happens to use XML syntax internally — SQL Server automatically XML-encodes reserved characters in the source data before concatenation: & becomes &amp;, < becomes &lt;, > becomes &gt;.',
        'The .value() extraction that follows does NOT reverse this encoding — it returns the escaped text exactly as it appears in the XML, with the entity sequences intact. This is a silent data corruption: the query runs without error and returns a string that looks almost right, just with a few characters replaced by their XML entity codes.',
      ],
    },
    {
      heading: 'The Modern STRING_AGG in the Same Code Tab Has No Such Issue',
      points: [
        'STRING_AGG(col, separator) — shown directly above the legacy pattern in the main page\'s own "STRING_AGG & percentiles" code tab — performs plain string concatenation with no XML serialization step at all, so it has no equivalent encoding problem. A product named "Rock & Roll Speaker" comes out of STRING_AGG unchanged, but comes out of the legacy FOR XML PATH pattern as "Rock &amp; Roll Speaker".',
        'The fix for code still on the legacy pattern (pre-2017 MSSQL, or a codebase that has not yet migrated): wrap the FOR XML PATH subquery\'s result in a REPLACE chain reversing the common entities (&amp; → &, &lt; → <, &gt; → >), applied in that specific order to avoid double-unescaping. The more durable fix, given STRING_AGG has been available since MSSQL 2017, is simply to migrate off the legacy pattern entirely for any text data that could plausibly contain &, <, or >.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the silent corruption',
      language: 'sql',
      code: `-- A product name containing a reserved XML character:
INSERT INTO products (product_id, category_id, product_name)
VALUES (1, 1, 'Rock & Roll Speaker');

-- The main page's own legacy pattern:
SELECT
    c.category_name,
    STUFF(
        (SELECT ', ' + p2.product_name
         FROM   products p2
         WHERE  p2.category_id = c.category_id
         ORDER BY p2.product_name
         FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'),
        1, 2, '') AS products
FROM categories c
WHERE c.category_id = 1
GROUP BY c.category_id, c.category_name;
-- Result: "Rock &amp; Roll Speaker" -- the ampersand was silently
-- XML-encoded during FOR XML PATH serialization and never decoded back.`,
    },
    {
      label: 'STRING_AGG in the same tab has no such issue',
      language: 'sql',
      code: `-- The modern equivalent, shown directly above the legacy pattern in
-- the main page's own "STRING_AGG & percentiles" code tab:
SELECT
    c.category_name,
    STRING_AGG(p.product_name, ', ') WITHIN GROUP (ORDER BY p.product_name) AS products
FROM   categories c
JOIN   products   p ON p.category_id = c.category_id
WHERE  c.category_id = 1
GROUP BY c.category_id, c.category_name;
-- Result: "Rock & Roll Speaker" -- unchanged, because STRING_AGG never
-- routes the data through an XML serialization step at all.`,
    },
    {
      label: 'The fix for code still on the legacy pattern',
      language: 'sql',
      code: `-- Reverse the common XML entities, in this specific order to avoid
-- double-unescaping (&amp; must be handled before a bare & appears):
SELECT
    c.category_name,
    REPLACE(REPLACE(REPLACE(
        STUFF(
            (SELECT ', ' + p2.product_name
             FROM   products p2
             WHERE  p2.category_id = c.category_id
             ORDER BY p2.product_name
             FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'),
            1, 2, ''),
        '&gt;', '>'), '&lt;', '<'), '&amp;', '&') AS products
FROM categories c
WHERE c.category_id = 1
GROUP BY c.category_id, c.category_name;
-- Result: "Rock & Roll Speaker" -- correct, but verbose.
-- Given STRING_AGG has been available since MSSQL 2017, migrating off
-- this legacy pattern entirely is the more durable fix.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A legacy MSSQL report uses the STUFF/FOR XML PATH pattern from the main page to build a comma-separated list of customer names for a mailing label export. A customer named "Smith & Sons Ltd" appears in the exported list as "Smith &amp; Sons Ltd" instead. What\'s the root cause, and what are the two possible fixes?',
    hint: 'Think about what FOR XML PATH is actually doing to the string data before STUFF and .value() ever see it, and what that implies about which characters get altered.',
    solution: `The root cause is that FOR XML PATH('') genuinely serializes the
subquery's rows as XML before concatenating them -- and XML requires
reserved characters like & to be escaped as entities (&amp;) to remain
valid XML. The subsequent .value('.', 'NVARCHAR(MAX)') call extracts
the XML content as text, but does NOT decode those entities back to
their original characters, so the & in "Smith & Sons Ltd" comes out
as the literal text "&amp;" in the final string.

Two fixes: (1) wrap the existing STUFF/FOR XML PATH expression in a
REPLACE chain that reverses the entities in the correct order (&gt;,
then &lt;, then &amp; last, since decoding &amp; first would corrupt
a literal "amp;" that happened to follow a real ampersand) -- a quick
patch for legacy code that cannot yet be rewritten; (2) migrate the
whole query to STRING_AGG(col, ', ') WITHIN GROUP (ORDER BY col),
available since MSSQL 2017, which never routes the data through XML
serialization and therefore has no encoding issue to reverse at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the STUFF/FOR XML PATH pattern shown in the main page\'s own "STRING_AGG & percentiles" code tab is a purely syntactic trick for string concatenation with no side effects on the data itself.',
      reality: 'FOR XML PATH genuinely serializes the intermediate result as XML, which means SQL Server automatically XML-encodes reserved characters (&, <, >) in the source strings — a real, silent transformation of the data, not just a syntax quirk.',
    },
    {
      thought: '.value(\'.\', \'NVARCHAR(MAX)\') fully converts the XML fragment back into plain text, undoing any XML-specific formatting along the way.',
      reality: '.value() extracts the XML content as a string, but does not decode XML entity references — &amp;, &lt;, and &gt; remain in the extracted text exactly as they appeared in the XML, uncorrected.',
    },
    {
      thought: 'this is only a theoretical concern — real product, customer, or company names rarely contain characters like &, <, or >.',
      reality: 'ampersands in particular are common in real business names ("Smith & Sons", "Procter & Gamble"-style names, "AT&T") — this is a realistic, not exotic, data-corruption risk for any text field built from real-world names.',
    },
  ];
}
