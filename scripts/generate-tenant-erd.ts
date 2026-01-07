import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = path.join(process.cwd(), 'betabase-supabase-schema.sql');
const OUTPUT_PATH = path.join(process.cwd(), 'betabase-multitenant-erd-generated.mmd');

function generateERD() {
    if (!fs.existsSync(SCHEMA_PATH)) {
        console.error(`Error: Schema file not found at ${SCHEMA_PATH}`);
        return;
    }

    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    
    let mermaid = 'erDiagram\n';
    mermaid += '    %% LOGICAL TENANT HIERARCHY\n';
    mermaid += '    ORGANIZATION {\n        string name PK\n    }\n';
    mermaid += '    DIVISION {\n        string name PK\n        string organization FK\n    }\n';
    mermaid += '    APP_UNDER_TEST {\n        string name PK\n        string division FK\n    }\n\n';

    // Simple parser instead of complex regex
    const tableSections = schema.split(/CREATE TABLE IF NOT EXISTS/i);
    tableSections.shift(); // Remove first empty/preamble section

    tableSections.forEach(section => {
        const lines = section.trim().split('\n');
        const firstLine = lines[0];
        const tableNameMatch = firstLine.match(/"?(\w+)"?\s*\(/);
        if (!tableNameMatch) return;

        const tableName = tableNameMatch[1].toUpperCase();
        let tableOutput = `    ${tableName} {\n`;
        let hasColumns = false;
        let hasOrg = false;
        let hasApp = false;

        // Find the end of the CREATE TABLE statement
        let columnsContent = '';
        let bracketCount = 1;
        const remainingText = section.substring(section.indexOf('(') + 1);
        
        for (let i = 0; i < remainingText.length; i++) {
            if (remainingText[i] === '(') bracketCount++;
            if (remainingText[i] === ')') bracketCount--;
            if (bracketCount === 0) {
                columnsContent = remainingText.substring(0, i);
                break;
            }
        }

        const columnLines = columnsContent.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('--'));

        columnLines.forEach(line => {
            const parts = line.split(/\s+/);
            if (parts.length < 2) return;

            const colName = parts[0].replace(/"/g, '').replace(/,$/, '');
            const colType = parts[1].replace(/,$/, '');
            
            const isOrg = colName.toLowerCase() === 'org';
            const isApp = colName.toLowerCase() === 'app_under_test' || colName.toLowerCase() === 'app';
            
            if (isOrg) hasOrg = true;
            if (isApp) hasApp = true;

            if (line.toUpperCase().includes('PRIMARY KEY') || isOrg || isApp) {
                tableOutput += `        ${colType} ${colName}\n`;
                hasColumns = true;
            }
        });

        tableOutput += '    }\n\n';

        if (hasColumns) {
            mermaid += tableOutput;
            if (hasOrg) mermaid += `    ORGANIZATION ||--o{ ${tableName} : "tenancy"\n`;
            if (hasApp) mermaid += `    APP_UNDER_TEST ||--o{ ${tableName} : "context"\n`;
        }
    });

    mermaid += '\n    ORGANIZATION ||--o{ DIVISION : "contains"\n';
    mermaid += '    DIVISION ||--o{ APP_UNDER_TEST : "contains"\n';

    fs.writeFileSync(OUTPUT_PATH, mermaid);
    console.log(`✅ Multi-tenant ERD generated at: ${OUTPUT_PATH}`);
}

generateERD();
