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
  templateUrl: './apt-key-is-deprecated-signed-by-keyrings-is-the-modern-replacement.html',
  styleUrl: './apt-key-is-deprecated-signed-by-keyrings-is-the-modern-replacement.scss'
})
export class AptKeyIsDeprecatedSignedByKeyringsIsTheModernReplacementSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine inconsistency between two sections of the main page itself',
      points: [
        'The main page\'s own Security and Pinning theory originally taught: "curl -fsSL URL | apt-key add - adds a key" — presented as the standard way to trust a repository\'s signing key (now corrected on the main page as part of this subtopic\'s own research). Meanwhile, the main page\'s own QnA answer for adding a PPA/custom repository ALREADY uses a completely different, more modern approach: downloading the key into <code>/etc/apt/keyrings/</code> and referencing it with <code>signed-by=</code> in the source entry. Two sections of the same page taught two different methods for the exact same task.',
      ]
    },
    {
      heading: 'Why apt-key is deprecated, and the real security reason behind it',
      points: [
        '<code>apt-key</code> is officially deprecated as of Debian 11 and Ubuntu 22.04, with the tool itself scheduled for full removal in subsequent releases. This is not a cosmetic deprecation — it addresses a genuine security weakness in how apt-key worked.',
        'The core problem: a key added via <code>apt-key add</code> lands in a SHARED, system-wide trusted keyring (<code>/etc/apt/trusted.gpg</code> or <code>/etc/apt/trusted.gpg.d/</code>) that apt consults for EVERY repository configured on the system that doesn\'t specify its own key. This means a single third-party repository\'s signing key, once trusted this way, is implicitly trusted to sign packages for ANY repository on the system — including the distribution\'s own official ones. A compromised or malicious third-party repository whose key was added via apt-key could, in principle, sign a package claiming to come from an entirely different (even official) source.',
      ]
    },
    {
      heading: 'The modern replacement: a dedicated, per-repository keyring',
      points: [
        'The <code>signed-by=</code> option (available since APT 2.4, with <code>/etc/apt/keyrings/</code> as the recommended standard location) scopes a key\'s trust to ONLY the specific repository entry that references it — a compromised key for one third-party repo cannot be used to forge packages claiming to come from any other source, closing exactly the gap apt-key\'s shared-keyring model left open.',
        'The main page\'s own QnA answer for adding a custom repository already demonstrates the correct modern pattern end to end: download the key into a dedicated file under <code>/etc/apt/keyrings/</code>, then reference that exact file with <code>signed-by=/etc/apt/keyrings/repo.gpg</code> in the <code>deb [...]</code> line added to <code>/etc/apt/sources.list.d/</code> — this subtopic exists to explain WHY that pattern (rather than the theory section\'s original apt-key example) is the one actually worth following.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The deprecated pattern and why it\'s risky',
      language: 'bash',
      code: `# The DEPRECATED pattern (apt-key) -- do not use for new setups:
curl -fsSL https://example.com/repo-key.gpg | sudo apt-key add -

# What this actually does: adds the key to a SHARED, system-wide
# trusted keyring
sudo apt-key list
# /etc/apt/trusted.gpg
# --------------------
# pub   rsa4096 2020-01-01 [SC]
#       ABCD 1234 ... (example.com's key -- now trusted for
#                       EVERY repo on the system, not just
#                       example.com's own repo entry)

# apt itself now warns about this directly:
sudo apt update
# W: apt-key is deprecated. Manage keyring files in trusted.gpg.d
#    instead (see apt-key(8)).`,
    },
    {
      label: 'The modern replacement -- scoped, per-repository trust',
      language: 'bash',
      code: `# Download the key into a DEDICATED file (not the shared keyring)
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://example.com/repo-key.gpg | \\
    sudo gpg --dearmor -o /etc/apt/keyrings/example-repo.gpg

# Reference that SPECIFIC file in the repository entry -- signed-by=
# scopes trust to ONLY this one repo, not the whole system
echo "deb [signed-by=/etc/apt/keyrings/example-repo.gpg] \\
https://example.com/apt stable main" | \\
    sudo tee /etc/apt/sources.list.d/example-repo.list

sudo apt update
# No deprecation warning -- and if this key is ever compromised,
# it can ONLY be used to forge packages claiming to come from
# example.com's own repo entry, not any other repository on
# the system.

# Exactly the pattern the main page's own QnA already demonstrates
# for adding a PPA/custom repository -- this subtopic explains why
# that pattern, not the older apt-key one, is the one to follow.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team follows an older tutorial that adds a third-party repository\'s signing key with `curl -fsSL https://vendor.example.com/key.gpg | sudo apt-key add -`. A security review flags this as a risk, even though the vendor\'s repository itself has no known compromise. Why is the review correct, and what change would resolve it while keeping the same vendor repository working?',
    hint: 'Think about WHERE apt-key actually stores the key, and whether that storage location\'s trust is scoped to just this one vendor\'s repository, or something broader.',
    solution: 'The review is correct because apt-key adds the key to a SHARED, system-wide trusted keyring that apt consults for every repository configured on the system that doesn\'t specify its own key — not just the vendor\'s own repository entry. This means if that vendor\'s key were ever compromised (or the vendor\'s infrastructure compromised), an attacker could use it to sign packages claiming to come from an entirely different, even official, repository, since apt-key provides no way to scope a key\'s trust to just one source. This is exactly why apt-key is deprecated (as of Debian 11 / Ubuntu 22.04). The fix that keeps the same vendor repository working: download the key into a dedicated file under `/etc/apt/keyrings/` and reference that specific file with `signed-by=/etc/apt/keyrings/vendor.gpg` in the repository\'s own `deb [...]` line in `/etc/apt/sources.list.d/` — this scopes the key\'s trust to only that one repository entry, so even a compromised key can\'t be used to forge packages from any other source.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'apt-key add is still the standard, currently-recommended way to trust a third-party repository\'s signing key.',
      reality: 'Per this subtopic\'s theory, apt-key is deprecated as of Debian 11 / Ubuntu 22.04 and scheduled for removal — the modern, currently-recommended approach uses signed-by= with a dedicated keyring file per repository.'
    },
    {
      thought: 'Adding a key via apt-key only grants trust to the specific repository whose key was added.',
      reality: 'Per this subtopic\'s theory, a key added via apt-key lands in a SHARED, system-wide trusted keyring that apt consults for every configured repository lacking its own signed-by= key — the trust is not scoped to just the one repository the key was meant for.'
    },
    {
      thought: 'Since the vendor repository itself has no known compromise, using apt-key to trust its key carries no meaningful risk.',
      reality: 'Per this subtopic\'s theory, the risk isn\'t about the repository\'s CURRENT state — it\'s that apt-key\'s shared-keyring model means a FUTURE compromise of that one key could be used to forge packages from any other repository on the system, a risk signed-by= specifically eliminates by scoping trust per-repository.'
    }
  ];
}
