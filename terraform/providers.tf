provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type        = string
  description = "AWS region."
  default     = "us-west-2"
}

variable "domain" {
  type        = string
  description = "Root domain used as the SES email identity."
  default     = "mantock.com"
}

variable "mail_from_domain" {
  type        = string
  description = "Custom MAIL FROM subdomain for the SES identity."
  default     = "mail.mantock.com"
}
