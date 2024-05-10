const table: string[] = [];

for (let i = 0; i < 256; ++i) {
  table.push(i.toString(16).padStart(2, '0'));
}

/**
 * https://stackoverflow.com/questions/105034/how-do-i-create-a-guid-uuid/21963136#21963136
 */
export function uuid(): string {
  const d0 = (Math.random() * 0xffffffff) | 0;
  const d1 = (Math.random() * 0xffffffff) | 0;
  const d2 = (Math.random() * 0xffffffff) | 0;
  const d3 = (Math.random() * 0xffffffff) | 0;

  return (
    table[d0 & 0xff] +
    table[(d0 >> 8) & 0xff] +
    table[(d0 >> 16) & 0xff] +
    table[(d0 >> 24) & 0xff] +
    '-' +
    table[d1 & 0xff] +
    table[(d1 >> 8) & 0xff] +
    '-' +
    table[((d1 >> 16) & 0x0f) | 0x40] +
    table[(d1 >> 24) & 0xff] +
    '-' +
    table[(d2 & 0x3f) | 0x80] +
    table[(d2 >> 8) & 0xff] +
    '-' +
    table[(d2 >> 16) & 0xff] +
    table[(d2 >> 24) & 0xff] +
    table[d3 & 0xff] +
    table[(d3 >> 8) & 0xff] +
    table[(d3 >> 16) & 0xff] +
    table[(d3 >> 24) & 0xff]
  );
}
