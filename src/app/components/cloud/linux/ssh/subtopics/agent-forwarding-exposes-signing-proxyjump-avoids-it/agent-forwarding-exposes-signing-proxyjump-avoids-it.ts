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
  templateUrl: './agent-forwarding-exposes-signing-proxyjump-avoids-it.html',
  styleUrl: './agent-forwarding-exposes-signing-proxyjump-avoids-it.scss'
})
export class AgentForwardingExposesSigningProxyjumpAvoidsItSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions the risk in one clause, with no explanation of the mechanism or a concrete alternative',
      points: [
        'The main page\'s own QnA says only: "The agent forwards identities to remote hosts when ForwardAgent yes is set in config (use carefully — anyone with root on the remote host can use your keys)." That single parenthetical is the page\'s entire treatment of what is actually a well-documented, actively exploited attack pattern — it never explains HOW an attacker "uses your keys" without stealing the key file, or what to do instead.',
      ]
    },
    {
      heading: 'What agent forwarding actually exposes: not the key file, but live signing capability',
      points: [
        'Agent forwarding works by creating a Unix domain socket on the REMOTE host that proxies requests back to your LOCAL ssh-agent over the existing SSH connection. Your private key bytes never leave your own machine — that part of the main page\'s implicit framing is correct.',
        'But anyone able to access that forwarded socket on the remote host — most straightforwardly, root, but potentially any process able to read Unix-socket permissions in a misconfigured shared environment — can send a signing REQUEST through it and have your local agent sign it, exactly as if you had typed the command yourself. The attacker never needs the key material at all; they just need to ride the existing trust relationship for as long as your session (and your agent) remain connected.',
        'This makes a compromised jump host dramatically more dangerous than the main page\'s bastion example implies: if agent forwarding was enabled for that hop and an attacker compromises the bastion WHILE your session is active, they can pivot straight through to every downstream server your key is authorized for — production databases, other internal hosts — using YOUR identity, without ever exfiltrating a single credential file.',
      ]
    },
    {
      heading: 'The safer alternative: ProxyJump doesn\'t need agent forwarding at all',
      points: [
        'The main page\'s own SSH Config File section already recommends ProxyJump for bastion access — but doesn\'t connect this to the agent-forwarding risk. Since OpenSSH 7.3 (2016), ProxyJump (or the -J flag) tunnels the connection through the jump host entirely on the CLIENT side: your local machine negotiates authentication with the FINAL destination directly through that tunnel, and the jump host itself never needs to see your agent socket at all.',
        'This achieves the exact practical outcome the main page\'s bastion example wants — reach an internal host through an intermediary — with zero agent-forwarding exposure on that intermediary. There is essentially no remaining reason to combine ForwardAgent with a bastion/jump-host setup once ProxyJump is available.',
        'If a scenario genuinely requires agent forwarding to a host you don\'t fully trust (some older automation pipelines still assume it), <code>ssh-add -x</code> locks the agent with a separate passphrase (unlocked again with <code>ssh-add -X</code>) — while locked, a forwarded request cannot be signed without that passphrase, meaningfully narrowing (though not eliminating) the exposure window.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'How ForwardAgent actually gets exploited, without stealing the key',
      language: 'bash',
      code: `# Client connects to a jump host with agent forwarding enabled
ssh -A alice@bastion.example.com
# (or ForwardAgent yes for that Host block in ~/.ssh/config)

# On the bastion, a forwarded agent socket now exists:
echo $SSH_AUTH_SOCK
# /tmp/ssh-XXXXXXXXXX/agent.12345

# If an attacker has root (or otherwise reaches that socket) on
# the bastion WHILE this session is active, they can simply point
# their OWN ssh client at your forwarded socket:
SSH_AUTH_SOCK=/tmp/ssh-XXXXXXXXXX/agent.12345 ssh alice@prod-db.internal
# -- this authenticates AS YOU, using your local agent to sign the
#    challenge, with NO private key file ever copied or stolen.
#    It only works while your agent connection stays alive, but
#    that's exactly the window a live, in-progress session provides.`,
    },
    {
      label: 'The fix: ProxyJump instead of ForwardAgent',
      language: 'bash',
      code: `# ~/.ssh/config -- the SAFE bastion pattern, no agent forwarding
Host bastion
    HostName 203.0.113.10
    User ec2-user
    IdentityFile ~/.ssh/prod.pem

Host prod-db
    HostName 10.0.1.20
    User alice
    ProxyJump bastion          # <-- tunnels through bastion at the
    IdentityFile ~/.ssh/prod.pem   #     CLIENT level -- bastion never
                                     #     sees your agent socket at all

# ssh prod-db now authenticates directly against prod-db's own
# host key, over a tunnel through bastion -- bastion is never asked
# to sign anything and never gets a copy of the forwarded socket.

# Command-line equivalent, no config file needed:
ssh -J ec2-user@bastion.example.com alice@10.0.1.20

# If ForwardAgent is genuinely unavoidable for a specific legacy
# workflow, lock the agent to require a passphrase for EVERY
# forwarded signing request:
ssh-add -x                 # lock -- forwarded requests now need this
ssh-add -X                 # unlock when you actually need it`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team uses `ForwardAgent yes` in their `~/.ssh/config` for a `bastion` host, so that `ssh bastion` followed by `ssh internal-db` (typed manually on the bastion) works without re-entering a passphrase. A security review flags this configuration as risky. The bastion host itself has no known vulnerabilities today, and no private key file has ever left the team\'s laptops. Why is the security review still correct to flag it, and what specific change would resolve the concern without losing the "no re-typed passphrase" convenience?',
    hint: 'Think about what agent forwarding actually exposes on the bastion while a session is active — is it the key FILE itself, or something else that doesn\'t require stealing a file at all?',
    solution: 'The review is correct because the risk isn\'t about the key file being stolen — it\'s about the live SIGNING CAPABILITY that agent forwarding exposes on the bastion for as long as a forwarded session stays connected. Anyone who gains access to the forwarded agent socket on the bastion (most directly, root, or any future compromise of that host) can request signatures from the team members\' local agents and authenticate to any downstream host their keys are authorized for — internal-db included — without ever needing to steal a key file. "No known vulnerabilities today" doesn\'t protect against a FUTURE compromise of the bastion while a session happens to be active, which is exactly the window this exposes. The fix that keeps the "no re-typed passphrase" convenience is replacing `ForwardAgent yes` with `ProxyJump` (or `-J`) for the bastion hop: the SSH client tunnels the connection to `internal-db` through the bastion directly, so the bastion never receives the forwarded agent socket at all, while the end user still only authenticates once via their agent as usual.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'SSH agent forwarding is risky because it copies your private key file to the remote host.',
      reality: 'Per this subtopic\'s theory, the private key bytes never leave your local machine — agent forwarding instead exposes live SIGNING CAPABILITY via a proxied socket on the remote host, which anyone with access to that socket (most directly, root) can use to authenticate as you elsewhere, without ever touching the key file.'
    },
    {
      thought: 'ProxyJump and ForwardAgent are two different, complementary ways to reach a server through a bastion, so combining both is fine.',
      reality: 'Per this subtopic\'s theory, ProxyJump alone already achieves the full goal of a bastion setup — it tunnels the connection through the bastion at the client level, without the bastion ever needing to see an agent socket. ForwardAgent adds real exposure with no remaining benefit once ProxyJump is in use.'
    },
    {
      thought: 'If a jump host has no known vulnerabilities right now, enabling ForwardAgent for convenience is low-risk.',
      reality: 'Per this subtopic\'s theory, the danger specifically applies to a FUTURE compromise of the jump host WHILE a forwarded session happens to be active — a currently-clean host provides no protection against that scenario, which is exactly why security reviews flag ForwardAgent regardless of a host\'s current patch status.'
    }
  ];
}
