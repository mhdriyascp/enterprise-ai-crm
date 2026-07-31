-- =============================================================================
-- Enterprise AI CRM — PostgreSQL Initialization
-- Creates all databases for the microservices
-- =============================================================================

-- Identity service database
CREATE DATABASE crm_identity;
GRANT ALL PRIVILEGES ON DATABASE crm_identity TO crm;

-- CRM service databases
CREATE DATABASE crm_customer;
GRANT ALL PRIVILEGES ON DATABASE crm_customer TO crm;

CREATE DATABASE crm_contact;
GRANT ALL PRIVILEGES ON DATABASE crm_contact TO crm;

CREATE DATABASE crm_lead;
GRANT ALL PRIVILEGES ON DATABASE crm_lead TO crm;

CREATE DATABASE crm_opportunity;
GRANT ALL PRIVILEGES ON DATABASE crm_opportunity TO crm;

CREATE DATABASE crm_sales;
GRANT ALL PRIVILEGES ON DATABASE crm_sales TO crm;

CREATE DATABASE crm_task;
GRANT ALL PRIVILEGES ON DATABASE crm_task TO crm;

CREATE DATABASE crm_calendar;
GRANT ALL PRIVILEGES ON DATABASE crm_calendar TO crm;

CREATE DATABASE crm_document;
GRANT ALL PRIVILEGES ON DATABASE crm_document TO crm;

CREATE DATABASE crm_workflow;
GRANT ALL PRIVILEGES ON DATABASE crm_workflow TO crm;

CREATE DATABASE crm_notification;
GRANT ALL PRIVILEGES ON DATABASE crm_notification TO crm;

CREATE DATABASE crm_reporting;
GRANT ALL PRIVILEGES ON DATABASE crm_reporting TO crm;

CREATE DATABASE crm_ai;
GRANT ALL PRIVILEGES ON DATABASE crm_ai TO crm;

CREATE DATABASE crm_integration;
GRANT ALL PRIVILEGES ON DATABASE crm_integration TO crm;

-- Keycloak database
CREATE DATABASE crm_keycloak;
GRANT ALL PRIVILEGES ON DATABASE crm_keycloak TO crm;

-- Organization service database
CREATE DATABASE crm_organization;
GRANT ALL PRIVILEGES ON DATABASE crm_organization TO crm;
