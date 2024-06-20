import { formatRelativeDateTime } from '../main/app/components/FormattedRelativeDateTime';

Date.now = () => 1718535155698;

test('formatRelativeDateTime', () => {
  expect(formatRelativeDateTime(Date.now())).toBe('0\u2009s');
  expect(formatRelativeDateTime(Date.now() + 10_000)).toBe('10\u2009s');
  expect(formatRelativeDateTime(Date.now() + 60_000)).toBe('60\u2009s');
  expect(formatRelativeDateTime(Date.now() + 120_000)).toBe('2:00');
  expect(formatRelativeDateTime(Date.now() + 3 * 60_000 + 20 * 1_000)).toBe('3:20');
  expect(formatRelativeDateTime(Date.now() + 60 * 60_000)).toBe('1:00:00');
  expect(formatRelativeDateTime(Date.now() + 3 * 60 * 60_000 + 44 * 60_000 + 20 * 1_000)).toBe('3:44:20');
  expect(formatRelativeDateTime(Date.now() + 3 * 24 * 60 * 60_000)).toBe('3\u2009d');
  expect(formatRelativeDateTime(Date.now() + 300 * 24 * 60 * 60_000)).toBe('Apr 12');
  expect(formatRelativeDateTime(Date.now() + 600 * 24 * 60 * 60_000)).toBe('Feb 6, 2026');
});
