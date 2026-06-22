# The hosted zone already exists and is shared with non-SES records
# (www, elliott, github-pages challenges), so we only reference it.
data "aws_route53_zone" "mantock" {
  name         = "${var.domain}."
  private_zone = false
}

# DKIM verification: one CNAME per signing token ->
# <token>._domainkey.mantock.com -> <token>.dkim.amazonses.com
resource "aws_route53_record" "dkim" {
  for_each = toset(aws_sesv2_email_identity.mantock.dkim_signing_attributes[0].tokens)

  zone_id = data.aws_route53_zone.mantock.zone_id
  name    = "${each.value}._domainkey.${var.domain}"
  type    = "CNAME"
  ttl     = 1800
  records = ["${each.value}.dkim.amazonses.com"]
}

# Custom MAIL FROM MX record.
resource "aws_route53_record" "mail_from_mx" {
  zone_id = data.aws_route53_zone.mantock.zone_id
  name    = aws_sesv2_email_identity_mail_from_attributes.mantock.mail_from_domain
  type    = "MX"
  ttl     = 300
  records = ["10 feedback-smtp.${var.aws_region}.amazonses.com"]
}

# SPF record for the MAIL FROM domain.
resource "aws_route53_record" "mail_from_spf" {
  zone_id = data.aws_route53_zone.mantock.zone_id
  name    = aws_sesv2_email_identity_mail_from_attributes.mantock.mail_from_domain
  type    = "TXT"
  ttl     = 300
  records = ["v=spf1 include:amazonses.com ~all"]
}

# DMARC policy record.
resource "aws_route53_record" "dmarc" {
  zone_id = data.aws_route53_zone.mantock.zone_id
  name    = "_dmarc.${var.domain}"
  type    = "TXT"
  ttl     = 300
  records = ["v=DMARC1; p=none;"]
}
