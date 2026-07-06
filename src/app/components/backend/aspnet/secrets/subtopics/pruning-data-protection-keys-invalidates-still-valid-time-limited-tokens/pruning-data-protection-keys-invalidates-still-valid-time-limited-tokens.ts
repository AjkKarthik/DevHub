import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-pruning-dp-keys-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent, CodeBlockComponent,
    TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './pruning-data-protection-keys-invalidates-still-valid-time-limited-tokens.html',
  styleUrl: './pruning-data-protection-keys-invalidates-still-valid-time-limited-tokens.scss',
})
export class PruningDataProtectionKeysInvalidatesStillValidTimeLimitedTokensSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Q&A explains normal key rotation correctly ("old keys are retained and marked as expired but still usable for decryption") — but a time-limited token\'s OWN expiry clock is a promise made completely independently of how long the underlying KEY that encrypted it will physically remain in the key ring\'s storage',
      points: [
        'A <code>ITimeLimitedDataProtector.Protect(payload, TimeSpan.FromHours(24))</code> call, exactly as shown in the main page\'s own code tab, embeds an expiry timestamp INSIDE the encrypted payload — <code>Unprotect()</code> checks that timestamp and throws <code>SecurityTokenExpiredException</code> once it has passed. This is entirely separate from whether the specific key that encrypted the token still exists in the key ring\'s persisted storage (Redis, Blob Storage, the file system, wherever <code>PersistKeysTo...()</code> points).',
        'By default, Data Protection <strong>never automatically deletes keys</strong> — expired keys are retained indefinitely (marked "expired" but kept, exactly as the page\'s own Q&A states) unless an operator explicitly prunes them, e.g. by manually deleting entries from the Redis/Blob/file store, or via a custom cleanup script some teams write for storage-hygiene or compliance reasons. If a key that encrypted a STILL-young (not yet expired per its OWN 24-hour clock) time-limited token is deleted from the key ring\'s storage by such a prune, <code>Unprotect()</code> can no longer decrypt that token AT ALL — not because the token expired, but because the decryption key itself is gone.',
      ],
    },
    {
      heading: 'The failure is silent and easy to misdiagnose because both failure modes throw exceptions the main page\'s own code catches identically — a bare catch block that treats "token expired" and "key physically missing" as the same outcome',
      points: [
        'The main page\'s own <code>TimedTokenService.Validate()</code> method uses <code>try { return _protector.Unprotect(token); } catch { return null; }</code> — a bare catch that swallows the exception TYPE entirely. This is reasonable for the CALLER-facing API (both cases genuinely mean "this token cannot be trusted, treat it as invalid"), but it means a production incident where "password reset links from the last few hours are ALL suddenly failing" looks IDENTICAL, from the application\'s logs, to routine token expiry — unless something upstream specifically logs the underlying exception TYPE (<code>SecurityTokenExpiredException</code> vs. a <code>CryptographicException</code>/key-not-found variant) before the bare catch discards it.',
        'The blast radius distinguishes the two causes sharply: normal expiry only affects tokens whose OWN 24-hour window has genuinely passed — a rolling, gradual effect. A key-ring prune that removes a specific key invalidates EVERY still-young token that happened to be encrypted with THAT particular key, all at once, the instant the key is deleted — a sudden, batch failure that has nothing to do with individual tokens\' ages and everything to do with which key ring entry ops decided to remove.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the batch failure — key pruning vs. genuine expiry',
      language: 'csharp',
      code: `// Setup: Data Protection persisting keys to a shared store, matching
// the main page's own multi-pod configuration:
builder.Services
    .AddDataProtection()
    .SetApplicationName("myapp")
    .PersistKeysToStackExchangeRedis(redis, "DataProtection-Keys");

public class TimedTokenService(IDataProtectionProvider dpProvider)
{
    private readonly ITimeLimitedDataProtector _protector =
        dpProvider.CreateProtector("password-reset")
                  .ToTimeLimitedDataProtector();

    public string CreateToken(string userId)
        => _protector.Protect(userId, lifetime: TimeSpan.FromHours(24));

    // The main page's OWN implementation — a bare catch:
    public string? Validate(string token)
    {
        try   { return _protector.Unprotect(token); }
        catch { return null; }   // masks WHICH failure occurred
    }
}

// Timeline of a real incident:
//   09:00  User A requests a password reset. Token encrypted with
//          Key #17 (currently active). 24h expiry: valid until
//          tomorrow 09:00.
//   09:15  User B requests a password reset. ALSO encrypted with
//          Key #17 (same active key — keys don't rotate every request).
//   14:00  An ops "storage cleanup" script, run to reduce Redis
//          memory usage / meet a compliance retention policy, deletes
//          several OLDER, genuinely-expired keys — but a misconfigured
//          age threshold accidentally ALSO deletes Key #17 (perhaps it
//          was near a rotation boundary and looked "old enough").
//   14:05  Users A and B (and everyone else whose token happened to
//          use Key #17) click their password reset link. BOTH get
//          "invalid or expired token" — hours before their OWN
//          24-hour clock would have expired them. The application
//          logs show nothing distinguishing this from routine expiry.`,
    },
    {
      label: 'Distinguishing the two causes explicitly, and the operational fix',
      language: 'csharp',
      code: `// Distinguish the exception TYPES before the bare catch discards them —
// CryptographicException (key missing/corrupt) vs
// SecurityTokenExpiredException (token's own clock expired):
public string? Validate(string token)
{
    try
    {
        return _protector.Unprotect(token);
    }
    catch (SecurityTokenExpiredException)
    {
        _logger.LogInformation("Token expired normally (own 24h clock).");
        return null;
    }
    catch (CryptographicException ex)
    {
        // This is the ALARMING case — the token's OWN clock had not
        // necessarily expired; the underlying key is gone or corrupt.
        // If many of these fire in a tight window, it strongly
        // suggests a key-ring pruning event, not routine expiry.
        _logger.LogWarning(ex,
            "Token failed decryption — underlying key may be missing " +
            "(possible key-ring pruning event, not normal expiry).");
        return null;
    }
}

// TEST proving the distinction is real and observable:
[Fact]
public void Unprotect_Throws_Differently_For_Expired_Vs_MissingKey()
{
    var provider = CreateProviderWithFileSystemKeyRing(out var keyDir);
    var protector = provider.CreateProtector("password-reset")
                             .ToTimeLimitedDataProtector();

    var token = protector.Protect("user-42", TimeSpan.FromHours(24));

    // Case A: token genuinely expired (simulate via a fake clock, or
    // a zero/negative lifetime for the test) — throws
    // SecurityTokenExpiredException.

    // Case B: token is still well within its 24h window, but the key
    // file used to encrypt it is deleted from disk before Unprotect():
    var keyFiles = Directory.GetFiles(keyDir, "key-*.xml");
    File.Delete(keyFiles.First());

    var ex = Assert.ThrowsAny<Exception>(() => protector.Unprotect(token));
    Assert.IsNotType<SecurityTokenExpiredException>(ex);
    // A DIFFERENT exception type — proving these are genuinely
    // distinguishable failure modes, not variations of the same thing.
}

// The operational fix: any key-ring cleanup/retention script must
// account for the LONGEST time-limited token lifetime issued anywhere
// in the system — a key must never be pruned before every token that
// could have been encrypted with it has had a chance to naturally
// expire on its OWN clock first.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s longest-lived time-limited token is a 30-day "remember this device" token. Their key-ring retention policy, written before that feature existed, prunes any Data Protection key older than 14 days. Explain the concrete failure this creates, and state the correct retention rule the team should adopt.',
    hint: 'A key encrypts tokens for as long as it remains the "current" active key (which could itself be days or weeks) — then that key can go on decrypting ALREADY-ISSUED tokens for as long as the LONGEST-lived token type\'s own expiry window. What\'s the true minimum safe retention period for a key, given a 30-day token can be issued right before the key stops being active?',
    solution: `The failure: a "remember this device" token issued on day 0, using
whatever key was active at that moment, is meant to remain valid for
30 days per its OWN embedded expiry. But if that key is pruned at the
14-day mark (per the outdated retention policy), the token becomes
permanently undecryptable at day 14 — 16 days before its own promised
expiry. Every user who checked "remember this device" in roughly the
first two weeks after a key's activation window closed will be forced
to re-authenticate unexpectedly, and (per the earlier code tab) this
will look identical to normal token expiry in the logs unless the
CryptographicException vs SecurityTokenExpiredException distinction is
explicitly captured.

The correct retention rule has to account for TWO stacked durations,
not just the token's own lifetime: (1) how long a given key remains
the ACTIVE key before Data Protection\'s automatic rotation retires it
(the page's own SetDefaultKeyLifetime, e.g. 90 days) — because a token
can be issued using that key at ANY point during its active window,
including the very last moment before rotation — PLUS (2) the longest
token lifetime the application issues (30 days here). A key must
remain available for decryption for AT LEAST (active key lifetime +
longest token lifetime) after its creation, to guarantee that even a
token issued in the final second of that key's active window has
enough time to reach its own natural expiry before the key disappears.

With a 90-day active key lifetime and a 30-day token, the true minimum
safe retention is 120 days from a key's creation — not 14, and not
even a simple "30 days matching the token." The general principle:
key-ring retention policies must be derived FROM the application's own
token lifetime configuration, recalculated whenever a new, longer-lived
token type is introduced — a retention policy set once, independently
of what token lifetimes actually exist in the system, silently becomes
wrong the moment someone adds a longer-lived token type without
revisiting it.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a time-limited token\'s expiry (e.g. 24 hours, set via ToTimeLimitedDataProtector().Protect(payload, lifetime)) is the ONLY thing that determines when Unprotect() stops accepting it.',
      reality: 'the token can also become permanently undecryptable earlier than its own expiry if the specific Data Protection key that encrypted it is removed from the key ring\'s storage — key retention/pruning and the token\'s own embedded expiry clock are two independent mechanisms, and either one failing invalidates the token.',
    },
    {
      thought: 'catching every exception from IDataProtector.Unprotect() with a single bare catch block is fine because "invalid or expired" is the only outcome that matters to the caller.',
      reality: 'that is a reasonable caller-facing simplification, but it also discards the distinction between routine expiry (SecurityTokenExpiredException, a gradual per-token effect) and a missing/pruned key (a different exception type, a sudden batch effect hitting every token encrypted with that key at once) — logging the exception type before discarding it is often the only signal that reveals a key-ring operational incident is happening.',
    },
    {
      thought: 'a key-ring retention/cleanup policy only needs to account for how long the application\'s LONGEST time-limited token lives.',
      reality: 'a key can remain the ACTIVE encryption key for its own full configured lifetime (e.g. 90 days via SetDefaultKeyLifetime) before rotating out, meaning a long-lived token could be issued using that key at the very end of its active window — safe retention must cover the active key lifetime PLUS the longest token lifetime, not the token lifetime alone.',
    },
  ];
}
