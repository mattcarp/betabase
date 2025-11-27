-- ============================================================================
-- BETABASE DATABASE SCHEMA
-- ============================================================================
-- Restored from August 26, 2024 backup
-- Contains AOMA test management data
-- 8 core tables, 137 MB of data, 44,853 total rows
-- ============================================================================

-- ============================================================================
-- TABLE: application
-- Purpose: Applications under test
-- Rows: 10
-- ============================================================================
CREATE TABLE application (
    id                  INTEGER PRIMARY KEY,
    name                VARCHAR(255),
    primary_color       VARCHAR(255),

    CONSTRAINT application_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE application IS 'Applications being tested in the system';
COMMENT ON COLUMN application.id IS 'Unique application identifier';
COMMENT ON COLUMN application.name IS 'Application name';
COMMENT ON COLUMN application.primary_color IS 'Primary branding color for the application';


-- ============================================================================
-- TABLE: user
-- Purpose: System users (testers, admins)
-- Rows: 30
-- ============================================================================
CREATE TABLE "user" (
    id                      INTEGER PRIMARY KEY,
    username                VARCHAR(180),
    username_canonical      VARCHAR(180),
    email                   VARCHAR(180),
    email_canonical         VARCHAR(180),
    enabled                 SMALLINT NOT NULL,
    salt                    VARCHAR(255),
    password                VARCHAR(255),
    last_login              VARCHAR(255),
    locked                  SMALLINT NOT NULL,
    expired                 SMALLINT NOT NULL,
    expires_at              VARCHAR(255),
    confirmation_token      VARCHAR(180),
    password_requested_at   VARCHAR(255),
    roles                   TEXT NOT NULL,
    credentials_expired     SMALLINT NOT NULL,
    credentials_expire_at   VARCHAR(255),
    created_at              VARCHAR(255),
    updated_at              VARCHAR(255),
    f_name                  VARCHAR(255),
    l_name                  VARCHAR(255),
    jira_username           VARCHAR(255),
    is_notified             SMALLINT,
    mobile_phone            VARCHAR(255),
    org                     VARCHAR(255),

    CONSTRAINT user_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE "user" IS 'System users including testers and administrators';
COMMENT ON COLUMN "user".id IS 'Unique user identifier';
COMMENT ON COLUMN "user".username IS 'User login name';
COMMENT ON COLUMN "user".email IS 'User email address';
COMMENT ON COLUMN "user".enabled IS 'Whether user account is active';
COMMENT ON COLUMN "user".roles IS 'User permission roles (JSON array)';
COMMENT ON COLUMN "user".jira_username IS 'Associated Jira username for ticket integration';


-- ============================================================================
-- TABLE: round
-- Purpose: Test rounds/cycles (releases)
-- Rows: 154
-- ============================================================================
CREATE TABLE round (
    id                  INTEGER PRIMARY KEY,
    name                VARCHAR(255),
    starts_at           VARCHAR(255),
    ends_at             VARCHAR(255),
    updated_at          VARCHAR(255),
    release_num         VARCHAR(255),
    app                 VARCHAR(255),
    notes               TEXT,
    created_at          VARCHAR(255),
    client_notes        TEXT,
    current_flag        SMALLINT,
    release_date        VARCHAR(255),

    CONSTRAINT round_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE round IS 'Test rounds or release cycles';
COMMENT ON COLUMN round.id IS 'Unique round identifier';
COMMENT ON COLUMN round.name IS 'Round name/identifier';
COMMENT ON COLUMN round.release_num IS 'Release version number';
COMMENT ON COLUMN round.current_flag IS 'Flag indicating if this is the current active round';
COMMENT ON COLUMN round.notes IS 'Internal notes about this test round';
COMMENT ON COLUMN round.client_notes IS 'Client-facing notes about this release';


-- ============================================================================
-- TABLE: variation
-- Purpose: Test scenario variations
-- Rows: 67
-- ============================================================================
CREATE TABLE variation (
    id                  INTEGER PRIMARY KEY,
    scenario_id         TEXT NOT NULL,
    variation_text      TEXT,
    created_by          VARCHAR(255),
    updated_by          VARCHAR(255),
    created_at          VARCHAR(255),
    updated_at          VARCHAR(255),

    CONSTRAINT variation_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE variation IS 'Variations of test scenarios (different data sets, edge cases)';
COMMENT ON COLUMN variation.id IS 'Unique variation identifier';
COMMENT ON COLUMN variation.scenario_id IS 'Parent scenario ID this variation belongs to';
COMMENT ON COLUMN variation.variation_text IS 'Description of what varies in this test case';


-- ============================================================================
-- TABLE: cases
-- Purpose: Legacy test cases
-- Rows: 1,359
-- ============================================================================
CREATE TABLE cases (
    id                  INTEGER,
    app_under_test      VARCHAR(5),
    name                VARCHAR(254),
    script              VARCHAR(1376),
    expected_result     VARCHAR(462),
    tags                VARCHAR(92),
    created_by          VARCHAR(19),
    created_at          VARCHAR(19),
    updated_by          VARCHAR(19),
    updated_at          VARCHAR(19),
    preconditions       VARCHAR(590)
);

COMMENT ON TABLE cases IS 'Legacy test cases (older format, replaced by scenarios)';
COMMENT ON COLUMN cases.id IS 'Case identifier';
COMMENT ON COLUMN cases.app_under_test IS 'Application being tested';
COMMENT ON COLUMN cases.script IS 'Test steps/script';
COMMENT ON COLUMN cases.expected_result IS 'Expected outcome';
COMMENT ON COLUMN cases.preconditions IS 'Setup required before running test';


-- ============================================================================
-- TABLE: deployment
-- Purpose: Deployment tracking
-- Rows: 1,793
-- ============================================================================
CREATE TABLE deployment (
    id                      INTEGER PRIMARY KEY,
    build                   VARCHAR(255),
    branch                  VARCHAR(255),
    app_under_test          VARCHAR(255),
    deployed_at             VARCHAR(255),
    record_inserted_at      VARCHAR(255),

    CONSTRAINT deployment_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE deployment IS 'Deployment records for applications under test';
COMMENT ON COLUMN deployment.id IS 'Unique deployment identifier';
COMMENT ON COLUMN deployment.build IS 'Build number or identifier';
COMMENT ON COLUMN deployment.branch IS 'Git branch deployed';
COMMENT ON COLUMN deployment.app_under_test IS 'Application that was deployed';
COMMENT ON COLUMN deployment.deployed_at IS 'Timestamp of deployment';


-- ============================================================================
-- TABLE: scenario (★ CORE TABLE - 8,449 rows)
-- Purpose: Test scenarios - the main test case repository
-- Size: 42 MB
-- ============================================================================
CREATE TABLE scenario (
    id                              INTEGER PRIMARY KEY,
    name                            VARCHAR(255),
    script                          TEXT,
    expected_result                 TEXT,
    created_by                      VARCHAR(255),
    updated_by                      VARCHAR(255),
    preconditions                   TEXT,
    created_at                      VARCHAR(255),
    updated_at                      VARCHAR(255),
    review_flag                     SMALLINT,
    flag_reason                     TEXT,
    app_under_test                  VARCHAR(255),
    tags                            VARCHAR(255),
    coverage                        VARCHAR(255),
    client_priority                 SMALLINT,
    mode                            VARCHAR(255),
    is_security                     SMALLINT,
    priority_sort_order             INTEGER,
    enhancement_sort_order          INTEGER,
    current_regression_sort_order   INTEGER,
    reviewed_flag                   VARCHAR(255),

    CONSTRAINT scenario_pkey PRIMARY KEY (id)
);

COMMENT ON TABLE scenario IS '★ CORE: Test scenarios - primary test case repository with 8,449 test definitions';
COMMENT ON COLUMN scenario.id IS 'Unique scenario identifier';
COMMENT ON COLUMN scenario.name IS 'Test scenario name/title';
COMMENT ON COLUMN scenario.script IS 'Detailed test steps to execute';
COMMENT ON COLUMN scenario.expected_result IS 'Expected outcome when test passes';
COMMENT ON COLUMN scenario.preconditions IS 'Setup/prerequisites before running test';
COMMENT ON COLUMN scenario.app_under_test IS 'Application being tested';
COMMENT ON COLUMN scenario.tags IS 'Categorization tags for organization';
COMMENT ON COLUMN scenario.coverage IS 'Code coverage area';
COMMENT ON COLUMN scenario.client_priority IS 'Priority level set by client (1=highest)';
COMMENT ON COLUMN scenario.mode IS 'Test mode (regression, smoke, etc)';
COMMENT ON COLUMN scenario.is_security IS 'Flag indicating security-related test';
COMMENT ON COLUMN scenario.review_flag IS 'Flag indicating test needs review';
COMMENT ON COLUMN scenario.flag_reason IS 'Reason why test was flagged for review';


-- ============================================================================
-- TABLE: test (★ CORE TABLE - 34,631 rows)
-- Purpose: Test execution results - actual test runs
-- Size: 90 MB (largest table)
-- ============================================================================
CREATE TABLE test (
    id                      INTEGER PRIMARY KEY,
    scenario_id             INTEGER,
    created_at              VARCHAR(255),
    comments                TEXT,
    ticket                  VARCHAR(255),
    created_by              VARCHAR(255),
    input                   TEXT,
    result                  TEXT,
    pass_fail               VARCHAR(255),
    build                   VARCHAR(255),
    updated_at              VARCHAR(255),
    updated_by              VARCHAR(255),
    path                    VARCHAR(255),
    browser_name            VARCHAR(255),
    browser_major           VARCHAR(255),
    browser_minor           VARCHAR(255),
    os_name                 VARCHAR(255),
    os_major                VARCHAR(255),
    os_minor                VARCHAR(255),
    deployment_stamp        VARCHAR(255),
    in_prod                 VARCHAR(255),

    CONSTRAINT test_pkey PRIMARY KEY (id)
    -- Note: Foreign key relationship to scenario.id exists but not enforced
);

COMMENT ON TABLE test IS '★ CORE: Test execution results - 34,631 actual test runs with outcomes';
COMMENT ON COLUMN test.id IS 'Unique test execution identifier';
COMMENT ON COLUMN test.scenario_id IS 'Links to scenario table - which test case was run';
COMMENT ON COLUMN test.pass_fail IS 'Test result: PASS, FAIL, BLOCKED, SKIP';
COMMENT ON COLUMN test.input IS 'Actual input data used in this test run';
COMMENT ON COLUMN test.result IS 'Actual result observed';
COMMENT ON COLUMN test.comments IS 'Tester comments about this execution';
COMMENT ON COLUMN test.ticket IS 'Related Jira ticket number if bug found';
COMMENT ON COLUMN test.build IS 'Build number that was tested';
COMMENT ON COLUMN test.browser_name IS 'Browser used (Chrome, Firefox, Safari, etc)';
COMMENT ON COLUMN test.browser_major IS 'Browser major version';
COMMENT ON COLUMN test.os_name IS 'Operating system (Windows, macOS, Linux)';
COMMENT ON COLUMN test.deployment_stamp IS 'Deployment identifier this test ran against';
COMMENT ON COLUMN test.in_prod IS 'Flag indicating if this was production testing';


-- ============================================================================
-- RELATIONSHIPS (Inferred - not enforced with foreign keys)
-- ============================================================================

-- test.scenario_id -> scenario.id
--   One scenario can have many test executions
--   34,631 test runs reference 8,449 scenarios

-- variation.scenario_id -> scenario.id
--   One scenario can have multiple variations
--   67 variations extend the 8,449 scenarios


-- ============================================================================
-- INDEXES (Recommended for performance)
-- ============================================================================

-- Foreign key lookup indexes
CREATE INDEX idx_test_scenario_id ON test(scenario_id);
CREATE INDEX idx_variation_scenario_id ON variation(scenario_id);

-- Common query patterns
CREATE INDEX idx_test_pass_fail ON test(pass_fail);
CREATE INDEX idx_test_created_at ON test(created_at);
CREATE INDEX idx_scenario_app_under_test ON scenario(app_under_test);
CREATE INDEX idx_scenario_tags ON scenario(tags);
CREATE INDEX idx_test_build ON test(build);

-- User lookup
CREATE INDEX idx_user_username ON "user"(username);
CREATE INDEX idx_user_email ON "user"(email);


-- ============================================================================
-- STATISTICS
-- ============================================================================
-- Total Tables:        8
-- Total Rows:          44,853
-- Total Size:          137 MB
-- Largest Table:       test (90 MB, 34,631 rows)
-- Primary Tables:      scenario (test definitions), test (test results)
-- Relationship:        test -> scenario (many-to-one)
-- Date Range:          Data from August 26, 2024 backup
-- ============================================================================
