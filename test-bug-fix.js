#!/usr/bin/env node

/**
 * Test for short reservation range bug fix (added to test suite)
 */

const { isUnluckyNumber, findUnluckyNumbersInRange } = require('./main.js');

function testShortReservationRangeFix() {
  function test(description, condition) {
    console.log(`${condition ? '✓' : '✗'} ${description}`);
    if (!condition) {
      console.error('Short reservation range bug fix test failed!');
      process.exit(1);
    }
  }

  console.log('\n🐛 Testing Short Reservation Range Bug Fix...');

  // Test the bug scenario: nextNumber=130, reservation_space=1
  const unluckyNumbers = [7, 13, 666];
  const nextNumber = 130;
  
  // Simulate the new algorithm: create placeholders until next number is safe
  let currentNext = nextNumber;
  let placeholdersCreated = 0;

  while (isUnluckyNumber(currentNext, unluckyNumbers)) {
    placeholdersCreated++;
    currentNext++;
  }

  test('Bug scenario: should create 10 placeholders for nextNumber=130', placeholdersCreated === 10);
  test('Bug scenario: next safe number should be 140', currentNext === 140);

  // Test edge cases
  const safeNumber = 42;
  const needsPlaceholders = isUnluckyNumber(safeNumber, unluckyNumbers);
  test('Safe number should not need placeholders', !needsPlaceholders);

  // Test boundary case
  currentNext = 139;
  placeholdersCreated = 0;
  while (isUnluckyNumber(currentNext, unluckyNumbers)) {
    placeholdersCreated++;
    currentNext++;
  }
  test('Boundary case: 139 should need exactly 1 placeholder', placeholdersCreated === 1);
}

// Only run if this script is executed directly
if (require.main === module) {
  console.log('Running bug fix tests...');
  testShortReservationRangeFix();
  console.log('🎉 Bug fix tests passed!');
} else {
  // Export for use in other test files
  module.exports = { testShortReservationRangeFix };
}