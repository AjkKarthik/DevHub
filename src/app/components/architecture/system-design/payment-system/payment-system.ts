import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'Idempotency key',    type: 'keyword', desc: 'Unique per payment attempt. Prevents double charges on network retry.' },
  { name: 'Double-entry ledger',type: 'keyword', desc: 'Every debit has a matching credit. Balance = sum of all entries. Immutable.' },
  { name: 'PSP',                type: 'keyword', desc: 'Payment Service Provider (Stripe, Adyen). Handles card network integration.' },
  { name: 'Reconciliation',     type: 'keyword', desc: 'Nightly comparison of internal ledger vs PSP settlement report to find discrepancies.' },
  { name: 'Exactly-once',       type: 'keyword', desc: 'Idempotency + deduplication = same effect regardless of how many times retried.' },
  { name: 'Saga',               type: 'keyword', desc: 'Distributed transaction pattern: local commits + compensating transactions on failure.' },
  { name: 'PCI DSS',            type: 'keyword', desc: 'Payment Card Industry security standard. Never store raw card numbers — tokenise.' },
  { name: 'Soft delete',        type: 'keyword', desc: 'Payment records are never deleted — mark as voided. Audit trail must be permanent.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Core payment flow',
    points: [
      'User initiates payment → Payment Service validates → calls PSP (Stripe/Adyen) → PSP charges card network.',
      'On success: write ledger entries (debit user, credit merchant) → update order status → send confirmation.',
      'Idempotency key sent with every PSP call — PSP returns same result for duplicate requests.',
      'All steps in a Saga: PSP charge → ledger entry → order update. Compensate (refund) if any step fails.',
    ],
  },
  {
    heading: 'Double-entry ledger',
    points: [
      'Every transaction has two entries: debit one account, credit another. Sum of all entries = 0.',
      'Example: user pays $100 → Debit: user_wallet -$100, Credit: merchant_wallet +$100, Credit: platform_fee +$0.',
      'Ledger entries are immutable — never update or delete. Corrections via new reversal entries.',
      'Balance query: SELECT SUM(amount) FROM ledger WHERE account_id = ? — always consistent.',
    ],
  },
  {
    heading: 'Preventing double charges',
    points: [
      'Idempotency key: UUID generated client-side, sent with payment request.',
      'Server stores (idempotency_key, result) in DB. On duplicate: return cached result, no re-charge.',
      'TTL on idempotency records: 24h is standard for payments.',
      'PSPs (Stripe, Adyen) also support idempotency keys natively — send in every API call.',
    ],
  },
  {
    heading: 'Reconciliation',
    points: [
      'PSP sends settlement report (CSV/API) every 24h with actual charges and fees.',
      'Reconciliation job: compare internal ledger vs PSP report. Flag discrepancies.',
      'Common discrepancies: refunds processed by PSP but not in internal system; failed charges marked as successful.',
      'Automated reconciliation catches ~99% of issues; manual review queue for exceptions.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Idempotent Payment',
    language: 'typescript',
    code: `// Idempotent payment processing

async function processPayment(req: PaymentRequest): Promise<PaymentResult> {
  const { idempotencyKey, userId, amount, currency, orderId } = req;

  // 1. Check idempotency store (dedup within 24h)
  const cached = await redis.get(\`idem:pay:\${idempotencyKey}\`);
  if (cached) {
    console.log('Duplicate payment request — returning cached result');
    return JSON.parse(cached);
  }

  // 2. Acquire distributed lock to prevent concurrent duplicates
  const lock = await redlock.acquire(\`lock:pay:\${idempotencyKey}\`, 10_000);
  try {
    // Re-check after acquiring lock (another instance may have processed it)
    const recheck = await redis.get(\`idem:pay:\${idempotencyKey}\`);
    if (recheck) return JSON.parse(recheck);

    // 3. Call PSP with idempotency key
    const charge = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: userId,
      metadata: { orderId },
      idempotencyKey,   // Stripe deduplicates on their side too
    });

    // 4. Write double-entry ledger atomically
    await db.transaction(async tx => {
      await tx.run(\`
        INSERT INTO ledger (account_id, amount, type, reference_id, created_at)
        VALUES
          (?, ?, 'debit',  ?, NOW()),   -- user account debit
          (?, ?, 'credit', ?, NOW()),   -- merchant account credit
          (?, ?, 'credit', ?, NOW())    -- platform fee credit
      \`, [userId, -amount, charge.id,
           req.merchantId, amount * 0.97, charge.id,
           'platform', amount * 0.03, charge.id]);

      await tx.run(
        'UPDATE orders SET status = ? WHERE id = ?', ['paid', orderId]
      );
    });

    const result: PaymentResult = { chargeId: charge.id, status: 'success', amount };

    // 5. Cache result (24h TTL)
    await redis.setEx(\`idem:pay:\${idempotencyKey}\`, 86_400, JSON.stringify(result));
    return result;

  } finally {
    await lock.release();
  }
}`,
  },
  {
    label: 'Double-Entry Ledger',
    language: 'bash',
    code: `-- Double-entry ledger schema

CREATE TABLE accounts (
  id         UUID PRIMARY KEY,
  type       TEXT NOT NULL,  -- 'user', 'merchant', 'platform', 'escrow'
  currency   CHAR(3) NOT NULL DEFAULT 'USD'
);

CREATE TABLE ledger (
  id           BIGSERIAL PRIMARY KEY,
  account_id   UUID NOT NULL REFERENCES accounts(id),
  amount       NUMERIC(19,4) NOT NULL,  -- negative=debit, positive=credit
  type         TEXT NOT NULL,           -- 'debit' | 'credit'
  reference_id TEXT NOT NULL,           -- charge ID, refund ID, etc.
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- NO update, NO delete — append-only forever
  CONSTRAINT no_zero_amount CHECK (amount != 0)
);

CREATE INDEX idx_ledger_account ON ledger (account_id, created_at DESC);

-- Balance query (always consistent):
SELECT SUM(amount) AS balance
FROM ledger
WHERE account_id = 'user-123';

-- Verify books balance (sum should always be 0):
SELECT SUM(amount) FROM ledger;  -- must equal 0

-- Example entries for $100 payment:
-- account_id=user-123    amount=-100.00  type=debit   reference=ch_abc
-- account_id=merchant-1  amount= +97.00  type=credit  reference=ch_abc
-- account_id=platform     amount=  +3.00  type=credit  reference=ch_abc`,
  },
  {
    label: 'Reconciliation',
    language: 'typescript',
    code: `// Nightly reconciliation job — compare internal ledger vs PSP report

interface PSPSettlement {
  chargeId: string;
  amount: number;
  fee: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'refunded';
  settledAt: Date;
}

async function reconcile(date: string): Promise<ReconciliationReport> {
  // 1. Fetch PSP settlement report for date
  const pspReport = await stripe.reporting.reportRuns.retrieve(\`report_\${date}\`);
  const pspSettlements = pspReport.data as PSPSettlement[];

  // 2. Fetch internal ledger entries for same date
  const internalEntries = await db.query(\`
    SELECT reference_id, SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS debited
    FROM ledger
    WHERE DATE(created_at) = ? AND type = 'debit'
    GROUP BY reference_id
  \`, [date]);

  const internalMap = new Map(internalEntries.map(e => [e.reference_id, e.debited]));

  const discrepancies: Discrepancy[] = [];

  for (const settlement of pspSettlements) {
    const internal = internalMap.get(settlement.chargeId);

    if (!internal) {
      discrepancies.push({ type: 'MISSING_INTERNAL', chargeId: settlement.chargeId, pspAmount: settlement.amount });
    } else if (Math.abs(internal - settlement.amount) > 0.01) {
      discrepancies.push({ type: 'AMOUNT_MISMATCH', chargeId: settlement.chargeId, internal, psp: settlement.amount });
    }
  }

  // 3. Alert on discrepancies > threshold
  if (discrepancies.length > 0) {
    await alertTeam('reconciliation-alerts', discrepancies);
  }

  return { date, total: pspSettlements.length, discrepancies };
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'No idempotency key on payment retry',
    wrong: `// Network timeout → retry without idempotency key
async function chargeWithRetry(amount: number) {
  for (let i = 0; i < 3; i++) {
    try {
      return await stripe.charge({ amount });  // no idempotency key
    } catch {}
  }
}
// Stripe may process 3 separate charges — customer triple-billed`,
    right: `// Generate idempotency key once before retry loop
const idempotencyKey = crypto.randomUUID();
for (let i = 0; i < 3; i++) {
  try {
    return await stripe.charge({ amount }, { idempotencyKey });
    // Stripe returns same result for duplicate key — safe to retry
  } catch {}
}`,
    explanation: 'A payment request that times out may have been processed by the PSP. Retrying without an idempotency key creates a second charge. Always generate the key before the first attempt and reuse it on every retry.',
  },
  {
    title: 'Storing raw card numbers',
    wrong: `// Storing card number in your database
await db.run('INSERT INTO payment_methods (user_id, card_number, cvv) VALUES (?, ?, ?)',
  [userId, '4111111111111111', '123']);
// PCI DSS violation — massive legal liability`,
    right: `// Tokenise with Stripe/Adyen — never see raw card data
const paymentMethod = await stripe.paymentMethods.create({ type: 'card', card: element });
// Store only the token: pm_1234abc — useless to attackers
await db.run('INSERT INTO payment_methods (user_id, stripe_pm_id) VALUES (?, ?)',
  [userId, paymentMethod.id]);`,
    explanation: 'Storing raw card data requires full PCI DSS Level 1 compliance — annual audits, penetration testing, network segmentation. Tokenisation via a PSP removes your system from PCI scope entirely. Never handle raw card numbers.',
  },
  {
    title: 'Mutable ledger records',
    wrong: `// "Correcting" a payment entry by updating it
await db.run('UPDATE ledger SET amount = ? WHERE id = ?', [newAmount, ledgerId]);
// Audit trail destroyed — cannot reconstruct what happened`,
    right: `// Ledger is append-only — use reversal entries to correct
// Original: charge $100
// Correction: add reversal entry (-$100) + new correct entry ($95)
await db.run(\`
  INSERT INTO ledger (account_id, amount, type, reference_id)
  VALUES (?, -100, 'reversal', ?), (?, 95, 'credit', ?)
\`, [accountId, originalRef, accountId, correctionRef]);`,
    explanation: 'A financial ledger must be immutable. Updating or deleting entries destroys the audit trail, makes reconciliation impossible, and is illegal in most jurisdictions. All corrections must be new reversal + correction entries.',
  },
  {
    title: 'Skipping reconciliation',
    wrong: `// "Stripe handles everything — we trust their data"
// Six months later: 0.1% of charges silently failed after ACK
// $180,000 in revenue never captured
// Discovered during annual audit, not in real-time`,
    right: `// Daily automated reconciliation:
// Internal ledger vs PSP settlement report
// Alert on ANY discrepancy within 24h
// Typical discrepancy rate: 0.01–0.1%
// Automated catch rate: 99%+`,
    explanation: 'No payment system is 100% reliable — network failures, PSP bugs, and race conditions cause discrepancies. Without daily reconciliation, errors accumulate silently. Reconciliation is non-negotiable for any production payment system.',
  },
];

const challenge: Challenge = {
  title: 'Design a wallet-to-wallet transfer system',
  language: 'typescript',
  description: `Design a peer-to-peer money transfer system (Venmo/PayPal-like).

Requirements:
- Transfer from user A's wallet to user B's wallet
- Prevent double spends (insufficient balance check)
- No money created or destroyed (double-entry constraint)
- Support concurrent transfers (race conditions)
- Idempotent: retrying transfer is safe
- Eventual reconciliation with bank ACH settlement

Challenges:
1. How do you prevent A from spending the same money twice?
2. How do you ensure atomicity (A debited ↔ B credited)?
3. What if ACH settlement fails after internal transfer?`,
  hints: [
    'Balance check + debit must be atomic — use DB transaction + pessimistic lock',
    'Double-entry: debit A + credit B in same transaction = atomic',
    'ACH failure: money already in B\'s wallet — handle via chargeback workflow',
    'Idempotency key on transfer ID prevents duplicate execution',
  ],
  starterCode: `async function transfer(from: string, to: string, amount: number, transferId: string): Promise<void> {
  // Problems with naive implementation:
  // 1. Check balance: OK
  // 2. Deduct from A: OK
  // 3. Add to B: ← what if this fails?
  // 4. A is debited, B is not credited → money destroyed!
}`,
  solution: `async function transfer(
  from: string,
  to: string,
  amount: number,
  transferId: string  // idempotency key
): Promise<TransferResult> {
  // 1. Idempotency check
  const existing = await db.query('SELECT * FROM transfers WHERE id = ?', [transferId]);
  if (existing) return existing;

  // 2. Atomic transfer using DB transaction with row-level locking
  return await db.transaction(async tx => {
    // Lock BOTH accounts in consistent order (lower ID first) to prevent deadlock
    const [accountA, accountB] = [from, to].sort();
    const accounts = await tx.query(\`
      SELECT id, balance FROM accounts WHERE id IN (?, ?) FOR UPDATE
    \`, [accountA, accountB]);

    const sender = accounts.find(a => a.id === from);
    if (!sender || sender.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // 3. Double-entry ledger (atomic)
    await tx.run(\`
      INSERT INTO ledger (account_id, amount, type, reference_id, created_at) VALUES
        (?, ?,        'debit',  ?, NOW()),   -- debit sender
        (?, ?,        'credit', ?, NOW())    -- credit recipient
    \`, [from, -amount, transferId, to, +amount, transferId]);

    // 4. Update cached balances (denormalised for fast reads)
    await tx.run('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, from]);
    await tx.run('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, to]);

    // 5. Record transfer
    const result = { id: transferId, from, to, amount, status: 'completed' };
    await tx.run('INSERT INTO transfers (id, from_id, to_id, amount, status) VALUES (?, ?, ?, ?, ?)',
      [transferId, from, to, amount, 'completed']);

    return result;
  });
  // If tx fails: both ledger entries rolled back — A not debited, B not credited
}`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'In a double-entry ledger, what must always be true?',
    options: [
      'Credits always equal debits across all accounts',
      'Each transaction has exactly two entries',
      'The sum of all ledger entries equals zero',
      'Debits are always positive numbers',
    ],
    answer: 2,
    explanation: 'In double-entry accounting, every debit has a matching credit. The sum of all entries across all accounts must equal zero. This invariant lets you verify data integrity: SELECT SUM(amount) FROM ledger should return 0.',
  },
  {
    q: 'An idempotency key in payments prevents?',
    options: [
      'Fraud and chargebacks',
      'Double charges when a payment request is retried after a network timeout',
      'Currency conversion errors',
      'PCI DSS violations',
    ],
    answer: 1,
    explanation: 'A network timeout leaves the caller uncertain: was the charge processed? Without an idempotency key, retrying creates a new charge. With one, the server returns the cached result of the original attempt — safe to retry any number of times.',
  },
  {
    q: 'Why should payment ledger records never be updated or deleted?',
    options: [
      'Databases are too slow for updates on large tables',
      'To maintain an immutable audit trail for reconciliation and legal compliance',
      'PSPs require append-only storage',
      'Updates cause deadlocks in payment systems',
    ],
    answer: 1,
    explanation: 'Financial audit trails must be immutable. Updating or deleting ledger entries destroys the history needed for reconciliation, fraud investigation, regulatory compliance, and dispute resolution. Corrections are made via new reversal entries.',
  },
  { q: 'Why is idempotency critical in payment systems?', options: ['To make payments faster by caching results', 'To prevent duplicate charges when a network timeout causes a client to retry a payment request', 'To ensure payments are processed in the correct currency', 'To validate that card numbers are correctly formatted before charging'], answer: 1, explanation: 'In payment processing, network timeouts or failures may cause the client to retry a request that already succeeded on the server side. Without idempotency, the retry charges the customer twice. Idempotency is implemented by assigning each payment request a unique idempotency key (generated by the client). The server stores the key and result: on the first request, it processes the payment and stores the result. On any retry with the same key, it returns the stored result without reprocessing. Stripe and other payment APIs make idempotency keys a required parameter for all mutating operations.' },
  { q: 'What is the role of a payment gateway versus a payment processor?', options: ['They are interchangeable terms for the same service in the payments industry', 'A payment gateway securely transmits payment data between merchant and processor; a payment processor executes the actual fund transfer between banks', 'A payment processor handles online payments only; a payment gateway handles in-person card transactions', 'The payment gateway stores cardholder data; the payment processor discards it after authorization'], answer: 1, explanation: 'A payment gateway is the technology layer that securely collects and transmits payment information from the merchant to the payment processor. It handles encryption, fraud checks, and communication with the card networks. A payment processor (like Visa, Mastercard, or Stripe) executes the actual financial transaction: communicating with the issuing bank to authorize the charge and eventually moving funds. Stripe acts as both gateway and processor for most use cases, simplifying integration.' },
  { q: 'What is a chargeback and how do payment systems handle them?', options: ['A chargeback is a fee charged when a payment fails validation', 'A chargeback is when a cardholder disputes a charge with their bank, which reverses the transaction and takes funds back from the merchant', 'A chargeback is when a merchant refunds a customer proactively before a dispute arises', 'A chargeback occurs only when a stolen card is used for a transaction'], answer: 1, explanation: 'A chargeback occurs when a cardholder disputes a charge with their issuing bank. The bank investigates and may reverse the transaction, deducting the amount from the merchant account plus a chargeback fee. Merchants can contest chargebacks by providing evidence like order details, delivery confirmation, and fraud analysis. High chargeback rates can lead to increased processing fees or account termination. Prevent chargebacks with clear billing descriptors, proactive refunds for legitimate complaints, strong fraud detection, and detailed transaction records to support dispute resolution.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do you prevent double-spend (A spending same money twice concurrently)?',
    a: 'Use a database transaction with a pessimistic lock (SELECT FOR UPDATE) on the sender\'s account row. This ensures only one concurrent transaction can read the balance and deduct at a time. The second transaction waits, then reads the updated balance — if insufficient, it fails. Optimistic locking (version numbers) is an alternative: if the version changed since you read it, retry.',
  },
  {
    q: 'What is reconciliation and why is it necessary?',
    a: 'Reconciliation is a nightly comparison of your internal ledger against the PSP\'s settlement report. It catches discrepancies caused by: (1) network failures where a charge succeeded at the PSP but your confirmation was lost; (2) PSP bugs; (3) race conditions in your code. Even at 99.99% reliability, 0.01% discrepancy on 1M daily transactions = 100 errors/day worth real money. Reconciliation catches them within 24 hours.',
  },
  { q: 'How do you design a double-entry accounting system for a payment platform?', a: 'Double-entry accounting records every financial transaction as two equal and opposite entries: a debit on one account and a credit on another. This ensures the accounting equation always balances: assets equal liabilities plus equity. In software: create a ledger table with columns for account_id, amount (positive for credit, negative for debit), and transaction_id. Every payment creates two ledger rows: one crediting the platform revenue account and one debiting the merchant account. Balance queries sum all entries for an account. This approach provides an immutable audit trail, makes it impossible to lose money accidentally due to single-entry bugs, and supports complex multi-party transactions by adding more entry pairs.' },
  { q: 'How do you handle currency conversion and multi-currency payments?', a: 'Multi-currency system design: store all amounts in the smallest currency unit (cents for USD, pence for GBP) as integers to avoid floating-point precision errors. Store the currency code alongside every amount. Maintain exchange rates from a reliable provider like the European Central Bank or Open Exchange Rates, refreshing rates at least daily. At payment time, convert to the settlement currency using the rate at transaction time and store both the original currency amount and the settlement currency amount. For accounting, report in a single base currency. Consider foreign exchange risk for platforms that hold multi-currency balances: either settle immediately or offer hedging options to merchants.' },
  { q: 'What are the key components in designing a reconciliation system for payments?', a: 'Reconciliation verifies that internal records match external payment processor and bank records. Daily reconciliation flow: download transaction reports from payment processors (Stripe, PayPal) for the previous day. Compare each transaction by reference ID against internal payment records. Categorize discrepancies: missing in internal records (processor charged but we did not record), missing in processor records (we recorded but processor did not charge), or amount mismatches. Investigate and resolve each discrepancy: some are timing differences (batch processing boundary), others indicate bugs or fraud. Automate matching and flag only unresolved discrepancies for manual review. Store reconciliation results for auditor access.' },
  { q: 'How do you implement fraud detection in a payment system?', a: 'Fraud detection layers: rule-based screening applies hard rules that block obviously suspicious patterns: card BIN country mismatch with billing address, transaction velocity exceeding N transactions in M minutes from the same card, or payment from a known fraudulent IP. ML-based scoring computes a fraud probability score per transaction using features like user history, transaction amount versus average, device fingerprint, and behavioral signals. Score above a threshold declines the transaction or triggers 3D Secure authentication for user verification. Feedback loop: confirmed fraud and chargebacks feed back into the ML model as negative labels to improve future predictions. Integrate with Stripe Radar or Sift for third-party ML-based fraud scoring as a complement to internal rules.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Idempotency key prevents double charges; double-entry ledger is immutable; DB transaction prevents double-spend; nightly reconciliation catches discrepancies.',
  mustKnow: [
    'Idempotency key: generate before first attempt, reuse on every retry — PSP deduplicates',
    'Double-entry: debit + credit in same DB transaction = atomic; sum of all entries = 0',
    'Pessimistic lock (SELECT FOR UPDATE) prevents concurrent double-spend',
    'Ledger is append-only — corrections via reversal entries, never UPDATE/DELETE',
    'Tokenise card data via PSP — never store raw card numbers (PCI DSS)',
    'Reconciliation: compare internal ledger vs PSP settlement report daily',
  ],
  interviewFocus: [
    'Idempotency key flow: generation → PSP call → cache result → duplicate returns cache',
    'Double-entry ledger invariant: every debit has a credit; SUM = 0',
    'How to prevent double-spend with DB transactions and row-level locking',
    'Why reconciliation is non-negotiable even with reliable PSPs',
  ],
};

@Component({
  selector: 'app-sysdesign-payment-system',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './payment-system.html',
  styleUrl: './payment-system.scss',
})
export class SysdesignPaymentSystem {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
