import { inspect, preview, SOURCE_OBJECT } from '../main/inspect';

describe('preview', () => {
  test('null', () => {
    expect(preview(null)).toBe('null');
  });

  test('undefined', () => {
    expect(preview(undefined)).toBe('undefined');
  });

  test('number', () => {
    expect(preview(111)).toBe('111');
    expect(preview(new Number(111))).toBe('111');
    expect(preview(NaN)).toBe('NaN');
    expect(preview(Infinity)).toBe('Infinity');
  });

  test('boolean', () => {
    expect(preview(true)).toBe('true');
    expect(preview(new Boolean(true))).toBe('true');
  });

  test('symbol', () => {
    expect(preview(Symbol('aaa'))).toBe('Symbol(aaa)');
    expect(preview(Object(Symbol('aaa')))).toBe('Symbol(aaa)');
  });

  test('bigint', () => {
    expect(preview(BigInt(111))).toBe('111n');
    expect(preview(Object(BigInt(111)))).toBe('111n');
  });

  test('string', () => {
    expect(preview('aaa')).toBe('"aaa"');

    expect(preview('aaa bbb', 0, { maxStringLength: 5 })).toBe('"aaa…"');
    expect(preview('aaa bbb ccc', 0, { maxStringLength: 9 })).toBe('"aaa bbb…"');
    expect(preview('aaabbb bbb', 0, { maxStringLength: 5 })).toBe('"aaab…"');
    expect(preview('  aaa bbb', 0, { maxStringLength: 5 })).toBe('"  aa…"');
    expect(preview('aaa\tbbb', 0, { maxStringLength: 5 })).toBe('"aaa\\…"');
    expect(preview('\t\n')).toBe('"\\t\\n"');
  });

  test('function', () => {
    expect(preview(() => 111, 0)).toBe('ƒ');
    expect(preview(() => 111, 1)).toBe('ƒ');
    expect(preview(() => 111, 2)).toBe('ƒ ()');

    expect(preview(function aaa() {}, 0)).toBe('ƒ');
    expect(preview(function aaa() {}, 1)).toBe('ƒ');
    expect(preview(function aaa() {}, 2)).toBe('ƒ aaa()');
  });

  describe('array', () => {
    test('Array', () => {
      expect(preview([], 0)).toBe('[]');
      expect(preview([{ aaa: { bbb: 222 } }, 111], 0)).toBe('Array(2)');

      expect(preview([], 1)).toBe('[]');
      expect(preview([{ aaa: { bbb: 222 } }, 111], 1)).toBe('[{…}, 111]');

      expect(preview([], 2)).toBe('[]');
      expect(preview([{ aaa: { bbb: 222 } }, 111], 2)).toBe('[{…}, 111]');

      expect(preview([111, 222, 333, 444], 2, { maxProperties: 3 })).toBe('[111, 222, 333, …]');
    });

    test('Uint8Array', () => {
      expect(preview(new Uint8Array(), 0)).toBe('Uint8Array(0)');
      expect(preview(new Uint8Array([111, 222]), 0)).toBe('Uint8Array(2)');

      expect(preview(new Uint8Array(), 1)).toBe('Uint8Array(0)');
      expect(preview(new Uint8Array([111, 222]), 1)).toBe('Uint8Array(2) [111, 222]');

      expect(preview(new Uint8Array(), 2)).toBe('Uint8Array(0)');
      expect(preview(new Uint8Array([111, 222]), 2)).toBe('Uint8Array(2) [111, 222]');

      expect(preview(new Uint8Array([1, 2, 3, 4]), 2, { maxProperties: 3 })).toBe('Uint8Array(4) [1, 2, 3, …]');
    });

    test('extended Array', () => {
      class Xxx extends Array {}

      const xxx0 = new Xxx();
      const xxx1 = new Xxx();

      xxx1.push({ aaa: { bbb: 222 } }, 111);

      expect(preview(xxx0, 0)).toBe('Xxx(0)');
      expect(preview(xxx1, 0)).toBe('Xxx(2)');

      expect(preview(xxx0, 1)).toBe('Xxx(0)');
      expect(preview(xxx1, 1)).toBe('Xxx(2) [{…}, 111]');

      expect(preview(xxx0, 2)).toBe('Xxx(0)');
      expect(preview(xxx1, 2)).toBe('Xxx(2) [{…}, 111]');
    });
  });

  test('ArrayBuffer', () => {
    expect(preview(new ArrayBuffer(128), 0)).toBe('ArrayBuffer(128)');
    expect(preview(new ArrayBuffer(128), 1)).toBe('ArrayBuffer(128)');
    expect(preview(new ArrayBuffer(128), 2)).toBe('ArrayBuffer(128)');
  });

  test('Set', () => {
    expect(preview(new Set(), 0)).toBe('Set(0)');
    expect(preview(new Set([{ aaa: 111 }]), 0)).toBe('Set(1)');
    expect(preview(new Set([{ aaa: 111 }]), 1)).toBe('Set(1) {{…}}');
    expect(preview(new Set([{ aaa: 111 }]), 2)).toBe('Set(1) {{…}}');
    expect(preview(new Set(['aaa', 111, 222, 333]), 2, { maxProperties: 3 })).toBe('Set(4) {"aaa", 111, 222, …}');
  });

  describe('Map', () => {
    test('default', () => {
      expect(preview(new Map(), 0)).toBe('Map(0)');
      expect(preview(new Map([[{ aaa: 111 }, 'bbb']]), 0)).toBe('Map(1)');
      expect(preview(new Map([[{ aaa: 111 }, 'bbb']]), 1)).toBe('Map(1) {{…} => "bbb"}');
      expect(preview(new Map([[{ aaa: 111 }, 'bbb']]), 2)).toBe('Map(1) {{aaa: 111} => "bbb"}');
    });

    test('extended Map', () => {
      class Xxx<K, V> extends Map<K, V> {
        constructor(entries?: readonly (readonly [K, V])[] | null) {
          super(entries);
        }
      }

      expect(preview(new Xxx(), 0)).toBe('Xxx(0)');
      expect(preview(new Xxx([[{ aaa: 111 }, 'bbb']]), 0)).toBe('Xxx(1)');
      expect(preview(new Xxx([[{ aaa: 111 }, 'bbb']]), 1)).toBe('Xxx(1) {{…} => "bbb"}');
      expect(preview(new Xxx([[{ aaa: 111 }, 'bbb']]), 2)).toBe('Xxx(1) {{aaa: 111} => "bbb"}');
    });
  });

  describe('object', () => {
    test('plain', () => {
      const xxx = { aaa: 111, bbb: { ccc: 222 } };

      expect(preview(xxx, 0)).toBe('{…}');
      expect(preview(xxx, 1)).toBe('{aaa: 111, bbb: {…}}');
      expect(preview(xxx, 2)).toBe('{aaa: 111, bbb: {…}}');
      expect(preview(xxx, 2, { maxProperties: 1 })).toBe('{aaa: 111, …}');

      expect(preview({}, 0)).toBe('{}');
      expect(preview({}, 1)).toBe('{}');
      expect(preview({}, 2)).toBe('{}');
    });

    test('null prototype', () => {
      const xxx = Object.assign(Object.create(null), { aaa: 111, bbb: { ccc: 222 } });

      expect(preview(xxx, 0)).toBe('{…}');
      expect(preview(xxx, 1)).toBe('{aaa: 111, bbb: {…}}');
      expect(preview(xxx, 2)).toBe('{aaa: 111, bbb: {…}}');
      expect(preview(xxx, 2, { maxProperties: 1 })).toBe('{aaa: 111, …}');

      expect(preview({}, 0)).toBe('{}');
      expect(preview({}, 1)).toBe('{}');
      expect(preview({}, 2)).toBe('{}');
    });

    test('plain iterable', () => {
      const xxx = {
        *[Symbol.iterator]() {
          yield 111;
          yield 222;
          yield 333;
        },
      };

      expect(preview(xxx, 0)).toBe('{…}');
      expect(preview(xxx, 1)).toBe('{111, 222, 333, Symbol(Symbol.iterator): ƒ}');
      expect(preview(xxx, 2)).toBe('{111, 222, 333, Symbol(Symbol.iterator): ƒ}');
      expect(preview(xxx, 2, { maxProperties: 2 })).toBe('{111, 222, …}');

      expect(preview({ *[Symbol.iterator]() {} }, 0)).toBe('{…}');
    });

    test('plain iterable with properties and symbols', () => {
      const ddd = Symbol('ddd');
      const xxx = {
        *[Symbol.iterator]() {
          yield 111;
          yield 222;
        },
        aaa: 333,
        [ddd]: 444,
      };

      expect(preview(xxx, 0)).toBe('{…}');
      expect(preview(xxx, 1)).toBe('{111, 222, aaa: 333, Symbol(Symbol.iterator): ƒ, Symbol(ddd): 444}');
      expect(preview(xxx, 2)).toBe('{111, 222, aaa: 333, Symbol(Symbol.iterator): ƒ, Symbol(ddd): 444}');
      expect(preview(xxx, 2, { maxProperties: 2 })).toBe('{111, 222, …}');
    });

    test('class instance', () => {
      class Xxx {
        aaa = 111;
        bbb = { ccc: 222 };
      }

      class Yyy {}

      expect(preview(new Xxx(), 0)).toBe('Xxx');
      expect(preview(new Xxx(), 1)).toBe('Xxx {aaa: 111, bbb: {…}}');
      expect(preview(new Xxx(), 2)).toBe('Xxx {aaa: 111, bbb: {…}}');
      expect(preview(new Xxx(), 2, { maxProperties: 1 })).toBe('Xxx {aaa: 111, …}');

      expect(preview(new Yyy(), 0)).toBe('Yyy');
      expect(preview(new Yyy(), 1)).toBe('Yyy');
      expect(preview(new Yyy(), 2)).toBe('Yyy');
    });

    test('anonymous class instance', () => {
      const xxx = (() =>
        new (class {
          aaa = 111;
        })())();

      expect(preview(xxx, 0)).toBe('{…}');
      expect(preview(xxx, 1)).toBe('{aaa: 111}');
      expect(preview(xxx, 2)).toBe('{aaa: 111}');
    });

    test('iterable class instance', () => {
      class Xxx {
        aaa = 111;
        bbb = { ccc: 222 };

        *[Symbol.iterator]() {
          yield 111;
          yield 222;
          yield 333;
        }
      }

      class Yyy {
        *[Symbol.iterator]() {
          yield 111;
          yield 222;
          yield 333;
        }
      }

      class Zzz {
        *[Symbol.iterator]() {}
      }

      expect(preview(new Xxx(), 0)).toBe('Xxx');
      expect(preview(new Xxx(), 1)).toBe('Xxx {111, 222, 333, aaa: 111, bbb: {…}}');
      expect(preview(new Xxx(), 2)).toBe('Xxx {111, 222, 333, aaa: 111, bbb: {…}}');
      expect(preview(new Xxx(), 2, { maxProperties: 1 })).toBe('Xxx {111, …}');

      expect(preview(new Yyy(), 0)).toBe('Yyy');
      expect(preview(new Yyy(), 2)).toBe('Yyy {111, 222, 333}');

      expect(preview(new Zzz(), 0)).toBe('Zzz');
      expect(preview(new Zzz(), 2)).toBe('Zzz');
    });
  });
});

describe('inspect', () => {
  test('primitive value', () => {
    expect(inspect('aaa', 0)).toEqual({ value: '"aaa"' });
    expect(inspect(111, 0)).toEqual({ value: '111' });
    expect(inspect(NaN, 0)).toEqual({ value: 'NaN' });
    expect(inspect(Infinity, 0)).toEqual({ value: 'Infinity' });
    expect(inspect(true, 0)).toEqual({ value: 'true' });
    expect(inspect(Symbol('aaa'), 0)).toEqual({ value: 'Symbol(aaa)' });
    expect(inspect(BigInt(111), 0)).toEqual({ value: '111n' });
  });

  describe('array', () => {
    test('depth 0', () => {
      const arr1: unknown = [];
      const arr2: unknown = [111];
      const arr3: unknown = [111, 222];

      expect(inspect(arr1, 0)).toEqual({ [SOURCE_OBJECT]: arr1, value: '[]', hasChildren: true });
      expect(inspect(arr2, 0)).toEqual({ [SOURCE_OBJECT]: arr2, value: '[111]', hasChildren: true });
      expect(inspect(arr3, 0)).toEqual({ [SOURCE_OBJECT]: arr3, value: '[111, 222]', hasChildren: true });
    });

    test('depth 1', () => {
      const obj2 = { ccc: 222 };
      const obj1 = { aaa: 111, bbb: obj2 };

      const arr1: unknown = [];
      const arr2: unknown = [111];
      const arr3: unknown = [111, 222];
      const arr4: unknown = [obj1];

      expect(inspect(arr1, 1)).toEqual({
        [SOURCE_OBJECT]: arr1,
        value: '[]',
        hasChildren: true,
        children: [
          {
            key: '"length"',
            value: '0',
          },
        ],
      });

      expect(inspect(arr2, 1)).toEqual({
        [SOURCE_OBJECT]: arr2,
        value: '[111]',
        hasChildren: true,
        children: [
          {
            key: '"0"',
            value: '111',
          },
          {
            key: '"length"',
            value: '1',
          },
        ],
      });

      expect(inspect(arr3, 1)).toEqual({
        [SOURCE_OBJECT]: arr3,
        value: '[111, 222]',
        hasChildren: true,
        children: [
          {
            key: '"0"',
            value: '111',
          },
          {
            key: '"1"',
            value: '222',
          },
          {
            key: '"length"',
            value: '2',
          },
        ],
      });

      expect(inspect(arr4, 1)).toEqual({
        [SOURCE_OBJECT]: arr4,
        value: '[{…}]',
        hasChildren: true,
        children: [
          {
            [SOURCE_OBJECT]: obj1,
            key: '"0"',
            value: '{aaa: 111, bbb: {…}}',
            hasChildren: true,
          },
          {
            key: '"length"',
            value: '1',
          },
        ],
      });
    });

    test('depth 2', () => {
      const obj2 = { ccc: 222 };
      const obj1 = { aaa: 111, bbb: obj2 };

      const arr1: unknown = [];
      const arr2: unknown = [111];
      const arr3: unknown = [111, 222];
      const arr4: unknown = [obj1];

      expect(inspect(arr1, 2)).toEqual({
        [SOURCE_OBJECT]: arr1,
        value: '[]',
        hasChildren: true,
        children: [
          {
            key: '"length"',
            value: '0',
          },
        ],
      });

      expect(inspect(arr2, 2)).toEqual({
        [SOURCE_OBJECT]: arr2,
        value: '[111]',
        hasChildren: true,
        children: [
          {
            key: '"0"',
            value: '111',
          },
          {
            key: '"length"',
            value: '1',
          },
        ],
      });

      expect(inspect(arr3, 2)).toEqual({
        [SOURCE_OBJECT]: arr3,
        value: '[111, 222]',
        hasChildren: true,
        children: [
          {
            key: '"0"',
            value: '111',
          },
          {
            key: '"1"',
            value: '222',
          },
          {
            key: '"length"',
            value: '2',
          },
        ],
      });

      expect(inspect(arr4, 2)).toEqual({
        [SOURCE_OBJECT]: arr4,
        value: '[{…}]',
        hasChildren: true,
        children: [
          {
            [SOURCE_OBJECT]: obj1,
            key: '"0"',
            value: '{aaa: 111, bbb: {…}}',
            hasChildren: true,
            children: [
              {
                key: '"aaa"',
                value: '111',
              },
              {
                [SOURCE_OBJECT]: obj2,
                hasChildren: true,
                key: '"bbb"',
                value: '{ccc: 222}',
              },
            ],
          },
          {
            key: '"length"',
            value: '1',
          },
        ],
      });
    });
  });

  describe('map', () => {
    test('depth 0', () => {
      const map = new Map([[{ aaa: 111 }, { bbb: 222 }]]);

      expect(inspect(map, 0)).toEqual({
        [SOURCE_OBJECT]: map,
        value: 'Map(1) {{aaa: 111} => {bbb: 222}}',
        hasChildren: true,
      });
    });

    test('depth 1', () => {
      const obj = [{ aaa: 111 }, { bbb: 222 }] as const;

      const map = new Map([obj]);

      expect(inspect(map, 1)).toEqual({
        [SOURCE_OBJECT]: map,
        value: 'Map(1) {{aaa: 111} => {bbb: 222}}',
        hasChildren: true,
        children: [
          {
            [SOURCE_OBJECT]: obj,
            hasChildren: true,
            key: '0',
            value: '[{…}, {…}]',
          },
        ],
      });
    });

    test('depth 2', () => {
      const obj3 = { bbb: 222 };
      const obj2 = { aaa: 111 };
      const obj1 = [obj2, obj3] as const;

      const map = new Map([obj1]);

      expect(inspect(map, 2)).toEqual({
        [SOURCE_OBJECT]: map,
        value: 'Map(1) {{aaa: 111} => {bbb: 222}}',
        hasChildren: true,
        children: [
          {
            [SOURCE_OBJECT]: obj1,
            key: '0',
            value: '[{…}, {…}]',
            hasChildren: true,
            children: [
              {
                [SOURCE_OBJECT]: obj2,
                key: '"0"',
                value: '{aaa: 111}',
                hasChildren: true,
              },
              {
                [SOURCE_OBJECT]: obj3,
                key: '"1"',
                value: '{bbb: 222}',
                hasChildren: true,
              },
              {
                key: '"length"',
                value: '2',
              },
            ],
          },
        ],
      });
    });
  });
});
