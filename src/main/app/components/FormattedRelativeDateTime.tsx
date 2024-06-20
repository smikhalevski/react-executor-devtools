import { ReactNode } from 'react';
import { useRerenderInterval } from 'react-hookers';

interface FormattedRelativeDateTime {
  timestamp: number;
}

export function FormattedRelativeDateTime(props: FormattedRelativeDateTime): ReactNode {
  useRerenderInterval(1000);

  return formatRelativeDateTime(props.timestamp);
}

const dayFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' });
const dateFormat = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' });

const DAY = 24 * 60 * 60_000;

export function formatRelativeDateTime(timestamp: number): string {
  const timeout = Math.abs(Date.now() - timestamp);

  return timeout < 7 * DAY ? formatTimeout(timeout) : formatDate(timestamp);
}

function formatTimeout(timeout: number): string {
  if (timeout > DAY) {
    return Math.floor(timeout / DAY) + '\u2009d';
  }

  if (timeout < 2 * 60_000) {
    return Math.floor(timeout / 1_000) + '\u2009s';
  }

  const h = Math.floor(timeout / (60 * 60_000));
  const m = Math.floor(timeout / 60_000 - h * 60);
  const s = Math.floor((timeout - h * 60 * 60_000 - m * 60_000) / 1_000);

  const ss = s < 10 ? '0' + s : s;

  return h === 0 ? m + ':' + ss : h + ':' + (m < 10 ? '0' + m : m) + ':' + ss;
}

function formatDate(timestamp: number): string {
  return Math.abs(Date.now() - timestamp) < 365 * DAY ? dayFormat.format(timestamp) : dateFormat.format(timestamp);
}
