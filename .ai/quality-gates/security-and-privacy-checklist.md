# Quality Gate: Security & Privacy

- [ ] No secrets in client code, `NEXT_PUBLIC_*` values, or source control.
- [ ] Inputs are validated (server-side wherever submission is processed).
- [ ] Data collection is minimised to what the current phase needs.
- [ ] Consent text matches actual use of the data.
- [ ] Privacy documentation reflects reality (actual fields, actual processors).
- [ ] Sensitive data is not written to logs.
- [ ] Errors do not leak implementation detail.
- [ ] Minor-related flows are considered (parent/guardian requirement, no independent financial agreements).
- [ ] Payment or payout changes receive dedicated review — nothing rides in casually.
- [ ] Dependencies do not introduce obvious risk (unmaintained, excessive permissions, install scripts).
