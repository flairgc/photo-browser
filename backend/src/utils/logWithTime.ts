const startTime = process.hrtime.bigint();

export function logWithHrTime(...args: unknown[]): void {
  const diffNs = process.hrtime.bigint() - startTime;
  const diffMs = Number(diffNs) / 1e6;

  console.log(`[+${diffMs.toFixed(3)} ms]`, ...args);
}

export function logWithTime(...args: unknown[]): void {
  const now = new Date();

  const time =
    now.toLocaleTimeString('ru-RU', { hour12: false }) +
    '.' +
    now.getMilliseconds().toString().padStart(3, '0');

  console.log(`[${time}]`, ...args);
}