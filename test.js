#!/usr/bin/env node

/**
 * Simple test script to validate core functionality
 */

const { isUnluckyNumber, findUnluckyNumbersInRange, loadConfig } = require('./main.js');

function test(description, condition) {
  console.log(`${condition ? '✓' : '✗'} ${description}`);
  if (!condition) {
    process.exit(1);
  }
}

console.log('Running Superstitious GitHub Action Tests...\n');

// Test isUnluckyNumber function
const defaultUnluckyNumbers = [7, 13, 666];

test('7 is unlucky', isUnluckyNumber(7, defaultUnluckyNumbers));
test('13 is unlucky', isUnluckyNumber(13, defaultUnluckyNumbers));
test('666 is unlucky', isUnluckyNumber(666, defaultUnluckyNumbers));
test('1337 is unlucky', isUnluckyNumber(1337, defaultUnluckyNumbers));

test('1 is not unlucky', !isUnluckyNumber(1, defaultUnluckyNumbers));
test('42 is not unlucky', !isUnluckyNumber(42, defaultUnluckyNumbers));
test('100 is not unlucky', !isUnluckyNumber(100, defaultUnluckyNumbers));

// Test findUnluckyNumbersInRange function
const range1 = findUnluckyNumbersInRange(1, 10, defaultUnluckyNumbers);
test('Range 1-10 contains only 7', range1.length === 1 && range1[0] === 7);

const range2 = findUnluckyNumbersInRange(10, 20, defaultUnluckyNumbers);
test('Range 10-20 contains only 13 and 17', range2.length === 2 && range2.includes(13) && range2.includes(17));

const range3 = findUnluckyNumbersInRange(70, 80, defaultUnluckyNumbers);
test('Range 70-80 contains 70-79', range3.length === 10 && range3.every(num => num >= 70 && num <= 79));

// Test config loading
try {
  const config = loadConfig('superstitious.yml');
  test('Config loads successfully', config !== null);
  test('Config has unlucky_numbers', Array.isArray(config.unlucky_numbers));
  test('Config has reservation_space', typeof config.reservation_space === 'number');
  test('Config unlucky_numbers includes 13', config.unlucky_numbers.includes(13));
} catch (error) {
  test('Config loading failed', false);
}

// Test config loading with non-existent file (should return defaults)
const defaultConfig = loadConfig('non-existent-file.yml');
test('Non-existent config returns defaults', defaultConfig !== null);
test('Default config has unlucky numbers', Array.isArray(defaultConfig.unlucky_numbers));

console.log('\n🎉 All tests passed!');
console.log('\nCore functionality validation complete.');
console.log('The action is ready to prevent unlucky numbers! 🔮');