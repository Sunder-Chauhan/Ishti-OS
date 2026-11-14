const fs = require('fs');

const sql = fs.readFileSync('supabase/migrations/20261114000000_initial_schema.sql', 'utf8');

console.log('=== MIGRATION AUDIT REPORT ===');
console.log('Length (bytes):', sql.length);
console.log('Total lines:', sql.split('\n').length);

// Extensions
const extensions = [...sql.matchAll(/CREATE EXTENSION IF NOT EXISTS\s+"?([^"\s;]+)"?/gi)].map(m => m[1]);
console.log('\n--- EXTENSIONS (' + extensions.length + ') ---');
extensions.forEach(e => console.log('  -', e));

// Tables
const tables = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+([^\s(]+)/gi)].map(m => m[1]);
console.log('\n--- TABLES CREATED (' + tables.length + ') ---');
tables.forEach(t => console.log('  -', t));

// RLS
const rlsTables = [...sql.matchAll(/ALTER TABLE\s+([^\s]+)\s+ENABLE ROW LEVEL SECURITY/gi)].map(m => m[1]);
console.log('\n--- RLS ENABLED TABLES (' + rlsTables.length + ') ---');
rlsTables.forEach(t => console.log('  -', t));

// Functions
const functions = [...sql.matchAll(/CREATE OR REPLACE FUNCTION\s+([^\s(]+)/gi)].map(m => m[1]);
console.log('\n--- FUNCTIONS CREATED (' + functions.length + ') ---');
functions.forEach(f => console.log('  -', f));

// Triggers
const triggers = [...sql.matchAll(/CREATE TRIGGER\s+([^\s]+)\s+([\s\S]*?)ON\s+([^\s]+)/gi)].map(m => `${m[1]} ON ${m[3]}`);
console.log('\n--- TRIGGERS CREATED (' + triggers.length + ') ---');
triggers.forEach(t => console.log('  -', t));

// Policies
const policies = [...sql.matchAll(/CREATE POLICY\s+"([^"]+)"\s+ON\s+([^\s]+)/gi)].map(m => `"${m[1]}" ON ${m[2]}`);
console.log('\n--- POLICIES DEFINED (' + policies.length + ') ---');
policies.forEach(p => console.log('  -', p));

// Privileges (Revoke / Grant)
const grants = [...sql.matchAll(/(GRANT|REVOKE)\s+([\s\S]*?);/gi)].map(m => m[0].replace(/\s+/g, ' ').slice(0, 100));
console.log('\n--- PERMISSIONS / PRIVILEGES (' + grants.length + ' statements) ---');
grants.forEach(g => console.log('  -', g));

// Seed Data
const inserts = [...sql.matchAll(/INSERT INTO\s+([^\s(]+)/gi)].map(m => m[1]);
console.log('\n--- INSERTS / SEED DATA (' + inserts.length + ') ---');
inserts.forEach(i => console.log('  -', i));
