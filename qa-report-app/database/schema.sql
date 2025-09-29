-- QA-Report-App PostgreSQL Schema
-- Firma → Projekt → Test-Suiten Hierarchie

-- User Management
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) CHECK (role IN ('admin', 'qa_tester', 'reviewer')) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    language_preference VARCHAR(3) DEFAULT 'DE' CHECK (language_preference IN ('DE', 'ENG'))
);

-- Companies/Firms
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    logo_url VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects under Companies
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_type VARCHAR(50) CHECK (template_type IN ('web_app_qa', 'mobile_app_qa', 'api_testing', 'custom')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test Suites (Categories)
CREATE TABLE test_suites (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT '📂',
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test Cases
CREATE TABLE test_cases (
    id SERIAL PRIMARY KEY,
    test_suite_id INTEGER REFERENCES test_suites(id) ON DELETE CASCADE,
    test_id VARCHAR(20) NOT NULL, -- AD0001, HB0002, etc.
    name VARCHAR(200) NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5), -- 1=Critical, 5=Low
    expected_result TEXT,
    is_predefined BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Test Results/Executions
CREATE TABLE test_results (
    id SERIAL PRIMARY KEY,
    test_case_id INTEGER REFERENCES test_cases(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('success', 'error', 'warning', 'skipped')) NOT NULL,
    notes TEXT,
    executed_by INTEGER REFERENCES users(id),
    execution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id UUID DEFAULT gen_random_uuid() -- For grouping test runs
);

-- Project Sharing (Multi-User Access)
CREATE TABLE project_users (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    access_level VARCHAR(20) CHECK (access_level IN ('owner', 'editor', 'viewer')) NOT NULL,
    granted_by INTEGER REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- Archived Reports
CREATE TABLE archived_reports (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    report_name VARCHAR(200) NOT NULL,
    report_data JSONB NOT NULL, -- Full test results snapshot
    report_type VARCHAR(50) CHECK (report_type IN ('all_tests', 'tested_only', 'failed_only')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Configuration
CREATE TABLE system_config (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_projects_company ON projects(company_id);
CREATE INDEX idx_test_suites_project ON test_suites(project_id);
CREATE INDEX idx_test_cases_suite ON test_cases(test_suite_id);
CREATE INDEX idx_test_results_case ON test_results(test_case_id);
CREATE INDEX idx_test_results_session ON test_results(session_id);
CREATE INDEX idx_project_users_project ON project_users(project_id);
CREATE INDEX idx_project_users_user ON project_users(user_id);

-- Initial Admin User (Password: admin123 - CHANGE IN PRODUCTION!)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
VALUES ('admin', 'admin@qa-report.local', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewvyNlWRG4aV6.ke', 'System', 'Administrator', 'admin');

-- Default System Configuration
INSERT INTO system_config (config_key, config_value) VALUES 
('app_version', '"1.0.0"'),
('default_language', '"DE"'),
('supported_languages', '["DE", "ENG"]'),
('export_formats', '["JSON", "CSV", "PDF"]'),
('project_templates', '{
    "web_app_qa": {
        "name": "Web Application QA",
        "suites": ["UI/UX Tests", "Functionality", "Performance", "Security", "Compatibility"]
    },
    "mobile_app_qa": {
        "name": "Mobile Application QA", 
        "suites": ["UI Tests", "Performance", "Device Compatibility", "Network Tests", "App Store Guidelines"]
    },
    "api_testing": {
        "name": "API Testing",
        "suites": ["Endpoint Tests", "Authentication", "Data Validation", "Error Handling", "Performance"]
    }
}');