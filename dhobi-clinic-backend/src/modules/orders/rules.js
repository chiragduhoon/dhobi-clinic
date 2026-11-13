// Pure workflow + Bennett operational rules (no database), so they can be unit-tested.
const crypto = require('crypto');

const STAGES = ['requested', 'submitted', 'accepted', 'sorting', 'washing',
  'drying', 'ironing', 'quality_check', 'ready_for_collection', 'delivered'];

const SUBMIT_OPEN_HOUR = Number(process.env.LAUNDRY_OPEN_HOUR ?? 10);   // 10:00
const SUBMIT_CLOSE_HOUR = Number(process.env.LAUNDRY_CLOSE_HOUR ?? 20); // 20:00
// The window is in campus time, not the server's clock: a cloud server usually runs in UTC,
// which would shift 10:00–20:00 IST to 15:30–01:30 IST.
const CAMPUS_TIMEZONE = process.env.LAUNDRY_TIMEZONE || 'Asia/Kolkata';
const MAX_LARGE = 10, MAX_SMALL = 5, MAX_TOTAL = 15;

function nextStage(current) {
  const i = STAGES.indexOf(current);
  return i === -1 ? null : STAGES[i + 1] || null;
}

function campusHour(date = new Date(), timeZone = CAMPUS_TIMEZONE) {
  const h = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone }).format(date);
  return Number(h);
}

function isWithinSubmissionWindow(date = new Date(), timeZone = CAMPUS_TIMEZONE) {
  const hour = campusHour(date, timeZone);
  return hour >= SUBMIT_OPEN_HOUR && hour < SUBMIT_CLOSE_HOUR;
}

/** Returns an error message if today's garments plus this order exceed the daily caps, else null. */
function dailyLimitError(already, adding) {
  const large = Number(already.large) + adding.large;
  const small = Number(already.small) + adding.small;
  if (large > MAX_LARGE) return `Daily limit exceeded: max ${MAX_LARGE} large garments per day (you have ${already.large} already today).`;
  if (small > MAX_SMALL) return `Daily limit exceeded: max ${MAX_SMALL} small garments per day (you have ${already.small} already today).`;
  if (large + small > MAX_TOTAL) return `Daily limit exceeded: max ${MAX_TOTAL} garments per day.`;
  return null;
}

/** 6-digit collection OTP from a cryptographically secure source (Math.random is predictable). */
function genOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

/** Constant-time OTP comparison. */
function otpMatches(given, expected) {
  if (given == null || expected == null) return false;
  const a = Buffer.from(String(given));
  const b = Buffer.from(String(expected));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = {
  STAGES, SUBMIT_OPEN_HOUR, SUBMIT_CLOSE_HOUR, CAMPUS_TIMEZONE, MAX_LARGE, MAX_SMALL, MAX_TOTAL,
  nextStage, campusHour, isWithinSubmissionWindow, dailyLimitError, genOtp, otpMatches,
};
