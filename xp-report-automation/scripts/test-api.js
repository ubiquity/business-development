#!/usr/bin/env node

/**
 * Test script for XP Report Automation API
 * 
 * Usage:
 *   node scripts/test-api.js <repoUrl> <email>
 * 
 * Example:
 *   node scripts/test-api.js https://github.com/ubiquity/pay.ubq.fi test@example.com
 */

const http = require('http');

const API_HOST = process.env.API_HOST || 'localhost';
const API_PORT = process.env.API_PORT || 3000;

const repoUrl = process.argv[2];
const email = process.argv[3];

if (!repoUrl || !email) {
  console.error('Usage: node test-api.js <repoUrl> <email>');
  console.error('Example: node test-api.js https://github.com/ubiquity/pay.ubq.fi test@example.com');
  process.exit(1);
}

const postData = JSON.stringify({
  repoUrl,
  email,
});

const options = {
  hostname: API_HOST,
  port: API_PORT,
  path: '/api/generate-xp-report',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log(`\n📊 Testing XP Report API`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Repository: ${repoUrl}`);
console.log(`Email: ${email}`);
console.log(`API: http://${API_HOST}:${API_PORT}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`Status: ${res.statusCode} ${res.statusMessage}`);
    console.log(`\nResponse:\n`);
    
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
      
      if (res.statusCode === 202) {
        console.log(`\n✅ Success! Report generation started.`);
        console.log(`📧 Check email "${email}" in ${json.estimatedTime}.`);
      } else if (res.statusCode === 403) {
        console.log(`\n⚠️  Organization already received a free report.`);
      } else if (res.statusCode >= 400) {
        console.log(`\n❌ Error: ${json.error || 'Unknown error'}`);
      }
    } catch (e) {
      console.log(data);
    }
    
    console.log();
  });
});

req.on('error', (e) => {
  console.error(`❌ Request failed: ${e.message}`);
  console.error(`\nMake sure the API is running:`);
  console.error(`  npm run dev`);
  console.error(`  or: docker-compose up\n`);
  process.exit(1);
});

req.write(postData);
req.end();
