#!/usr/bin/env node

/**
 * Lazy Install System for Happy Feet
 * Installs dependencies on-demand based on feature requirements
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = join(fileURLToPath(import.meta.url), '..');
const ROOT = join(__dirname);
const BACKEND = join(ROOT, 'backend');
const FRONTEND = join(ROOT, 'frontend');

const FEATURES = {
  backend: {
    name: 'Backend API Server',
    path: BACKEND,
    description: 'Express.js API with MongoDB, Redis, Auth, Email',
    dependencies: [
      'express', 'mongoose', 'ioredis', 'jsonwebtoken', 'bcryptjs', 'argon2',
      'cookie-parser', 'cors', 'helmet', 'compression', 'express-rate-limit',
      'joi', 'zod', 'pino', 'pino-pretty', 'dotenv', 'nodemailer',
      'google-auth-library', 'otplib'
    ],
    devDependencies: [
      'typescript', 'tsx', 'vitest', '@types/node', '@types/express',
      '@types/bcryptjs', '@types/cookie-parser', '@types/cors',
      '@types/compression', '@types/jsonwebtoken', '@types/joi',
      '@typescript-eslint/eslint-plugin', '@typescript-eslint/parser',
      'eslint', 'eslint-config-prettier', 'eslint-plugin-prettier'
    ]
  },
  frontend: {
    name: 'Frontend React App',
    path: FRONTEND,
    description: 'React 18 + Vite + Tailwind + React Query + Zustand',
    dependencies: [
      'react', 'react-dom', 'react-router-dom', '@tanstack/react-query',
      '@tanstack/react-query-devtools', 'axios', 'react-hook-form',
      '@hookform/resolvers', 'zod', 'zustand'
    ],
    devDependencies: [
      'typescript', 'vite', '@vitejs/plugin-react', 'vitest',
      '@types/react', '@types/react-dom', 'tailwindcss', 'postcss',
      'autoprefixer', '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser', 'eslint', 'eslint-config-prettier',
      'eslint-plugin-prettier', 'eslint-plugin-react-hooks',
      'eslint-plugin-react-refresh', 'vite-plugin-sri'
    ]
  },
  auth: {
    name: 'Authentication Module',
    path: BACKEND,
    description: 'JWT, OAuth, MFA, Email verification, Sessions',
    dependencies: [
      'jsonwebtoken', 'bcryptjs', 'argon2', 'otplib', 'google-auth-library',
      'nodemailer', 'cookie-parser'
    ],
    devDependencies: [
      '@types/bcryptjs', '@types/jsonwebtoken', '@types/otplib',
      '@types/nodemailer', '@types/cookie-parser'
    ]
  },
  database: {
    name: 'Database Layer',
    path: BACKEND,
    description: 'MongoDB with Mongoose, Redis caching',
    dependencies: ['mongoose', 'ioredis'],
    devDependencies: ['@types/node']
  },
  email: {
    name: 'Email Service',
    path: BACKEND,
    description: 'Nodemailer with templates',
    dependencies: ['nodemailer'],
    devDependencies: ['@types/nodemailer']
  },
  search: {
    name: 'Search Module',
    path: BACKEND,
    description: 'Full-text search capabilities',
    dependencies: [],
    devDependencies: []
  },
  payments: {
    name: 'Payments (Stripe)',
    path: BACKEND,
    description: 'Stripe integration for payments',
    dependencies: ['stripe'],
    devDependencies: ['@types/stripe']
  },
  testing: {
    name: 'Testing Suite',
    path: ROOT,
    description: 'Vitest for unit/integration tests',
    dependencies: [],
    devDependencies: ['vitest', '@vitest/coverage-v8']
  },
  linting: {
    name: 'Code Quality Tools',
    path: ROOT,
    description: 'ESLint, Prettier, TypeScript',
    dependencies: [],
    devDependencies: [
      'typescript', '@typescript-eslint/eslint-plugin',
      '@typescript-eslint/parser', 'eslint', 'eslint-config-prettier',
      'eslint-plugin-prettier'
    ]
  }
};

function printBanner() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    Happy Feet - Lazy Install                 ║
║         Install only what you need, when you need it         ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

function printFeatures() {
  console.log('\nAvailable Features:\n');
  Object.entries(FEATURES).forEach(([key, feature], index) => {
    console.log(`  ${index + 1}. ${feature.name}`);
    console.log(`     ${feature.description}`);
    console.log(`     Path: ${feature.path.replace(ROOT + '/', '')}`);
    console.log('');
  });
}

function checkInstalled(featureKey) {
  const feature = FEATURES[featureKey];
  const pkgPath = join(feature.path, 'package.json');
  if (!existsSync(pkgPath)) return false;
  
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const required = [...feature.dependencies, ...feature.devDependencies];
  
  return required.every(dep => allDeps[dep]);
}

function installFeature(featureKey, isDev = false) {
  const feature = FEATURES[featureKey];
  const deps = isDev ? feature.devDependencies : feature.dependencies;
  
  if (deps.length === 0) {
    console.log(`  No ${isDev ? 'dev' : ''}dependencies for ${feature.name}`);
    return;
  }
  
  console.log(`\n📦 Installing ${feature.name} ${isDev ? 'dev ' : ''}dependencies...`);
  console.log(`   ${deps.join(', ')}`);
  
  try {
    execSync(`npm install ${deps.join(' ')} ${isDev ? '-D' : ''}`, {
      cwd: feature.path,
      stdio: 'inherit'
    });
    console.log(`✅ ${feature.name} installed successfully!`);
  } catch (error) {
    console.error(`❌ Failed to install ${feature.name}:`, error.message);
    process.exit(1);
  }
}

function installWorkspace(workspace) {
  console.log(`\n📦 Installing ${workspace} workspace...`);
  try {
    execSync('npm install', { cwd: join(ROOT, workspace), stdio: 'inherit' });
    console.log(`✅ ${workspace} workspace installed!`);
  } catch (error) {
    console.error(`❌ Failed to install ${workspace}:`, error.message);
    process.exit(1);
  }
}

async function interactiveMode() {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const question = (prompt) => new Promise(resolve => rl.question(prompt, resolve));
  
  printFeatures();
  
  console.log('Options:');
  console.log('  a) Install all features');
  console.log('  b) Install backend workspace');
  console.log('  c) Install frontend workspace');
  console.log('  q) Quit\n');
  
  const choice = await question('Select option (a/b/c/q) or feature numbers (e.g., 1,3,5): ');
  rl.close();
  
  if (choice === 'q') {
    console.log('👋 Goodbye!');
    return;
  }
  
  if (choice === 'a') {
    console.log('\n🚀 Installing all features...\n');
    for (const key of Object.keys(FEATURES)) {
      installFeature(key);
      installFeature(key, true);
    }
    return;
  }
  
  if (choice === 'b') {
    installWorkspace('backend');
    return;
  }
  
  if (choice === 'c') {
    installWorkspace('frontend');
    return;
  }
  
  const selected = choice.split(',').map(s => s.trim()).filter(Boolean);
  for (const num of selected) {
    const index = parseInt(num) - 1;
    const keys = Object.keys(FEATURES);
    if (index >= 0 && index < keys.length) {
      installFeature(keys[index]);
      installFeature(keys[index], true);
    }
  }
}

function quickInstall(featureKeys) {
  for (const key of featureKeys) {
    if (FEATURES[key]) {
      installFeature(key);
      installFeature(key, true);
    } else {
      console.log(`⚠️  Unknown feature: ${key}`);
    }
  }
}

function showStatus() {
  console.log('\n📊 Installation Status:\n');
  Object.entries(FEATURES).forEach(([key, feature]) => {
    const installed = checkInstalled(key);
    console.log(`  ${installed ? '✅' : '⬜'} ${feature.name}`);
  });
  console.log('');
}

// Main
const args = process.argv.slice(2);

printBanner();

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node lazy-install.js [options] [features...]

Options:
  --help, -h     Show this help message
  --status, -s   Show installation status
  --interactive  Run in interactive mode (default if no args)
  --all          Install all features
  --backend      Install backend workspace
  --frontend     Install frontend workspace

Features:
  ${Object.keys(FEATURES).join(', ')}

Examples:
  node lazy-install.js                    # Interactive mode
  node lazy-install.js --status           # Show what's installed
  node lazy-install.js backend auth       # Install backend + auth
  node lazy-install.js --all              # Install everything
  node lazy-install.js --backend          # Install backend workspace
  `);
  process.exit(0);
}

if (args.includes('--status') || args.includes('-s')) {
  showStatus();
  process.exit(0);
}

if (args.includes('--all')) {
  console.log('\n🚀 Installing all features...\n');
  for (const key of Object.keys(FEATURES)) {
    installFeature(key);
    installFeature(key, true);
  }
  process.exit(0);
}

if (args.includes('--backend')) {
  installWorkspace('backend');
  process.exit(0);
}

if (args.includes('--frontend')) {
  installWorkspace('frontend');
  process.exit(0);
}

if (args.length > 0) {
  quickInstall(args);
} else {
  interactiveMode();
}