# SORTS Audit Log

Append-only log of pre-commit-hook bypasses and other security-relevant
governance events. See [CONTRIBUTING.md](CONTRIBUTING.md) for when an
entry is required.

Each entry is one row in the table below plus, if useful, an `Incident
notes` block beneath it. Do **not** delete or rewrite past entries — if a
mistake was made, append a correction entry that references the original
commit SHA.

## Entry format

| Date (UTC) | Commit SHA | Author | Bypass type | Guard skipped | Reason | Remediation target |
|---|---|---|---|---|---|---|

`Bypass type` is one of:

- `--no-verify` — pre-commit hook skipped entirely.
- `partial-skip` — hook ran but one guard was disabled inline (rare;
  always requires a second commit to restore the guard).
- `governance` — non-bypass event recorded for the audit trail (e.g.,
  emergency program redeploy outside the documented redeploy window in
  `INCIDENT_RESPONSE.md` S3).

`Guard skipped` references the gate number from `CONTRIBUTING.md` §"What
the pre-commit hook checks" (1–5), or `governance` for non-bypass
events.

## Entries

| Date (UTC) | Commit SHA | Author | Bypass type | Guard skipped | Reason | Remediation target |
|---|---|---|---|---|---|---|
| _no entries yet_ | — | — | — | — | — | — |

---

## Incident notes

(Append longer narratives below this line, anchored to a row above by
date + SHA. Keep each block under 20 lines; longer post-mortems belong
in `docs/postmortems/<date>-<short-name>.md`.)

---

## Operator checklist when adding an entry

Before pushing the commit that contains the audit entry:

1. Confirm the commit SHA is the actual SHA you pushed. Use
   `git rev-parse HEAD` on the branch where the bypass happened, not
   the audit-log branch.
2. Open a GitHub issue tagged `audit-bypass` and link both the commit
   and this row.
3. If the bypass touched a privacy invariant, also flip its status in
   `docs/PRIVACY_REVIEW.md` from `clean` to `bypassed-pending-fix`.
4. Set a calendar reminder for the remediation target date.

If you find yourself adding more than one bypass entry in a 7-day
window, stop and re-read `docs/INCIDENT_RESPONSE.md` §"Closing
principles". Repeated bypasses are a process-failure signal.
