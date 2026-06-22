terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Local state, per project decision. The state file lives next to this
  # config (terraform.tfstate) and is gitignored.
}
