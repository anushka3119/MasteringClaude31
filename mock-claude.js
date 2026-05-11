#!/usr/bin/env node

// Mock Claude CLI for piping demonstration
const fs = require('fs');
const path = require('path');

function analyzeErrorLog(errorContent) {
  console.log('🤖 Claude analyzing error log...');

  // Simple analysis based on error content
  let incidentType = 'UNKNOWN';
  let analysis = '';

  if (errorContent.includes('Cannot find module')) {
    incidentType = 'NULL_DEREF';
    analysis = 'Module not found - likely a dependency or import issue';
  } else if (errorContent.includes('SyntaxError') || errorContent.includes('Unexpected token')) {
    incidentType = 'SYNTAX_ERROR';
    analysis = 'JavaScript syntax error detected';
  } else if (errorContent.includes('TypeError') || errorContent.includes('is not a function')) {
    incidentType = 'TYPE_MISMATCH';
    analysis = 'Type mismatch or incorrect function call';
  } else if (errorContent.includes('ReferenceError')) {
    incidentType = 'NULL_DEREF';
    analysis = 'Null or undefined reference access';
  }

  console.log(`📊 Analysis: ${analysis}`);
  console.log(`🏷️  Incident Type: ${incidentType}`);

  return { incidentType, analysis };
}

function updateIncidentStatus(status) {
  const logPath = path.join(__dirname, 'docs', 'incident-history.log');

  if (!fs.existsSync(logPath)) {
    console.log('❌ Incident log not found');
    return;
  }

  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n');

  // Find the last incident (lines starting with [timestamp])
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith('[') && lines[i].includes('INCIDENT:')) {
      const updatedLine = lines[i] + ` | STATUS: ${status}`;
      lines[i] = updatedLine;
      break;
    }
  }

  fs.writeFileSync(logPath, lines.join('\n'), 'utf-8');
  console.log(`✅ Updated incident status to: ${status}`);
}

// Read from stdin (piped input)
let input = '';
process.stdin.on('data', chunk => {
  input += chunk;
});

process.stdin.on('end', () => {
  if (!input.trim()) {
    console.log('❌ No error log provided via pipe');
    process.exit(1);
  }

  console.log('📄 Received error log:');
  console.log(input.trim());
  console.log('');

  const { incidentType, analysis } = analyzeErrorLog(input);

  // Update status to 'Investigating'
  updateIncidentStatus('Investigating');

  console.log('');
  console.log('🎯 Dashboard should now show status: Investigating');
  console.log('🔄 Refresh the dashboard at http://localhost:3000 to see the update');
});