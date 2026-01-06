const fs = require('fs');
const path = require('path');

const VIOLATIONS_FILE = path.join(process.cwd(), 'audit-results', 'mac-violations-detailed.json');

// Color map based on src/styles/mac-design-system.css
const COLOR_MAP = {
    '#26c6da': 'var(--mac-primary-blue-400)',
    '#00acc1': 'var(--mac-primary-blue-600)',
    '#00bcd4': 'var(--mac-accent-purple-400)',
    '#0097a7': 'var(--mac-accent-purple-600)',
    '#0c0c0c': 'var(--mac-surface-background)',
    '#141414': 'var(--mac-surface-elevated)',
    '#0a0a0a': 'var(--mac-surface-bg)',
    '#ffffff': 'var(--mac-text-primary)',
    '#fff': 'var(--mac-text-primary)',
    '#a3a3a3': 'var(--mac-text-secondary)',
    '#737373': 'var(--mac-text-muted)',
    '#666': 'var(--mac-text-muted)',
    '#888': 'var(--mac-text-muted)',
    '#e0e0e0': 'var(--mac-text-secondary)',
    '#ef4444': 'var(--mac-status-error-text)',
    '#fca5a5': 'var(--mac-tier3)',
    '#22c55e': 'var(--mac-status-connected-text)',
    '#10b981': 'var(--mac-success-green)',
    '#eab308': 'var(--mac-warning-yellow)',
    '#fde047': 'var(--mac-status-warning-text)',
    '#fdba74': 'var(--mac-status-error-text)',
    '#f87171': 'var(--mac-tier3)',
    '#dc2626': 'var(--mac-error-red)',
    '#f97316': 'var(--mac-status-error-border)',
    '#fbbf24': 'var(--mac-tier2)',
    '#fef2f2': 'var(--mac-tier3-bg)',
    '#1a1a2e': 'var(--mac-surface-background)',
    '#00d9ff': 'var(--mac-accent-purple-400)',
    '#000': 'var(--mac-surface-bg)',
    '#34d399': 'var(--mac-success-green)',
    '#b5c6e0': 'var(--mac-text-secondary)',
    '#00e5ff': 'var(--mac-accent-purple-400)',
    '#86efac': 'var(--mac-status-connected-text)',
    '#f59e0b': 'var(--mac-warning-yellow)',
    '#fcd34d': 'var(--mac-status-warning-text)',
    '#ff5f57': 'var(--mac-error-red)',
    '#001f3f': 'var(--mac-surface-background)'
};

function loadViolations() {
    if (!fs.existsSync(VIOLATIONS_FILE)) {
        console.error(`Violations file not found: ${VIOLATIONS_FILE}`);
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(VIOLATIONS_FILE, 'utf8'));
}

function processByLine(lines, violation) {
    const lineIndex = violation.line - 1;
    if (lineIndex < 0 || lineIndex >= lines.length) return false;

    let lineContent = lines[lineIndex];
    let modified = false;

    if (violation.type === 'hardcodedColors') {
         for (const [hex, variable] of Object.entries(COLOR_MAP)) {
            if (lineContent.toLowerCase().includes(hex.toLowerCase())) {
                const regex = new RegExp(hex, 'gi');
                lineContent = lineContent.replace(regex, variable);
                modified = true;
            }
        }
        // RGBA Replacements
        if (lineContent.includes('rgba')) {
             lineContent = lineContent.replace(/rgba\(255,\s*255,\s*255,\s*0\.05\)/g, 'var(--mac-state-hover)');
             lineContent = lineContent.replace(/rgba\(255,\s*255,\s*255,\s*0\.03\)/g, 'var(--mac-state-hover)');
             lineContent = lineContent.replace(/rgba\(255,\s*255,\s*255,\s*0\.08\)/g, 'var(--mac-utility-border)');
             lineContent = lineContent.replace(/rgba\(255,\s*255,\s*255,\s*0\.12\)/g, 'var(--mac-utility-border-elevated)');
             
             lineContent = lineContent.replace(/rgba\(0,\s*0,\s*0,\s*0\.1\)/g, 'var(--mac-utility-shadow)');
             lineContent = lineContent.replace(/rgba\(0,\s*0,\s*0,\s*0\.2\)/g, 'var(--mac-utility-shadow)');
             lineContent = lineContent.replace(/rgba\(0,\s*0,\s*0,\s*0\.7\)/g, 'var(--mac-utility-shadow)');
             lineContent = lineContent.replace(/rgba\(0,\s*0,\s*0,\s*0\.8\)/g, 'var(--mac-utility-shadow)');
             lineContent = lineContent.replace(/rgba\(0,\s*0,\s*0,\s*0\.95\)/g, 'var(--mac-surface-card)');
             
             lineContent = lineContent.replace(/rgba\(20,\s*20,\s*20,\s*0\.9\)/g, 'var(--mac-surface-card)');
             lineContent = lineContent.replace(/rgba\(20,\s*20,\s*20,\s*0\.7\)/g, 'var(--mac-surface-card)');
             
             lineContent = lineContent.replace(/rgba\(239,\s*68,\s*68,\s*0\.1\)/g, 'var(--mac-status-error-bg)');
             lineContent = lineContent.replace(/rgba\(239,\s*68,\s*68,\s*0\.2\)/g, 'var(--mac-status-error-border)');
             lineContent = lineContent.replace(/rgba\(239,\s*68,\s*68,\s*0\.5\)/g, 'var(--mac-status-error-border)');
             lineContent = lineContent.replace(/rgba\(239,\s*68,\s*68,\s*0\.9\)/g, 'var(--mac-error-red)');
             lineContent = lineContent.replace(/rgba\(239,\s*68,\s*68,\s*1\)/g, 'var(--mac-error-red)');
             
             lineContent = lineContent.replace(/rgba\(34,\s*197,\s*94,\s*0\.1\)/g, 'var(--mac-status-connected-bg)');
             lineContent = lineContent.replace(/rgba\(0,\s*217,\s*255,\s*0\.3\)/g, 'var(--mac-info-border)');
             lineContent = lineContent.replace(/rgba\(0,\s*217,\s*255,\s*0\.2\)/g, 'var(--mac-info-bg)');
             lineContent = lineContent.replace(/rgba\(14,\s*165,\s*233,\s*0\.5\)/g, 'var(--mac-sidebar-ring)'); // Approx blue
             lineContent = lineContent.replace(/rgba\(14,\s*165,\s*233,\s*0\.4\)/g, 'var(--mac-sidebar-ring)');
             lineContent = lineContent.replace(/rgba\(23,\s*23,\s*23,\s*0\.8\)/g, 'var(--mac-surface-card)');

             // New mappings
             lineContent = lineContent.replace(/rgba\(14,\s*165,\s*233,\s*0\.2\)/g, 'var(--mac-info-bg)');
             lineContent = lineContent.replace(/rgba\(16,\s*185,\s*129,\s*0\.2\)/g, 'var(--mac-status-connected-bg)');
             lineContent = lineContent.replace(/rgba\(16,\s*185,\s*129,\s*0\.5\)/g, 'var(--mac-status-connected-border)');
             lineContent = lineContent.replace(/rgba\(14,\s*165,\s*233,\s*0\.3\)/g, 'var(--mac-info-border)');
             lineContent = lineContent.replace(/rgba\(255,\s*255,\s*255,\s*0\.1\)/g, 'var(--mac-utility-border)');
             lineContent = lineContent.replace(/rgba\(10,\s*16,\s*32,\s*0\.93\)/g, 'var(--mac-surface-bg)');
             lineContent = lineContent.replace(/rgba\(255,\s*255,\s*255,\s*0\.15\)/g, 'var(--mac-utility-border-elevated)');
             lineContent = lineContent.replace(/rgba\(255,\s*255,\s*255,\s*0\.5\)/g, 'var(--mac-text-muted)');
             lineContent = lineContent.replace(/rgba\(255,\s*255,\s*255,\s*0\.8\)/g, 'var(--mac-text-secondary)');
             lineContent = lineContent.replace(/rgba\(0,\s*20,\s*40,\s*0\.8\)/g, 'var(--mac-utility-shadow)');
             lineContent = lineContent.replace(/rgba\(0,\s*255,\s*255,\s*0\.5\)/g, 'var(--mac-accent-purple-400)');
             lineContent = lineContent.replace(/rgba\(0,\s*255,\s*255,\s*0\.1\)/g, 'var(--mac-info-bg)');
             lineContent = lineContent.replace(/rgba\(0,\s*255,\s*255,\s*0\.6\)/g, 'var(--mac-accent-purple-400)');
             lineContent = lineContent.replace(/rgba\(0,\s*255,\s*255,\s*0\.3\)/g, 'var(--mac-info-border)');
             lineContent = lineContent.replace(/rgba\(0,\s*229,\s*255,\s*0\.4\)/g, 'var(--mac-info-border)');
             lineContent = lineContent.replace(/rgba\(199,\s*125,\s*255,\s*0\.3\)/g, 'var(--mac-tier3-border)'); // Purple/Pink
             lineContent = lineContent.replace(/rgba\(0,\s*255,\s*127,\s*0\.3\)/g, 'var(--mac-status-connected-border)');
             lineContent = lineContent.replace(/rgba\(255,\s*149,\s*0,\s*0\.3\)/g, 'var(--mac-status-warning-border)');
             lineContent = lineContent.replace(/rgba\(255,\s*255,\s*255,\s*0\.4\)/g, 'var(--mac-text-muted)');
             lineContent = lineContent.replace(/rgba\(255,\s*255,\s*255,\s*0\.6\)/g, 'var(--mac-text-secondary)');
             lineContent = lineContent.replace(/rgba\(255,\s*255,\s*255,\s*0\.7\)/g, 'var(--mac-text-primary)');
             lineContent = lineContent.replace(/rgba\(245,\s*158,\s*11,\s*0\.1\)/g, 'var(--mac-status-warning-bg)');
             lineContent = lineContent.replace(/rgba\(59,\s*130,\s*246,\s*0\.3\)/g, 'var(--mac-info-border)');
             lineContent = lineContent.replace(/rgba\(59,\s*130,\s*246,\s*0\.4\)/g, 'var(--mac-info-border)');
             lineContent = lineContent.replace(/rgba\(0,\s*60,\s*120,\s*0\.3\)/g, 'var(--mac-surface-elevated)');
             lineContent = lineContent.replace(/rgba\(59,\s*130,\s*246,\s*0\.1\)/g, 'var(--mac-info-bg)');
             lineContent = lineContent.replace(/rgba\(59,\s*130,\s*246,\s*0\.2\)/g, 'var(--mac-info-bg)');
             lineContent = lineContent.replace(/rgba\(0,\s*0,\s*0,\s*0\.37\)/g, 'var(--mac-utility-shadow)');
             lineContent = lineContent.replace(/rgba\(0,\s*255,\s*255,\s*0\.2\)/g, 'var(--mac-info-bg)');
             lineContent = lineContent.replace(/rgba\(0,\s*255,\s*255,\s*0\.4\)/g, 'var(--mac-info-border)');
             lineContent = lineContent.replace(/rgba\(0,\s*255,\s*255,\s*0\.8\)/g, 'var(--mac-accent-purple-400)');
             lineContent = lineContent.replace(/rgba\(255,\s*255,\s*255,\s*0\.85\)/g, 'var(--mac-surface-card)');
             lineContent = lineContent.replace(/rgba\(30,\s*30,\s*30,\s*0\.95\)/g, 'var(--mac-surface-elevated)');
             lineContent = lineContent.replace(/rgba\(255,\s*255,\s*255,\s*0\.95\)/g, 'var(--mac-surface-elevated)');
             lineContent = lineContent.replace(/rgba\(74,\s*158,\s*255,\s*0\.1\)/g, 'var(--mac-info-bg)');
             lineContent = lineContent.replace(/rgba\(0,\s*151,\s*167,\s*0\.1\)/g, 'var(--mac-purple-bg)');
             lineContent = lineContent.replace(/rgba\(0,\s*0,\s*0,\s*0\.5\)/g, 'var(--mac-utility-shadow)');
             lineContent = lineContent.replace(/rgba\(59,\s*130,\s*246,\s*0\.5\)/g, 'var(--mac-info-border)');
             
             if (lineContent !== lines[lineIndex]) modified = true;
        }
    } else if (violation.type === 'hardcodedSpacing') {
        const spacingRegex = /([0-9.]+)(px|rem)/g;
        let newLineContent = lineContent;
        newLineContent = newLineContent.replace(spacingRegex, (match, p1, p2) => {
             const val = parseFloat(p1);
             const unit = p2;
             
             // Convert to px
             const pxVal = unit === 'rem' ? val * 16 : val;
             
             // Ignore small values (<= 4px) to preserve borders/separators
             if (pxVal <= 4) return match;
             
             // Snap to nearest 8
             const snappedPx = Math.round(pxVal / 8) * 8;
             
             // If valid (non-zero), replace
             if (snappedPx > 0) {
                 if (unit === 'rem') {
                     return `${snappedPx / 16}rem`;
                 } else {
                     return `${snappedPx}px`;
                 }
             }
             
             return match;
        });
        
        if (newLineContent !== lineContent) {
            lineContent = newLineContent;
            modified = true;
        }
    } else if (violation.type === 'typography') {
        // Aggressive typography fix
        if (lineContent.includes('font-bold')) lineContent = lineContent.replace('font-bold', 'font-normal');
        if (lineContent.includes('font-semibold')) lineContent = lineContent.replace('font-semibold', 'font-normal');
        if (lineContent.includes('font-weight: 700')) lineContent = lineContent.replace('font-weight: 700', 'font-weight: 300');
        if (lineContent.includes('font-weight: 600')) lineContent = lineContent.replace('font-weight: 600', 'font-weight: 300');
        if (lineContent.includes('font-weight: 500')) lineContent = lineContent.replace('font-weight: 500', 'font-weight: 400');
        
        if (lineContent !== lines[lineIndex]) modified = true;
    }

    if (modified) {
        lines[lineIndex] = lineContent;
        return true;
    }
    return false;
}

function processFileContent(content, violation) {
    if (violation.type !== 'missingMACClasses') return content;

    // Use regex to find opening tags of Button/Input/button/input
    // Capture the tag name and the attributes part until the closing >
    // [\s\S]*? is non-greedy match for any character including newlines
    const componentRegex = /<(Button|button|Input|input)(\s|[\s\S]*?)>/g;

    return content.replace(componentRegex, (match, tag, attributes) => {
        // Determine correct class based on tag
        const isButton = tag.toLowerCase().includes('button');
        const isInput = tag.toLowerCase().includes('input');
        
        // Filter based on violation code to avoid applying wrong class if multiple violations exist?
        // Actually, the violation report is granular, but we are running this generally for the file.
        // If the file has "Button without mac-button", we should fix all Buttons.
        // If it has "Input without mac-input", fix Attributes.
        // Safe to apply both logic if applicable.
        
        let requiredClass = '';
        if (isButton) requiredClass = 'mac-button';
        if (isInput) requiredClass = 'mac-input';
        
        if (!requiredClass) return match;
        
        // Check if class already exists in the match
        if (match.includes(requiredClass)) return match;
        
        // Check for existing class attribute
        if (match.includes('className=')) {
            // Handle className="..."
            if (match.match(/className="[^"]*"/)) {
                return match.replace(/className="([^"]*)"/, `className="${requiredClass} $1"`);
            }
            // Handle className='...'
            if (match.match(/className='[^']*'/)) {
                return match.replace(/className='([^']*)'/, `className='${requiredClass} $1'`);
            }
            // Handle className={...} - particularly cn(...) or other expressions
            // We want to insert inside the first string if possible, or just append string concat?
            // "className={cn(" -> "className={cn("mac-button ", "
            if (match.includes('className={cn(')) {
                 return match.replace('className={cn(', `className={cn("${requiredClass}", `);
            }
            if (match.includes('className={')) {
                 // Generic expression, strict handling might be dangerous. 
                 // E.g. className={isActive ? 'a' : 'b'}
                 // Replacing it to className={`mac-button ${isActive ? 'a' : 'b'}`} is Hard with regex.
                 // Skip complex cases to avoid breakage, OR try a simple prepend if it looks like a template literal?
                 // For now, let's stick to the cn(...) optimization which is common in this codebase.
                 return match; 
            }
        } else {
            // No className, inject it after tag name
            return match.replace(tag, `${tag} className="${requiredClass}"`);
        }
        
        return match;
    });
}

function run() {
    console.log('Starting automated fixes...');
    const violationsData = loadViolations();

    const byFile = {};
    
     // Helper to push
    const add = (v, type) => {
        const file = v.file;
        if (!byFile[file]) byFile[file] = [];
        byFile[file].push({...v, type});
    };

    if (violationsData.hardcodedColors) violationsData.hardcodedColors.forEach(v => add(v, 'hardcodedColors'));
    if (violationsData.hardcodedSpacing) violationsData.hardcodedSpacing.forEach(v => add(v, 'hardcodedSpacing'));
    if (violationsData.missingMACClasses) violationsData.missingMACClasses.forEach(v => add(v, 'missingMACClasses'));
    if (violationsData.typography) violationsData.typography.forEach(v => add(v, 'typography'));

    for (const [filePath, violations] of Object.entries(byFile)) {
        const absolutePath = path.join(process.cwd(), filePath);
        if (!fs.existsSync(absolutePath)) continue;

        let content = fs.readFileSync(absolutePath, 'utf8');
        let lines = content.split('\n');
        let fileModified = false;
        
        // First pass: Line-based fixes (colors, spacing, typography)
        const lineViolations = violations.filter(v => v.line > 0);
        
        // Sort by line descending to avoid changing lines invalidating others?
        // Actually since we just replace text in lines, index order doesn't shift unless we add lines.
        // We aren't adding lines, just Modifying.
        
        if (lineViolations.length > 0) {
            // Process violations on the lines array
            // Optimization: Iterate lines once? No, iterate violations is fine unless huge file.
            
            lineViolations.forEach(v => {
                if (processByLine(lines, v)) {
                    fileModified = true;
                }
            });
            content = lines.join('\n'); // Reassemble for next pass
        }
        
        // Second pass: File-wide fixes (missing classes with line 0)
        const globalViolations = violations.filter(v => v.line === 0);
        if (globalViolations.length > 0) {
             const newContent = processFileContent(content, globalViolations[0]); // Just pass one representative, or iterate?
             // Since processFileContent scans all lines for component patterns, calling it once is enough if it checks for both Button and Input?
             // My processFileContent implementation iterates ALL lines and checks both conditions if needed.
             // But actually it checks based on the validation code passed.
             // Better: Pass all global violations to processFileContent?
             // Or just loop them.
             
             let currentContent = content;
             globalViolations.forEach(v => {
                 currentContent = processFileContent(currentContent, v);
             });
             
             if (currentContent !== content) {
                 content = currentContent;
                 fileModified = true;
             }
        }

        if (fileModified) {
            fs.writeFileSync(absolutePath, content, 'utf8');
            console.log(`Updated ${filePath}`);
        }
    }
    
    console.log('Automated fixes complete.');
}

run();
