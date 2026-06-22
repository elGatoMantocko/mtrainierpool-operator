# mantock.com SES infra

Manages the AWS side of email sending for the pool notifier: the SES email
identity for `mantock.com` and its supporting Route53 DNS records.

## What's managed

- `aws_sesv2_email_identity.mantock` SES domain identity with Easy DKIM (RSA 2048-bit).
- `aws_sesv2_email_identity_mail_from_attributes.mantock` custom MAIL FROM (`mail.mantock.com`).
- `aws_route53_record.dkim` 3 DKIM verification CNAMEs (one per signing token).
- `aws_route53_record.mail_from_mx` / `mail_from_spf` MAIL FROM MX + SPF records.
- `aws_route53_record.dmarc` `_dmarc.mantock.com` policy record.

The `mantock.com` hosted zone itself is **not** managed (it holds unrelated
records like `www` and GitHub Pages); it's referenced via a `data` source.

## State

Local state (`terraform.tfstate`), gitignored. Single-operator setup. The
provider lock file (`.terraform.lock.hcl`) is committed for reproducible
provider versions.

## Credentials

The AWS provider uses the standard AWS SDK credential chain (it does **not**
call the AWS CLI). Provide credentials via the `[default]` profile in
`~/.aws/credentials`, or via `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
environment variables. Region defaults to `us-west-2`.
