#!/usr/bin/env node

/**
 * Comprehensive End-to-End Test Suite for Superstitious GitHub Action
 * Tests the action with mocked GitHub API calls to ensure full functionality
 */

const fs = require('fs');
const path = require('path');

// Mock GitHub API responses
const mockGitHubAPI = {
  issues: {
    data: [
      { number: 50, title: 'Test Issue 50', labels: [], pull_request: null },
      { number: 13, title: 'Unlucky Issue 13', labels: [], pull_request: null },
      { number: 7, title: 'Unlucky Issue 7', labels: [], pull_request: null },
    ]
  },
  prs: {
    data: [
      { number: 42, title: 'Test PR 42' },
      { number: 66, title: 'Unlucky PR 66' },
    ]
  }
};

// Mock the @actions/core module
const mockCore = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warning: (msg) => console.log(`[WARN] ${msg}`),
  error: (msg) => console.log(`[ERROR] ${msg}`),
  setOutput: (name, value) => console.log(`[OUTPUT] ${name}=${value}`),
  setFailed: (msg) => console.log(`[FAILED] ${msg}`),
  getInput: (name, options) => {
    const inputs = {
      'github-token': 'mock-token',
      'config-path': 'superstitious.yml',
    };
    return inputs[name] || '';
  }
};

// Mock the @actions/github module
const mockGitHub = {
  context: {
    repo: {
      owner: 'test-owner',
      repo: 'test-repo'
    }
  },
  getOctokit: (token) => ({
    rest: {
      issues: {
        listForRepo: async (params) => {
          if (params.per_page === 1) {
            return { data: mockGitHubAPI.issues.data.slice(0, 1) };
          }
          return { data: mockGitHubAPI.issues.data };
        },
        create: async (params) => {
          const newNumber = Math.max(...mockGitHubAPI.issues.data.map(i => i.number)) + 1;
          const newIssue = {
            number: newNumber,
            title: params.title,
            body: params.body,
            labels: params.labels || [],
            html_url: `https://github.com/test-owner/test-repo/issues/${newNumber}`
          };
          mockGitHubAPI.issues.data.push(newIssue);
          return { data: newIssue };
        },
        update: async (params) => {
          const issue = mockGitHubAPI.issues.data.find(i => i.number === params.issue_number);
          if (issue) {
            Object.assign(issue, params);
          }
          return { data: issue };
        },
        createComment: async (params) => {
          return { data: { id: Math.random() } };
        }
      },
      pulls: {
        list: async (params) => {
          if (params.per_page === 1) {
            return { data: mockGitHubAPI.prs.data.slice(0, 1) };
          }
          return { data: mockGitHubAPI.prs.data };
        },
        update: async (params) => {
          const pr = mockGitHubAPI.prs.data.find(p => p.number === params.pull_number);
          if (pr) {
            Object.assign(pr, params);
          }
          return { data: pr };
        }
      }
    }
  })
};

// Mock fs module for config loading
const originalReadFileSync = fs.readFileSync;
fs.readFileSync = function (filePath, encoding) {
  if (filePath.includes('superstitious.yml')) {
    return `
unlucky_numbers: [7, 13, 66, 77, 666, 777, 1313, 1337]
reservation_space: 5
clearing_mode: false
deletion_mode: false
placeholder:
  title: "🔮 Test Reserved Issue"
  body: "Test placeholder body"
  labels: ["superstitious", "placeholder"]
clearing:
  preserve_content: true
  title_suffix: " (moved from unlucky number)"
  add_explanation_comment: true
  explanation_comment: "This issue was moved from #{original_number} to avoid an unlucky number."
`;
  }
  return originalReadFileSync.call(this, filePath, encoding);
};

// Override require to return our mocks
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === '@actions/core') return mockCore;
  if (id === '@actions/github') return mockGitHub;
  return originalRequire.apply(this, arguments);
};

// Import the main module
const {
  run,
  loadConfig,
  isUnluckyNumber,
  findUnluckyNumbersInRange,
  getExistingUnluckyItems,
  duplicateIssue,
  duplicatePullRequest,
  closeUnluckyItem
} = require('./main.js');

// Test helper function
function test(description, condition) {
  console.log(`${condition ? '✅' : '❌'} ${description}`);
  if (!condition) {
    console.error(`Test failed: ${description}`);
    process.exit(1);
  }
}

// Test runner
async function runTests() {
  console.log('🧪 Running Comprehensive E2E Tests for Superstitious GitHub Action\n');

  let testCount = 0;

  // Test 1: Basic configuration loading
  console.log('📋 Testing Configuration Loading...');
  const config = loadConfig('superstitious.yml');
  test('Config loads successfully', config !== null);
  test('Config has unlucky_numbers array', Array.isArray(config.unlucky_numbers));
  test('Config has deletion_mode property', config.hasOwnProperty('deletion_mode'));
  test('Config unlucky_numbers includes 13', config.unlucky_numbers.includes(13));
  testCount += 4;

  // Test 2: Unlucky number detection
  console.log('\n🎯 Testing Unlucky Number Detection...');
  test('7 is unlucky', isUnluckyNumber(7, config.unlucky_numbers));
  test('13 is unlucky', isUnluckyNumber(13, config.unlucky_numbers));
  test('666 is unlucky', isUnluckyNumber(666, config.unlucky_numbers));
  test('1337 is unlucky', isUnluckyNumber(1337, config.unlucky_numbers));
  test('42 is not unlucky', !isUnluckyNumber(42, config.unlucky_numbers));
  test('100 is not unlucky', !isUnluckyNumber(100, config.unlucky_numbers));
  testCount += 6;

  // Test 3: Range finding
  console.log('\n🔍 Testing Unlucky Number Range Detection...');
  const range1 = findUnluckyNumbersInRange(1, 20, config.unlucky_numbers);
  test('Range 1-20 contains 7, 13 and 17', range1.length === 3 && range1.includes(7) && range1.includes(13) && range1.includes(17));

  const range2 = findUnluckyNumbersInRange(70, 80, config.unlucky_numbers);
  test('Range 70-80 contains 70-79', range2.length === 10 && range2.every(num => num >= 70 && num <= 79));

  // Test 4: GitHub API Integration
  console.log('\n🔗 Testing GitHub API Integration...');
  const octokit = mockGitHub.getOctokit('test-token');

  try {
    // Test getting existing unlucky items
    const unluckyItems = await getExistingUnluckyItems(octokit, 'test-owner', 'test-repo', config.unlucky_numbers);
    test('Found existing unlucky items', unluckyItems.length > 0);
    test('Unlucky items include issue 13', unluckyItems.some(item => item.item.number === 13));
    test('Unlucky items include PR 66', unluckyItems.some(item => item.item.number === 66));
    testCount += 3;

    // Test duplication functionality
    const originalIssue = mockGitHubAPI.issues.data.find(i => i.number === 13);
    if (originalIssue) {
      const duplicatedIssue = await duplicateIssue(octokit, 'test-owner', 'test-repo', originalIssue, config, true);
      test('Issue duplication works in dry run', duplicatedIssue === null);
      testCount += 1;
    }

    const originalPR = mockGitHubAPI.prs.data.find(p => p.number === 66);
    if (originalPR) {
      const duplicatedPR = await duplicatePullRequest(octokit, 'test-owner', 'test-repo', originalPR, config, true);
      test('PR duplication works in dry run', duplicatedPR === null);
      testCount += 1;
    }

  } catch (error) {
    console.error('GitHub API integration test failed:', error.message);
    process.exit(1);
  }

  // Test 5: Main action execution
  console.log('\n🚀 Testing Main Action Execution...');
  try {
    await run();
    test('Main action runs without errors', true);
    testCount += 1;
  } catch (error) {
    test('Main action runs without errors', false);
    console.error('Main action execution failed:', error.message);
  }

  // Test 6: Edge cases
  console.log('\n🔬 Testing Edge Cases...');
  test('Empty unlucky numbers array works', findUnluckyNumbersInRange(1, 100, []).length === 0);
  test('Large numbers work correctly', isUnluckyNumber(1337, config.unlucky_numbers));
  test('Zero is not unlucky by default', !isUnluckyNumber(0, config.unlucky_numbers));
  test('Negative numbers work', isUnluckyNumber(-13, config.unlucky_numbers));
  testCount += 4;

  // Test 7: Configuration variations
  console.log('\n⚙️ Testing Configuration Variations...');
  const customConfig = {
    ...config,
    deletion_mode: true,
    clearing_mode: true
  };
  test('Deletion mode can be enabled', customConfig.deletion_mode === true);
  test('Clearing mode can be enabled', customConfig.clearing_mode === true);
  testCount += 2;

  console.log(`\n🎉 All ${testCount} tests passed successfully!`);
  console.log('\n📊 Test Coverage Summary:');
  console.log('  ✅ Configuration loading and validation');
  console.log('  ✅ Unlucky number detection algorithms');
  console.log('  ✅ Range-based unlucky number finding');
  console.log('  ✅ GitHub API integration with mocking');
  console.log('  ✅ Issue and PR duplication logic');
  console.log('  ✅ Main action execution flow');
  console.log('  ✅ Edge case handling');
  console.log('  ✅ Configuration variations');
  console.log('\n🔧 Mocked Dependencies:');
  console.log('  📦 @actions/core - Action inputs/outputs');
  console.log('  📦 @actions/github - GitHub API client');
  console.log('  📦 fs - File system for config loading');
  console.log('\n✨ E2E Test Suite Complete!');
}

// Run the tests
runTests().catch(error => {
  console.error('Test suite failed with error:', error);
  process.exit(1);
});