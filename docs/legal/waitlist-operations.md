# Waitlist privacy operations

Owner: Tobias Bohwalli. Contact: hi@futhr.io. Updated 6 September 2026.

This is the handling procedure for the four venture waitlists. Public notices
come from `apps/waitlist/src/lib/brands/privacy.ts`; the static showcase has its
own [privacy information](privacy.md). The procedure depends on the operator
monitoring requests and carrying out the scheduled work below. The repository
does not provision mailboxes, create reminders, or certify legal compliance.

## Receiving and verifying requests

Check the website inbox and contact mailbox every working day. The website
accepts requests at `/withdraw`; email is an alternative. Do not insist on a
particular subject line, template, reason for leaving, or postal letter. A valid
request received through another channel must also be handled. The website
must offer withdrawal alongside signup.
[EDPB consent guidance, paragraphs 113–116](https://www.edpb.europa.eu/sites/default/files/files/file1/edpb_guidelines_202005_consent_en.pdf)

The public form creates a pending request only when a matching subscription
exists. It gives the same conditional acknowledgement for unmatched addresses.
Duplicates preserve the original receipt time. A full inbox or database failure
returns an explicit failure with email as the alternative; do not treat that
response as a recorded request. No subscription is suspended or deleted by the
public form. A table match establishes membership, not the requester's authority.

An operator opens the request detail through the authenticated API and checks
whether the original subscription still exists. If it does, verify control of
the subscribed mailbox where there are reasonable identity doubts. A short,
manually sent reply challenge is sufficient for this low-data service in the
ordinary case. A matching From header alone can be spoofed. Do not routinely
ask for passports, addresses, signatures, or identification never collected
when joining. Record the reason for any additional verification.
[IMY identification guidance](https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/de-registrerades-rattigheter/identifiering/)

A sufficient reply, an already authenticated conversation, or equivalent
reliable mailbox evidence lets the operator approve removal. The API currently
records this attestation as `mailbox_reply`; it does not verify the mailbox
itself. Do not claim a signup secret or automatic verification is implemented.
Keep the evidence in a restricted case mailbox, using an opaque reference such
as `case-2026-001` in the API. Never put addresses or message text in that reference,
source control, issue trackers, application logs, or AI prompts.

## Completing a request

For website requests, resolve the pending request through the operator API.
Approval deletes only its original subscription ID, closes the request, and
writes an audit record in one transaction. A later re-subscription has a new
ID and survives. If the original record is already absent, establish that the
request is fulfilled without deleting the new record; record that fact in the
case evidence. Do not keep asking the person to prove control of data already
erased. Use the fulfilled outcome described in the API guide.

Email-only requests can be located in the existing brand-scoped subscription
list and deleted by ID after the same verification. Check every requested brand
when a person asks for removal from all lists. Acknowledge completion by replying
to the person, without exposing any other subscriptions or addresses. There is
no automatic email service in this application.

Respond without undue delay and normally within one calendar month of receipt;
this is a deadline, not a waiting period. Diary the original receipt date, not
an AI review date. Necessary extensions are exceptional and require an explanation
within the first month. Never silently close an unanswered identity check or
reset a deadline when a duplicate arrives. Escalate unresolved cases before the
deadline. Review pending requests before any launch contact or export.
[IMY rights and deadlines](https://www.imy.se/verksamhet/dataskydd/det-har-galler-enligt-gdpr/de-registrerades-rattigheter/)

Dismissal is limited to an evidenced duplicate or a request established not to
come from the person concerned. Preserve the reason in the case evidence.
An AI suspicion, a bot-like browser, or an authorized agent acting for someone
is not by itself evidence that the request is invalid. For any refusal of a
valid rights request, explain the reason and complaint route. Do not impose a
fee or blanket refusal policy based on expected abuse.
[GDPR Article 12](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng)

## Other rights

Handle access, correction, restriction, objections, and portability through
the same monitored mailbox and proportionate verification. Supply only the
person's own data in a readable electronic format. The API has no correction
or restriction endpoint: a verified operator must handle these cases in the
restricted administrative environment and record the action. Do not overwrite
consent dates or manufacture new consent when correcting an address. Do not
send updates or export data subject to a valid restriction.

## Retention schedule

These are chosen operating limits, not retention periods prescribed by GDPR.
`controller.ts` carries the values used in the public notice.

| Record | Limit and manual action |
| --- | --- |
| Subscription | Remove after the announced update, cancellation, withdrawal, or 12 months from joining, whichever is first. Review monthly and remove entries that would reach 12 months before the next review. |
| Pending withdrawal | Review every working day. Never expire unanswered requests just to clear the inbox. |
| Closed request and case correspondence | Delete within 90 days of closure. Review monthly and clear records due before the next review. |
| Audit record | Delete within 12 months. Review monthly and clear records due before the next review. |
| Recovery copies | Use D1 Time Travel only; no extra exports or backup services. On the intended Free plan its recovery window is seven days. |

Set the first review date and recurring reminders before collection opens.
Subscription removals use the audited admin API. For closed requests and old
audit rows, inspect the selected IDs and dates in the D1 administration console,
then delete only those reviewed records. Do not run an unrestricted table delete.
Record the review date, record counts, and next review date without subscriber
addresses. A documented unresolved complaint or legal obligation can justify
preserving the necessary case material until that reason ends.

Before restoring a database, isolate it from public use and contact/export jobs.
Use the restricted case record to reapply all removals since the recovery point
before serving it again. Otherwise a restore can revive withdrawn consent.
[D1 recovery window](https://developers.cloudflare.com/d1/reference/time-travel/)

## AI review and costs

The optional reviewer identity receives at most 50 pending metadata records per
page: request ID, brand, receipt time, status, join time, and whether the original
subscription remains. It receives no email, email digest, ciphertext, or case
correspondence. This metadata must still be treated as personal data.

Only an operator deliberately initiates an AI review. Public requests invoke
neither a model nor an email service. The reviewer cannot resolve requests,
read addresses, or delete subscriptions. Its suggestions are untrusted input;
they do not change deadlines or establish identity. Choose and assess the AI
processor and transfer arrangements before sending even this metadata outside
the service. A model API can charge for deliberate review calls.

Keep the Workers account and D1 on their Free plans for the intended absence
of usage overages. Quota exhaustion causes failures, not a paid upgrade under
the documented Free-plan behaviour. A paid website zone and a Workers account
plan are separate settings. No application rate limit is a billing cap on a
paid account. See [deployment controls](../architecture/cloudflare.md#cost-boundary).

## Before opening collection

Confirm the named controller and monitored mailbox, the Free account plan,
EU D1 jurisdiction, Cloudflare processing agreement and transfer arrangements,
Access policies and separate reviewer grants. Perform a complete test of receipt,
manual verification, resolution, and confirmation. Set the retention reminders
and ensure another arrangement covers the inbox during absence. Update the
notice before changing the purpose, controller, processors, or retention policy.
Joining alone does not verify mailbox ownership; do not treat bot submissions as
proof of someone else's consent or move the list into ongoing marketing by default.
