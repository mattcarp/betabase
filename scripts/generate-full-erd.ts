import fs from 'fs';
import path from 'path';

const SCHEMA_PATH = path.join(process.cwd(), 'betabase-supabase-schema.sql');
const OUTPUT_PATH = path.join(process.cwd(), 'betabase-full-erd.mmd');

function generateFullERD() {
    if (!fs.existsSync(SCHEMA_PATH)) {
        console.error(`Error: Schema file not found at ${SCHEMA_PATH}`);
        return;
    }

    const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
    
    let mermaid = 'erDiagram\n';
    
    // Store found tables to validate relationships later
    const foundTables = new Set<string>();
    const relationships: string[] = [];

    // 1. First Pass: Identify all tables
    const tableSections = schema.split(/CREATE TABLE IF NOT EXISTS/i);
    tableSections.shift(); 

    // Helper to extract table name
    const getTableName = (section: string) => {
        const lines = section.trim().split('\n');
        const match = lines[0].match(/"?(\w+)"?\s*\(/);
        return match ? match[1].toUpperCase() : null;
    };

    tableSections.forEach(section => {
        const name = getTableName(section);
        if (name) foundTables.add(name);
    });

    // 2. Second Pass: Build Diagram
    tableSections.forEach(section => {
        const tableName = getTableName(section);
        if (!tableName) return;

        let tableOutput = `    ${tableName} {\n`;
        
        // Extract columns block
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

            // Add to table definition
            // Mark Primary Key
            if (line.toUpperCase().includes('PRIMARY KEY')) {
                 tableOutput += `        ${colType} ${colName} PK\n`;
            } else {
                 tableOutput += `        ${colType} ${colName}\n`;
            }

            // INFER RELATIONSHIPS
            // Convention: explicit "_id" suffix (e.g., scenario_id -> SCENARIO)
            if (colName.endsWith('_id')) {
                const targetTable = colName.replace('_id', '').toUpperCase();
                if (foundTables.has(targetTable) && targetTable !== tableName) {
                    relationships.push(`    ${targetTable} ||--o{ ${tableName} : "has"`);
                }
            }
            
            // Special Case: "app" or "app_under_test" columns -> Application/Context
            // (Keeping this implicit logic as it's useful for you)
            if (colName === 'app' || colName === 'app_under_test') {
               // We won't draw lines to a virtual table here to keep it strict to the DB structure,
               // unless 'APPLICATION' table exists and matches.
            }
        });

        tableOutput += '    }\n\n';
        mermaid += tableOutput;
    });

    // Add inferred relationships
    mermaid += relationships.join('\n');

    fs.writeFileSync(OUTPUT_PATH, mermaid);
    console.log(`✅ Full ERD generated at: ${OUTPUT_PATH}`);
}

generateFullERD();
