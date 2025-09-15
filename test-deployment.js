#!/usr/bin/env node

/**
 * Deployment Readiness Test Script
 * Tests critical functionality before production deployment
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Vymix Deployment Readiness Tests\n');

const tests = [
  {
    name: 'TypeScript Compilation',
    command: 'npm run type-check',
    critical: true
  },
  {
    name: 'Linting (warnings allowed)',
    command: 'npm run lint',
    critical: false
  },
  {
    name: 'Unit Tests',
    command: 'npm test -- --watchAll=false',
    critical: true
  },
  {
    name: 'Build Test (Expo)',
    command: 'npx expo export --platform web --dev',
    critical: false
  }
];

async function runTest(test) {
  return new Promise((resolve) => {
    console.log(`⏳ Running: ${test.name}`);
    
    exec(test.command, (error, stdout, stderr) => {
      if (error && test.critical) {
        console.log(`❌ CRITICAL FAILURE: ${test.name}`);
        console.log(`Error: ${error.message}`);
        resolve({ success: false, critical: true, name: test.name });
      } else if (error && !test.critical) {
        console.log(`⚠️  Warning: ${test.name} (non-critical)`);
        resolve({ success: false, critical: false, name: test.name });
      } else {
        console.log(`✅ Passed: ${test.name}`);
        resolve({ success: true, critical: test.critical, name: test.name });
      }
    });
  });
}

async function checkRequiredFiles() {
  console.log('📁 Checking required files...');
  
  const requiredFiles = [
    'package.json',
    'app.json',
    'eas.json',
    'env.ts',
    'services/firebase.ts',
    'services/spotify.ts',
    'privacy-policy.html',
    'LICENSE'
  ];
  
  const missing = [];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, file))) {
      missing.push(file);
    }
  }
  
  if (missing.length === 0) {
    console.log('✅ All required files present');
    return true;
  } else {
    console.log(`❌ Missing files: ${missing.join(', ')}`);
    return false;
  }
}

async function checkEnvironmentSetup() {
  console.log('🔧 Checking environment setup...');
  
  try {
    const envContent = fs.readFileSync(path.join(__dirname, 'env.ts'), 'utf8');
    
    const requiredEnvVars = [
      'FIREBASE_API_KEY',
      'SPOTIFY_CLIENT_ID',
      'OPENAI_API_KEY',
      'GOOGLE_IOS_CLIENT_ID'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => 
      !envContent.includes(varName) || envContent.includes(`${varName}: undefined`)
    );
    
    if (missingVars.length === 0) {
      console.log('✅ Environment variables configured');
      return true;
    } else {
      console.log(`⚠️  Check these environment variables: ${missingVars.join(', ')}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Could not read env.ts file');
    return false;
  }
}

async function main() {
  let allPassed = true;
  let criticalFailures = 0;
  
  // Check files first
  const filesOk = await checkRequiredFiles();
  const envOk = await checkEnvironmentSetup();
  
  if (!filesOk) {
    criticalFailures++;
    allPassed = false;
  }
  
  console.log('\n🧪 Running automated tests...\n');
  
  // Run all tests
  for (const test of tests) {
    const result = await runTest(test);
    
    if (!result.success && result.critical) {
      criticalFailures++;
      allPassed = false;
    }
    
    console.log(''); // Empty line for readability
  }
  
  // Summary
  console.log('📊 Test Summary:');
  console.log('================');
  
  if (criticalFailures === 0) {
    console.log('🎉 ALL CRITICAL TESTS PASSED!');
    console.log('✅ Your app is ready for deployment');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Test manually with: npm start');
    console.log('2. Build for production: eas build --platform all');
    console.log('3. Submit to app stores: eas submit');
    
  } else {
    console.log(`❌ ${criticalFailures} critical failure(s) found`);
    console.log('🔧 Fix critical issues before deployment');
  }
  
  console.log('\n📱 Manual Testing Checklist:');
  console.log('- [ ] Authentication (Google/Apple)');
  console.log('- [ ] Spotify connection');
  console.log('- [ ] Playlist generation');
  console.log('- [ ] Error handling');
  console.log('- [ ] UI responsiveness');
  
  process.exit(criticalFailures > 0 ? 1 : 0);
}

main().catch(console.error);
