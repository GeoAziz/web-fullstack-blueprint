terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Cloud backend configuration
  cloud {
    organization = "ai-blueprint"
    
    workspaces {
      name = "ai-web-fullstack"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "AI Web Full-Stack Blueprint"
      Environment = var.environment
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
  
  name             = var.project_name
  environment      = var.environment
  vpc_cidr         = var.vpc_cidr
  availability_zones = var.availability_zones
  
  tags = var.tags
}

# RDS Database
module "rds" {
  source = "./modules/rds"
  
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  database_name        = var.database_name
  username             = var.db_username
  password             = var.db_password
  
  vpc_id               = module.vpc.vpc_id
  db_subnet_ids        = module.vpc.db_subnet_ids
  
  environment          = var.environment
  
  tags = var.tags
}

# ECS Cluster for Containers
module "ecs" {
  source = "./modules/ecs"
  
  cluster_name    = "${var.project_name}-cluster"
  environment     = var.environment
  
  vpc_id          = module.vpc.vpc_id
  app_subnet_ids  = module.vpc.app_subnet_ids
  
  tags = var.tags
}

# ECS Frontend Service
module "frontend_service" {
  source = "./modules/ecs-service"
  
  cluster_id      = module.ecs.cluster_id
  service_name    = "${var.project_name}-frontend"
  
  image           = var.frontend_image
  image_tag       = var.frontend_image_tag
  
  container_port  = 3000
  host_port       = 80
  
  memory          = 512
  cpu             = 256
  desired_count   = var.frontend_desired_count
  
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.app_subnet_ids
  
  environment_variables = {
    NEXT_PUBLIC_API_URL = "https://${var.domain_name}/api"
    NODE_ENV            = var.environment
  }
  
  tags = var.tags
}

# ECS Backend Service
module "backend_service" {
  source = "./modules/ecs-service"
  
  cluster_id      = module.ecs.cluster_id
  service_name    = "${var.project_name}-backend"
  
  image           = var.backend_image
  image_tag       = var.backend_image_tag
  
  container_port  = 3001
  host_port       = 3001
  
  memory          = 1024
  cpu             = 512
  desired_count   = var.backend_desired_count
  
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.app_subnet_ids
  
  environment_variables = {
    DATABASE_URL = "postgresql://${var.db_username}:${var.db_password}@${module.rds.endpoint}:5432/${var.database_name}"
    NODE_ENV     = var.environment
    JWT_SECRET   = var.jwt_secret
  }
  
  secrets = {
    DB_PASSWORD = var.db_password
    JWT_SECRET  = var.jwt_secret
  }
  
  tags = var.tags
}

# CloudFront CDN
module "cloudfront" {
  source = "./modules/cloudfront"
  
  distribution_name = "${var.project_name}-cdn"
  
  frontend_domain = module.frontend_service.domain_name
  backend_domain  = module.backend_service.domain_name
  
  domain_name            = var.domain_name
  certificate_arn        = var.certificate_arn
  
  cache_policy_id        = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  origin_request_policy  = "216adef5-5c7f-47e4-b989-5492eafa07d3"
  
  compress               = true
  http_version          = "http2and3"
  
  tags = var.tags
}

# CloudWatch Monitoring
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name    = var.project_name
  environment     = var.environment
  
  # ECS cluster metrics
  ecs_cluster_name = module.ecs.cluster_name
  
  # Database metrics
  rds_db_instance_id = module.rds.instance_id
  
  # CloudFront metrics
  distribution_id = module.cloudfront.distribution_id
  
  # Alarms
  alarm_email = var.alarm_email
  
  tags = var.tags
}

# Outputs
output "frontend_url" {
  value       = "https://${var.domain_name}"
  description = "Frontend application URL"
}

output "backend_url" {
  value       = "https://${var.domain_name}/api"
  description = "Backend API URL"
}

output "database_endpoint" {
  value       = module.rds.endpoint
  sensitive   = true
  description = "RDS database endpoint"
}

output "cloudfront_domain" {
  value       = module.cloudfront.domain_name
  description = "CloudFront distribution domain"
}
