// Run with: npm test   (Node's built-in test runner, no extra dependencies)
const test = require('node:test');
const assert = require('node:assert/strict');
const R = require('../src/modules/orders/rules');

test('stages advance one at a time and stop at delivered', () => {
  assert.equal(R.nextStage('submitted'), 'accepted');
  assert.equal(R.nextStage('quality_check'), 'ready_for_collection');
  assert.equal(R.nextStage('delivered'), null);
  assert.equal(R.nextStage('not_a_stage'), null);  // used to return 'requested' (indexOf -1 + 1 = 0)
});

test('submission window uses campus time, not the server clock', () => {
  // 09:59 IST = 04:29 UTC; 10:00 IST = 04:30 UTC; 19:59 IST = 14:29 UTC; 20:00 IST = 14:30 UTC
  assert.equal(R.isWithinSubmissionWindow(new Date('2026-11-14T04:29:00Z'), 'Asia/Kolkata'), false);
  assert.equal(R.isWithinSubmissionWindow(new Date('2026-11-14T04:30:00Z'), 'Asia/Kolkata'), true);
  assert.equal(R.isWithinSubmissionWindow(new Date('2026-11-14T14:29:00Z'), 'Asia/Kolkata'), true);
  assert.equal(R.isWithinSubmissionWindow(new Date('2026-11-14T14:30:00Z'), 'Asia/Kolkata'), false);
  // 16:00 UTC is 21:30 IST: closed on campus even though a UTC server would read 16:00 (open)
  assert.equal(R.isWithinSubmissionWindow(new Date('2026-11-14T16:00:00Z'), 'Asia/Kolkata'), false);
});

test('daily caps: 10 large, 5 small, 15 total, counting earlier orders today', () => {
  assert.equal(R.dailyLimitError({ large: 0, small: 0 }, { large: 10, small: 5 }), null);
  assert.match(R.dailyLimitError({ large: 8, small: 0 }, { large: 3, small: 0 }), /max 10 large/);
  assert.match(R.dailyLimitError({ large: '0', small: '4' }, { large: 0, small: 2 }), /max 5 small/);  // pg returns strings
});

test('OTP is 6 digits and compared exactly', () => {
  for (let i = 0; i < 200; i++) assert.match(R.genOtp(), /^[1-9]\d{5}$/);
  assert.equal(R.otpMatches('123456', '123456'), true);
  assert.equal(R.otpMatches(123456, '123456'), true);
  assert.equal(R.otpMatches('123457', '123456'), false);
  assert.equal(R.otpMatches('12345', '123456'), false);
  assert.equal(R.otpMatches(undefined, '123456'), false);
  assert.equal(R.otpMatches('123456', null), false);
});
