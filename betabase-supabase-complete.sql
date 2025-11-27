-- Complete Betabase Schema for Supabase (public schema with betabase_ prefix)

-- Drop existing tables if they exist (to recreate with all columns)
DROP TABLE IF EXISTS betabase_test CASCADE;
DROP TABLE IF EXISTS betabase_scenario CASCADE;
DROP TABLE IF EXISTS betabase_deployment CASCADE;
DROP TABLE IF EXISTS betabase_cases CASCADE;
DROP TABLE IF EXISTS betabase_variation CASCADE;
DROP TABLE IF EXISTS betabase_round CASCADE;
DROP TABLE IF EXISTS betabase_user CASCADE;
DROP TABLE IF EXISTS betabase_application CASCADE;

-- Table: betabase_application
CREATE TABLE betabase_application (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    primary_color VARCHAR(255)
);

-- Table: betabase_user
CREATE TABLE betabase_user (
    id INTEGER PRIMARY KEY,
    username VARCHAR(180),
    username_canonical VARCHAR(180),
    email VARCHAR(180),
    email_canonical VARCHAR(180),
    enabled SMALLINT NOT NULL,
    salt VARCHAR(255),
    password VARCHAR(255),
    last_login VARCHAR(255),
    locked SMALLINT NOT NULL,
    expired SMALLINT NOT NULL,
    expires_at VARCHAR(255),
    confirmation_token VARCHAR(180),
    password_requested_at VARCHAR(255),
    roles TEXT NOT NULL,
    credentials_expired SMALLINT NOT NULL,
    credentials_expire_at VARCHAR(255),
    created_at VARCHAR(255),
    updated_at VARCHAR(255),
    f_name VARCHAR(255),
    l_name VARCHAR(255),
    jira_username VARCHAR(255),
    is_notified SMALLINT,
    mobile_phone VARCHAR(255),
    org VARCHAR(255)
);

-- Table: betabase_round
CREATE TABLE betabase_round (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    starts_at VARCHAR(255),
    ends_at VARCHAR(255),
    updated_at VARCHAR(255),
    release_num VARCHAR(255),
    app VARCHAR(255),
    notes TEXT,
    created_at VARCHAR(255),
    client_notes TEXT,
    current_flag SMALLINT,
    release_date VARCHAR(255)
);

-- Table: betabase_variation
CREATE TABLE betabase_variation (
    id INTEGER PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    variation_text TEXT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    created_at VARCHAR(255),
    updated_at VARCHAR(255)
);

-- Table: betabase_cases
CREATE TABLE betabase_cases (
    id INTEGER,
    app_under_test VARCHAR(5),
    name VARCHAR(254),
    script VARCHAR(1376),
    expected_result VARCHAR(462),
    tags VARCHAR(92),
    created_by VARCHAR(19),
    created_at VARCHAR(19),
    updated_by VARCHAR(19),
    updated_at VARCHAR(19),
    preconditions VARCHAR(590)
);

-- Table: betabase_deployment
CREATE TABLE betabase_deployment (
    id INTEGER PRIMARY KEY,
    build VARCHAR(255),
    branch VARCHAR(255),
    app_under_test VARCHAR(255),
    deployed_at VARCHAR(255),
    record_inserted_at VARCHAR(255)
);

-- Table: betabase_scenario (CORE TABLE - 8,449 rows)
CREATE TABLE betabase_scenario (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    script TEXT,
    expected_result TEXT,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    preconditions TEXT,
    created_at VARCHAR(255),
    updated_at VARCHAR(255),
    review_flag SMALLINT,
    flag_reason TEXT,
    app_under_test VARCHAR(255),
    tags VARCHAR(255),
    coverage VARCHAR(255),
    client_priority SMALLINT,
    mode VARCHAR(255),
    is_security SMALLINT,
    priority_sort_order INTEGER,
    enhancement_sort_order INTEGER,
    current_regression_sort_order INTEGER,
    reviewed_flag VARCHAR(255)
);

-- Table: betabase_test (CORE TABLE - 34,631 rows)
CREATE TABLE betabase_test (
    id INTEGER PRIMARY KEY,
    scenario_id INTEGER,
    created_at VARCHAR(255),
    comments TEXT,
    ticket VARCHAR(255),
    created_by VARCHAR(255),
    input TEXT,
    result TEXT,
    pass_fail VARCHAR(255),
    build VARCHAR(255),
    updated_at VARCHAR(255),
    updated_by VARCHAR(255),
    path VARCHAR(255),
    browser_name VARCHAR(255),
    browser_major VARCHAR(255),
    browser_minor VARCHAR(255),
    os_name VARCHAR(255),
    os_major VARCHAR(255),
    os_minor VARCHAR(255),
    deployment_stamp VARCHAR(255),
    in_prod VARCHAR(255)
);
