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
  templateUrl: './tar-already-strips-leading-slashes-unless-p-is-used.html',
  styleUrl: './tar-already-strips-leading-slashes-unless-p-is-used.scss'
})
export class TarAlreadyStripsLeadingSlashesUnlessPIsUsedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own tar example archives an absolute path, with no mention of what happens to it',
      points: [
        'The main page\'s own "sed & awk" code tab includes: "tar -czf backup.tar.gz /etc/nginx/ # create" — an absolute path passed directly to tar, with a one-word comment ("create") and nothing about what form that path takes once it\'s actually inside the resulting archive.',
        'A reasonable, plausible-sounding assumption from this example alone: the archive stores /etc/nginx exactly as given, so extracting it anywhere reproduces the file at the literal path /etc/nginx on whatever system it\'s extracted on. This assumption turns out to be backwards for GNU tar\'s actual default behavior.',
      ]
    },
    {
      heading: 'Confirmed via GNU tar\'s own documentation: absolute paths are stripped by default, with a warning',
      points: [
        'Per GNU tar\'s own manual and documented behavior: "by default, absolute paths are converted to relative paths when archiving" — tar deliberately strips the leading slash from each member name as it\'s added to the archive, and prints a warning while doing so (the well-known "tar: Removing leading \'/\' from member names" message).',
        'The stated reason is safety, not an accident of implementation: preserving absolute paths in an archive means extracting it could overwrite arbitrary system files at their original absolute locations — stripping the leading slash means the SAME archive, extracted anywhere, recreates its contents as a RELATIVE subtree rooted at wherever the extraction happens to run, never silently reaching back out to overwrite /etc/nginx (or anything else) unless the extraction is deliberately run from /.',
        'This means the main page\'s own example, run as written, actually produces an archive whose member names look like etc/nginx/nginx.conf (no leading slash) — not /etc/nginx/nginx.conf — even though the command that created it was given the absolute path /etc/nginx/ as its argument.',
      ]
    },
    {
      heading: 'The flag that actually restores absolute-path behavior, and why it\'s the risky choice',
      points: [
        'The behavior CAN be disabled — GNU tar\'s -P (or --absolute-names) option suppresses the leading-slash stripping and its warning, preserving the archive member\'s original absolute path exactly as given. Confirmed via the same documented guidance: "using -P is risky, as extracting such an archive can overwrite system files, and should only be used if you fully understand the consequences."',
        'This makes -P/--absolute-names the actual mechanism behind the main page\'s implicit "backup restores to its original location" assumption — but that behavior has to be explicitly OPTED INTO, at real risk, rather than being the safe default the main page\'s own bare example silently implies.',
        'The documented best practice for a backup that genuinely needs a predictable, controlled restore location — without either the default\'s relative-to-current-directory ambiguity or -P\'s system-overwrite risk — is combining tar\'s own -C flag with a relative path at ARCHIVE-CREATION time: tar -czf backup.tar.gz -C / etc/nginx changes into / first, then archives the relative path etc/nginx from there, producing the exact same relative-path archive contents as the default behavior, but without ever needing -P or triggering the leading-slash warning at all.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the main page\'s own example actually produces',
      language: 'bash',
      code: `# Main page's own example, unchanged:
tar -czf backup.tar.gz /etc/nginx/

# What actually happens (GNU tar's real, documented default):
tar -czf backup.tar.gz /etc/nginx/
# tar: Removing leading '/' from member names

# Confirm what's actually stored inside, using the main page's
# own -tzf ("list contents") flag:
tar -tzf backup.tar.gz
# etc/nginx/
# etc/nginx/nginx.conf
# etc/nginx/conf.d/
# ...
# -- NO leading slash on any entry, despite the absolute path
#    /etc/nginx/ being what was passed to the create command.

# Extracting this archive from an arbitrary directory:
mkdir /tmp/restore-test && cd /tmp/restore-test
tar -xzf /path/to/backup.tar.gz
find . -maxdepth 3
# ./etc
# ./etc/nginx
# ./etc/nginx/nginx.conf
# -- recreated as a RELATIVE subtree under the current directory,
#    NOT at the real /etc/nginx -- the original system's config is
#    completely untouched by this extraction.`,
    },
    {
      label: 'The actual absolute-path flag, and the safer alternative',
      language: 'bash',
      code: `# The flag that DOES preserve absolute paths -- opted into
# explicitly, not the default:
tar -czPf backup-absolute.tar.gz /etc/nginx/
# (no "Removing leading '/'" warning this time)

tar -tzf backup-absolute.tar.gz
# /etc/nginx/
# /etc/nginx/nginx.conf
# -- leading slash preserved. Per GNU tar's own documented
#    guidance: "using -P is risky, as extracting such an archive
#    can overwrite system files" -- extracting THIS archive from
#    ANY directory, even accidentally from /, writes directly back
#    to the real /etc/nginx.

# The safer way to get a controlled, predictable restore location
# WITHOUT the -P risk -- change directory first, then archive a
# RELATIVE path (produces the same relative-path archive as the
# ordinary default, with no warning at all since nothing absolute
# was ever passed to tar in the first place):
tar -czf backup-safe.tar.gz -C / etc/nginx
tar -tzf backup-safe.tar.gz
# etc/nginx/
# etc/nginx/nginx.conf
# -- identical relative structure to the DEFAULT (non-P) behavior
#    from the first example, reached deliberately instead of by
#    tar's own stripping/warning mechanism.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team backs up a config directory with tar -czf backup.tar.gz /etc/myapp/, following the exact pattern the main page\'s own example uses. Months later, during a disaster-recovery drill on a fresh replacement server, an engineer runs tar -xzf backup.tar.gz while sitting in their own home directory (not /), expecting the original /etc/myapp files to be restored to their real location automatically, the same way the backup command referenced them by absolute path. After extraction, /etc/myapp is still empty. Where did the files actually go, and was the original backup command missing anything?',
    hint: 'Check what GNU tar\'s own default behavior does to a leading slash when a member is added to an archive with -c, and where an extraction with -x restores files relative to.',
    solution: 'The files went into a new etc/myapp subdirectory under the engineer\'s own home directory, not to /etc/myapp — and the original backup command wasn\'t missing anything; it worked exactly as GNU tar is documented to behave by default. Per GNU tar\'s own documentation, "by default, absolute paths are converted to relative paths when archiving" — the create command silently stripped the leading slash from /etc/myapp/... (printing a "Removing leading \'/\' from member names" warning that\'s easy to miss in script output), storing the archive\'s contents as the relative path etc/myapp/... A subsequent extraction restores that relative structure under whatever directory the extraction command is run FROM — in this case, the engineer\'s home directory, not /. To have restored directly to the real /etc/myapp automatically, either the archive would need to have been created with -P/--absolute-names (preserving the absolute path, at the documented risk of overwriting system files on any future extraction, anywhere) or the restore procedure needs to explicitly cd / (or use tar\'s own -C / on extraction) before running tar -xzf, to place the relative etc/myapp/... structure at the intended absolute location on purpose.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Archiving a file or directory with tar using its absolute path (e.g. tar -czf backup.tar.gz /etc/nginx/) preserves that absolute path inside the archive by default.',
      reality: 'Per this subtopic\'s theory, GNU tar\'s own documented default behavior does the opposite — it strips the leading slash and converts the path to relative, printing a "Removing leading \'/\' from member names" warning, specifically as a safety measure.'
    },
    {
      thought: 'Since tar strips leading slashes by default for safety, there\'s never a legitimate reason to use -P/--absolute-names.',
      reality: 'Per this subtopic\'s theory, -P is a real, documented option for cases where an archive genuinely needs to preserve and restore to its exact original absolute location — it\'s explicitly flagged as risky rather than forbidden, appropriate when the operator fully understands and intends that overwrite behavior.'
    },
    {
      thought: 'A backup archive created with tar always extracts its contents back to their original absolute location, regardless of the current directory at extraction time.',
      reality: 'Per this subtopic\'s theory, an archive created with tar\'s default (leading-slash-stripped) behavior extracts its relative-path contents under WHATEVER directory the extraction command is run from — restoring to the true original location requires either -P at creation time or explicitly changing to the right directory before extracting.'
    }
  ];
}
