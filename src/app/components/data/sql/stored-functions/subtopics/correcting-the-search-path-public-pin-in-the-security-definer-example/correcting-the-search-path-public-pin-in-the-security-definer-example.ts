import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-correcting-search-path-public-pin-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './correcting-the-search-path-public-pin-in-the-security-definer-example.html',
  styleUrl: './correcting-the-search-path-public-pin-in-the-security-definer-example.scss',
})
export class CorrectingTheSearchPathPublicPinInTheSecurityDefinerExampleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Security Comment That Doesn\'t Match Postgres\'s Own Advice',
      points: [
        'The main page\'s "SECURITY DEFINER pattern" code tab includes SET search_path = public with the comment "pin search_path to prevent hijacking." This is presented as the fix for the well-known SECURITY DEFINER search_path hijacking vulnerability — but PostgreSQL\'s own official documentation for CREATE FUNCTION explicitly recommends AGAINST pinning to public for exactly this purpose.',
        'PostgreSQL\'s documented guidance: "The safest choice is to set search_path to a fixed value that includes no schemas that are writable to any users other than needed for the function\'s operation... In many common environments, especially where the public schema is writable by all users, this is best achieved by setting search_path to the empty string." Pinning to public does not close the hijacking vector when public itself is writable — which is the default configuration on PostgreSQL versions before 15, and remains common in practice even on 15+.',
      ],
    },
    {
      heading: 'How the Hijack Actually Works',
      points: [
        'A SECURITY DEFINER function runs with the OWNER\'s privileges, but name resolution for unqualified object references (tables, functions, operators) still follows search_path at the TIME OF EXECUTION. If a low-privilege attacker can CREATE an object in a schema that appears in the function\'s search_path — like public, when it\'s writable — they can create a malicious same-named object that the SECURITY DEFINER function unintentionally resolves to and executes, inheriting the DEFINER\'s elevated privileges.',
        'Pinning search_path to public does nothing to prevent this if public is writable: the attacker\'s malicious object would live in exactly the schema the function is pinned to search. The genuinely safe pattern is search_path = \'\' (empty), forcing every unqualified reference inside the function to fail unless it\'s schema-qualified explicitly — eliminating the attack surface entirely rather than just pinning it to a schema that might still be attacker-writable.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own pattern — and why it doesn\'t fully close the gap',
      language: 'sql',
      code: `-- The main page's own SECURITY DEFINER code tab, exactly as published:
CREATE OR REPLACE FUNCTION get_user_audit(p_user_id INT)
RETURNS TABLE(action TEXT, logged_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public   -- the page's comment: "prevent hijacking"
AS $$
    SELECT action, logged_at
    FROM   audit_log
    WHERE  user_id = p_user_id;
$$;

-- If "public" is writable by ordinary users (the pre-PG15 default,
-- and still common today), a low-privilege attacker can run:
CREATE TABLE public.audit_log (action TEXT, logged_at TIMESTAMPTZ);
-- ...and populate it with fabricated rows. The SECURITY DEFINER
-- function's unqualified "FROM audit_log" reference resolves via
-- search_path -- which is pinned to exactly the schema the attacker
-- just planted a decoy table in.`,
    },
    {
      label: 'The fix PostgreSQL\'s own documentation recommends',
      language: 'sql',
      code: `CREATE OR REPLACE FUNCTION get_user_audit(p_user_id INT)
RETURNS TABLE(action TEXT, logged_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''   -- empty, not 'public'
AS $$
    SELECT action, logged_at
    FROM   public.audit_log   -- schema-qualified explicitly
    WHERE  user_id = p_user_id;
$$;

-- With search_path = '', ANY unqualified object reference inside the
-- function body fails to resolve at all -- forcing every table,
-- function, and operator reference to be explicitly schema-qualified
-- (as shown: public.audit_log). This closes the hijacking vector
-- completely: there is no writable schema left in the search path
-- for an attacker to plant a decoy object into.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A security audit flags the main page\'s exact get_user_audit function as vulnerable to search_path hijacking, but the developer who wrote it points to the SET search_path = public line and argues "I already pinned the search_path, so this is already fixed." Based on PostgreSQL\'s own documented guidance, is this argument correct?',
    hint: 'The vulnerability isn\'t about whether search_path is pinned to SOME fixed value — it\'s about whether that fixed value includes any schema an attacker can write to.',
    solution: `The developer's argument is not correct. Pinning search_path to a
fixed value is a necessary step, but PINNING IT TO "public"
specifically does not close the vulnerability if public is writable
by ordinary users — which is exactly the configuration PostgreSQL's
own documentation warns about. An attacker with CREATE privileges on
public can still plant a malicious same-named object there, and the
function's unqualified references will resolve to it, since public
is exactly the schema the search_path is pinned to.

The actual fix, per PostgreSQL's own official recommendation, is
SET search_path = '' (empty), combined with schema-qualifying every
object reference inside the function body explicitly. This removes
ANY writable schema from the function's name resolution, closing the
attack vector completely rather than just relocating it to whichever
schema happens to be pinned.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SET search_path = public on a SECURITY DEFINER function prevents search_path hijacking, since it pins the search_path to a fixed, known value instead of leaving it to inherit the caller\'s session setting.',
      reality: 'pinning to a FIXED value is necessary but not sufficient — if that fixed value (public) is itself writable by ordinary users, an attacker can still plant a malicious object in exactly that schema, and PostgreSQL\'s own documentation explicitly recommends against pinning to public for this reason.',
    },
    {
      thought: 'the PostgreSQL public schema is safe to include in a SECURITY DEFINER function\'s search_path because it\'s the default schema most objects live in.',
      reality: 'being the "default" schema is precisely what makes public dangerous here — its familiarity and broad writability (the default on PostgreSQL before version 15, and still common in practice) is exactly what a search_path hijack relies on.',
    },
    {
      thought: 'SET search_path = \'\' (empty) would break a SECURITY DEFINER function, since it would have no schema to resolve unqualified references against.',
      reality: 'this is precisely the intended, documented effect — forcing every object reference in the function body to be explicitly schema-qualified, which is what closes the hijacking vector entirely rather than just relocating it.',
    },
  ];
}
