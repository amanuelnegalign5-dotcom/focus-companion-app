import test from 'node:test';
import assert from 'node:assert/strict';
import {
  gregorianToEthiopian, ethiopianToGregorian, gregorianToJdn,
  ethiopianToJdn, jdnToEthiopian, isEthiopianLeapYear, daysInEthiopianMonth
} from '../calendar.js';

test('Ethiopian New Year reference dates', () => {
  assert.deepEqual(gregorianToEthiopian(2023, 9, 12), {year:2016, month:1, day:1});
  assert.deepEqual(gregorianToEthiopian(2026, 9, 11), {year:2019, month:1, day:1});
});

test('current-era reference date converts correctly', () => {
  assert.deepEqual(gregorianToEthiopian(2026, 10, 16), {year:2019, month:2, day:6});
});

test('Ethiopian conversion round-trips dates around year transitions', () => {
  const samples = [
    {year:2015,month:13,day:6}, {year:2016,month:1,day:1},
    {year:2016,month:13,day:5}, {year:2019,month:2,day:6},
    {year:2000,month:1,day:1}, {year:2011,month:8,day:30}
  ];
  for (const sample of samples) {
    const greg = ethiopianToGregorian(sample.year,sample.month,sample.day);
    assert.deepEqual(gregorianToEthiopian(greg.year,greg.month,greg.day),sample);
  }
});

test('Pagume has five or six days according to Ethiopian leap-year rule', () => {
  assert.equal(isEthiopianLeapYear(2015),true);
  assert.equal(daysInEthiopianMonth(2015,13),6);
  assert.equal(isEthiopianLeapYear(2016),false);
  assert.equal(daysInEthiopianMonth(2016,13),5);
  assert.throws(()=>ethiopianToJdn(2016,13,6),RangeError);
});

test('Gregorian invalid dates and Ethiopian invalid dates are rejected', () => {
  assert.throws(()=>gregorianToJdn(2025,2,29),RangeError);
  assert.throws(()=>ethiopianToJdn(2016,14,1),RangeError);
  assert.throws(()=>ethiopianToJdn(2016,2,31),RangeError);
});

test('JDN conversions are consistent', () => {
  assert.deepEqual(jdnToEthiopian(ethiopianToJdn(2015,13,6)), {year:2015,month:13,day:6});
});
