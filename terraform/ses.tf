# SES email identity for the root domain. DKIM uses SES "Easy DKIM"
# (AWS-managed RSA 2048-bit keys); the signing tokens are computed and
# exposed via dkim_signing_attributes[0].tokens for the Route53 records.
resource "aws_sesv2_email_identity" "mantock" {
  email_identity = var.domain

  dkim_signing_attributes {
    next_signing_key_length = "RSA_2048_BIT"
  }
}

# Custom MAIL FROM domain (mail.mantock.com). USE_DEFAULT_VALUE falls back to
# the amazonses.com MAIL FROM if the custom MX record can't be resolved.
resource "aws_sesv2_email_identity_mail_from_attributes" "mantock" {
  email_identity         = aws_sesv2_email_identity.mantock.email_identity
  mail_from_domain       = var.mail_from_domain
  behavior_on_mx_failure = "USE_DEFAULT_VALUE"
}
