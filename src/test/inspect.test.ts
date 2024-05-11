import { describeValue, inspect } from '../main/inspect';
import { INSPECTED_VALUE } from '../main/types';

describe('describeValue', () => {
  test('null', () => {
    expect(describeValue(null)).toBe('null');
  });

  test('undefined', () => {
    expect(describeValue(undefined)).toBe('undefined');
  });

  test('number', () => {
    expect(describeValue(111)).toBe('111');
    expect(describeValue(new Number(111))).toBe('111');
    expect(describeValue(NaN)).toBe('NaN');
    expect(describeValue(Infinity)).toBe('Infinity');
  });

  test('boolean', () => {
    expect(describeValue(true)).toBe('true');
    expect(describeValue(new Boolean(true))).toBe('true');
  });

  test('symbol', () => {
    expect(describeValue(Symbol('aaa'))).toBe('Symbol(aaa)');
    expect(describeValue(Object(Symbol('aaa')))).toBe('Symbol(aaa)');
  });

  test('bigint', () => {
    expect(describeValue(BigInt(111))).toBe('111n');
    expect(describeValue(Object(BigInt(111)))).toBe('111n');
  });

  test('string', () => {
    expect(describeValue('aaa')).toBe("'aaa'");

    expect(describeValue('aaa bbb', 0, { maxStringLength: 5 })).toBe("'aaa…'");
    expect(describeValue('aaa bbb ccc', 0, { maxStringLength: 9 })).toBe("'aaa bbb…'");
    expect(describeValue('aaabbb bbb', 0, { maxStringLength: 5 })).toBe("'aaabb…'");
    expect(describeValue('  aaa bbb', 0, { maxStringLength: 5 })).toBe("'  aaa…'");
    expect(describeValue('aaa\tbbb', 0, { maxStringLength: 4 })).toBe("'aaa\\…'");
    expect(describeValue('\t\n')).toBe("'\\t\\n'");
  });

  test('function', () => {
    expect(describeValue(() => 111, 0)).toBe('ƒ');
    expect(describeValue(() => 111, 1)).toBe('ƒ ()');
    expect(describeValue(() => 111, 2)).toBe('ƒ ()');

    expect(describeValue(function aaa() {}, 0)).toBe('ƒ');
    expect(describeValue(function aaa() {}, 1)).toBe('ƒ aaa()');
    expect(describeValue(function aaa() {}, 2)).toBe('ƒ aaa()');
  });

  test('Error', () => {
    expect(describeValue(new Error(), 0)).toBe('Error');
    expect(describeValue(new Error(), 1)).toBe('Error');

    expect(describeValue(new Error('aaa'), 0)).toBe('Error');
    expect(describeValue(new Error('aaa'), 1)).toBe('Error');
    expect(describeValue(new Error('aaa'), 2)).toBe("Error {'aaa'}");

    class DOMException extends Error {
      constructor(message?: string) {
        super(message);
        this.name = 'AbortError';
      }
    }

    expect(describeValue(new DOMException('aaa'), 0)).toBe('DOMException');
    expect(describeValue(new DOMException('aaa'), 1)).toBe('DOMException(AbortError)');
    expect(describeValue(new DOMException('aaa'), 2)).toBe("DOMException(AbortError) {'aaa'}");
  });

  describe('array', () => {
    test('Array', () => {
      expect(describeValue([], 0)).toBe('[]');
      expect(describeValue([{ aaa: { bbb: 222 } }, 111], 0)).toBe('Array(2)');

      expect(describeValue([], 1)).toBe('[]');
      expect(describeValue([{ aaa: { bbb: 222 } }, 111], 1)).toBe('[{…}, 111]');

      expect(describeValue([], 2)).toBe('[]');
      expect(describeValue([{ aaa: { bbb: 222 } }, 111], 2)).toBe('[{aaa: {…}}, 111]');

      expect(describeValue([111, 222, 333, 444], 2, { maxProperties: 3 })).toBe('[111, 222, 333, …]');
    });

    test('Uint8Array', () => {
      expect(describeValue(new Uint8Array(), 0)).toBe('Uint8Array(0)');
      expect(describeValue(new Uint8Array([111, 222]), 0)).toBe('Uint8Array(2)');

      expect(describeValue(new Uint8Array(), 1)).toBe('Uint8Array(0)');
      expect(describeValue(new Uint8Array([111, 222]), 1)).toBe('Uint8Array(2) [111, 222]');

      expect(describeValue(new Uint8Array(), 2)).toBe('Uint8Array(0)');
      expect(describeValue(new Uint8Array([111, 222]), 2)).toBe('Uint8Array(2) [111, 222]');

      expect(describeValue(new Uint8Array([1, 2, 3, 4]), 2, { maxProperties: 3 })).toBe('Uint8Array(4) [1, 2, 3, …]');
    });

    test('extended Array', () => {
      class Xxx extends Array {}

      const xxx0 = new Xxx();
      const xxx1 = new Xxx();

      xxx1.push({ aaa: { bbb: 222 } }, 111);

      expect(describeValue(xxx0, 0)).toBe('Xxx(0)');
      expect(describeValue(xxx1, 0)).toBe('Xxx(2)');

      expect(describeValue(xxx0, 1)).toBe('Xxx(0)');
      expect(describeValue(xxx1, 1)).toBe('Xxx(2) [{…}, 111]');

      expect(describeValue(xxx0, 2)).toBe('Xxx(0)');
      expect(describeValue(xxx1, 2)).toBe('Xxx(2) [{aaa: {…}}, 111]');
    });
  });

  test('ArrayBuffer', () => {
    expect(describeValue(new ArrayBuffer(128), 0)).toBe('ArrayBuffer(128)');
    expect(describeValue(new ArrayBuffer(128), 1)).toBe('ArrayBuffer(128)');
    expect(describeValue(new ArrayBuffer(128), 2)).toBe('ArrayBuffer(128)');
  });

  test('Set', () => {
    expect(describeValue(new Set(), 0)).toBe('Set(0)');
    expect(describeValue(new Set([{ aaa: 111 }]), 0)).toBe('Set(1)');
    expect(describeValue(new Set([{ aaa: 111 }]), 1)).toBe('Set(1) {{…}}');
    expect(describeValue(new Set([{ aaa: 111 }]), 2)).toBe('Set(1) {{aaa: 111}}');
    expect(describeValue(new Set(['aaa', 111, 222, 333]), 2, { maxProperties: 3 })).toBe("Set(4) {'aaa', 111, 222, …}");
  });

  describe('Map', () => {
    test('default', () => {
      expect(describeValue(new Map(), 0)).toBe('Map(0)');
      expect(describeValue(new Map([[{ aaa: 111 }, 'bbb']]), 0)).toBe('Map(1)');
      expect(describeValue(new Map([[{ aaa: 111 }, 'bbb']]), 1)).toBe("Map(1) {{…} => 'bbb'}");
      expect(describeValue(new Map([[{ aaa: 111 }, 'bbb']]), 2)).toBe("Map(1) {{aaa: 111} => 'bbb'}");
    });

    test('extended Map', () => {
      class Xxx<K, V> extends Map<K, V> {
        constructor(entries?: readonly (readonly [K, V])[] | null) {
          super(entries);
        }
      }

      expect(describeValue(new Xxx(), 0)).toBe('Xxx(0)');
      expect(describeValue(new Xxx([[{ aaa: 111 }, 'bbb']]), 0)).toBe('Xxx(1)');
      expect(describeValue(new Xxx([[{ aaa: 111 }, 'bbb']]), 1)).toBe("Xxx(1) {{…} => 'bbb'}");
      expect(describeValue(new Xxx([[{ aaa: 111 }, 'bbb']]), 2)).toBe("Xxx(1) {{aaa: 111} => 'bbb'}");
    });
  });

  describe('object', () => {
    test('plain', () => {
      const xxx = { aaa: 111, bbb: { ccc: 222 } };

      expect(describeValue(xxx, 0)).toBe('{…}');
      expect(describeValue(xxx, 1)).toBe('{aaa: 111, bbb: {…}}');
      expect(describeValue(xxx, 2)).toBe('{aaa: 111, bbb: {ccc: 222}}');
      expect(describeValue(xxx, 2, { maxProperties: 1 })).toBe('{aaa: 111, …}');

      expect(describeValue({}, 0)).toBe('{}');
      expect(describeValue({}, 1)).toBe('{}');
      expect(describeValue({}, 2)).toBe('{}');
    });

    test('null prototype', () => {
      const xxx = Object.assign(Object.create(null), { aaa: 111, bbb: { ccc: 222 } });

      expect(describeValue(xxx, 0)).toBe('{…}');
      expect(describeValue(xxx, 1)).toBe('{aaa: 111, bbb: {…}}');
      expect(describeValue(xxx, 2)).toBe('{aaa: 111, bbb: {ccc: 222}}');
      expect(describeValue(xxx, 2, { maxProperties: 1 })).toBe('{aaa: 111, …}');

      expect(describeValue({}, 0)).toBe('{}');
      expect(describeValue({}, 1)).toBe('{}');
      expect(describeValue({}, 2)).toBe('{}');
    });

    test('plain iterable', () => {
      const xxx = {
        *[Symbol.iterator]() {
          yield 111;
          yield 222;
          yield 333;
        },
      };

      expect(describeValue(xxx, 0)).toBe('{…}');
      expect(describeValue(xxx, 1)).toBe('{111, 222, 333, Symbol(Symbol.iterator): ƒ}');
      expect(describeValue(xxx, 2)).toBe('{111, 222, 333, Symbol(Symbol.iterator): ƒ [Symbol.iterator]()}');
      expect(describeValue(xxx, 2, { maxProperties: 2 })).toBe('{111, 222, …}');

      expect(describeValue({ *[Symbol.iterator]() {} }, 0)).toBe('{…}');
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

      expect(describeValue(xxx, 0)).toBe('{…}');
      expect(describeValue(xxx, 1)).toBe('{111, 222, aaa: 333, Symbol(Symbol.iterator): ƒ, Symbol(ddd): 444}');
      expect(describeValue(xxx, 2)).toBe(
        '{111, 222, aaa: 333, Symbol(Symbol.iterator): ƒ [Symbol.iterator](), Symbol(ddd): 444}'
      );
      expect(describeValue(xxx, 2, { maxProperties: 2 })).toBe('{111, 222, …}');
    });

    test('class instance', () => {
      class Xxx {
        aaa = 111;
        bbb = { ccc: 222 };
      }

      class Yyy {}

      expect(describeValue(new Xxx(), 0)).toBe('Xxx');
      expect(describeValue(new Xxx(), 1)).toBe('Xxx {aaa: 111, bbb: {…}}');
      expect(describeValue(new Xxx(), 2)).toBe('Xxx {aaa: 111, bbb: {ccc: 222}}');
      expect(describeValue(new Xxx(), 2, { maxProperties: 1 })).toBe('Xxx {aaa: 111, …}');

      expect(describeValue(new Yyy(), 0)).toBe('Yyy');
      expect(describeValue(new Yyy(), 1)).toBe('Yyy');
      expect(describeValue(new Yyy(), 2)).toBe('Yyy');
    });

    test('anonymous class instance', () => {
      const xxx = (() =>
        new (class {
          aaa = 111;
        })())();

      expect(describeValue(xxx, 0)).toBe('{…}');
      expect(describeValue(xxx, 1)).toBe('{aaa: 111}');
      expect(describeValue(xxx, 2)).toBe('{aaa: 111}');
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

      expect(describeValue(new Xxx(), 0)).toBe('Xxx');
      expect(describeValue(new Xxx(), 1)).toBe('Xxx {111, 222, 333, aaa: 111, bbb: {…}}');
      expect(describeValue(new Xxx(), 2)).toBe('Xxx {111, 222, 333, aaa: 111, bbb: {ccc: 222}}');
      expect(describeValue(new Xxx(), 2, { maxProperties: 1 })).toBe('Xxx {111, …}');

      expect(describeValue(new Yyy(), 0)).toBe('Yyy');
      expect(describeValue(new Yyy(), 2)).toBe('Yyy {111, 222, 333}');

      expect(describeValue(new Zzz(), 0)).toBe('Zzz');
      expect(describeValue(new Zzz(), 2)).toBe('Zzz');
    });
  });
});

describe('inspect', () => {
  test('primitive value', () => {
    expect(inspect('aaa', 0)).toEqual({ [INSPECTED_VALUE]: 'aaa', valueDescription: "'aaa'" });
    expect(inspect(111, 0)).toEqual({ [INSPECTED_VALUE]: 111, valueDescription: '111' });
    expect(inspect(NaN, 0)).toEqual({ [INSPECTED_VALUE]: NaN, valueDescription: 'NaN' });
    expect(inspect(Infinity, 0)).toEqual({ [INSPECTED_VALUE]: Infinity, valueDescription: 'Infinity' });
    expect(inspect(true, 0)).toEqual({ [INSPECTED_VALUE]: true, valueDescription: 'true' });
    expect(inspect(Symbol('aaa'), 0)).toEqual({
      [INSPECTED_VALUE]: expect.any(Symbol),
      valueDescription: 'Symbol(aaa)',
    });
    expect(inspect(BigInt(111), 0)).toEqual({ [INSPECTED_VALUE]: BigInt(111), valueDescription: '111n' });
  });

  describe('array', () => {
    test('depth 0', () => {
      const arr1: unknown = [];
      const arr2: unknown = [111];
      const arr3: unknown = [111, 222];

      expect(inspect(arr1, 0)).toEqual({ [INSPECTED_VALUE]: arr1, valueDescription: '[]', hasChildren: true });
      expect(inspect(arr2, 0)).toEqual({ [INSPECTED_VALUE]: arr2, valueDescription: '[111]', hasChildren: true });
      expect(inspect(arr3, 0)).toEqual({
        [INSPECTED_VALUE]: arr3,
        valueDescription: '[111, 222]',
        hasChildren: true,
      });
    });

    test('depth 1', () => {
      const obj2 = { ccc: 222 };
      const obj1 = { aaa: 111, bbb: obj2 };

      const arr1: unknown = [];
      const arr2: unknown = [111];
      const arr3: unknown = [111, 222];
      const arr4: unknown = [obj1];

      expect(inspect(arr1, 1)).toEqual({
        [INSPECTED_VALUE]: arr1,
        valueDescription: '[]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: 0,
            keyDescription: 'length',
            valueDescription: '0',
          },
        ],
      });

      expect(inspect(arr2, 1)).toEqual({
        [INSPECTED_VALUE]: arr2,
        valueDescription: '[111]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: 111,
            keyDescription: '0',
            valueDescription: '111',
          },
          {
            [INSPECTED_VALUE]: 1,
            keyDescription: 'length',
            valueDescription: '1',
          },
        ],
      });

      expect(inspect(arr3, 1)).toEqual({
        [INSPECTED_VALUE]: arr3,
        valueDescription: '[111, 222]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: 111,
            keyDescription: '0',
            valueDescription: '111',
          },
          {
            [INSPECTED_VALUE]: 222,
            keyDescription: '1',
            valueDescription: '222',
          },
          {
            [INSPECTED_VALUE]: 2,
            keyDescription: 'length',
            valueDescription: '2',
          },
        ],
      });

      expect(inspect(arr4, 1)).toEqual({
        [INSPECTED_VALUE]: arr4,
        valueDescription: '[{…}]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: obj1,
            keyDescription: '0',
            valueDescription: '{aaa: 111, bbb: {…}}',
            hasChildren: true,
          },
          {
            [INSPECTED_VALUE]: 1,
            keyDescription: 'length',
            valueDescription: '1',
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
        [INSPECTED_VALUE]: arr1,
        valueDescription: '[]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: 0,
            keyDescription: 'length',
            valueDescription: '0',
          },
        ],
      });

      expect(inspect(arr2, 2)).toEqual({
        [INSPECTED_VALUE]: arr2,
        valueDescription: '[111]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: 111,
            keyDescription: '0',
            valueDescription: '111',
          },
          {
            [INSPECTED_VALUE]: 1,
            keyDescription: 'length',
            valueDescription: '1',
          },
        ],
      });

      expect(inspect(arr3, 2)).toEqual({
        [INSPECTED_VALUE]: arr3,
        valueDescription: '[111, 222]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: 111,
            keyDescription: '0',
            valueDescription: '111',
          },
          {
            [INSPECTED_VALUE]: 222,
            keyDescription: '1',
            valueDescription: '222',
          },
          {
            [INSPECTED_VALUE]: 2,
            keyDescription: 'length',
            valueDescription: '2',
          },
        ],
      });

      expect(inspect(arr4, 2)).toEqual({
        [INSPECTED_VALUE]: arr4,
        valueDescription: '[{…}]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: obj1,
            keyDescription: '0',
            valueDescription: '{aaa: 111, bbb: {…}}',
            hasChildren: true,
            children: [
              {
                [INSPECTED_VALUE]: 111,
                keyDescription: 'aaa',
                valueDescription: '111',
              },
              {
                [INSPECTED_VALUE]: obj2,
                hasChildren: true,
                keyDescription: 'bbb',
                valueDescription: '{ccc: 222}',
              },
            ],
          },
          {
            [INSPECTED_VALUE]: 1,
            keyDescription: 'length',
            valueDescription: '1',
          },
        ],
      });
    });
  });

  describe('map', () => {
    test('depth 0', () => {
      const map = new Map([[{ aaa: 111 }, { bbb: 222 }]]);

      expect(inspect(map, 0)).toEqual({
        [INSPECTED_VALUE]: map,
        valueDescription: 'Map(1) {{…} => {…}}',
        hasChildren: true,
      });
    });

    test('depth 1', () => {
      const obj = [{ aaa: 111 }, { bbb: 222 }] as const;

      const map = new Map([obj]);

      expect(inspect(map, 1)).toEqual({
        [INSPECTED_VALUE]: map,
        valueDescription: 'Map(1) {{…} => {…}}',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: obj,
            hasChildren: true,
            keyDescription: '0',
            valueDescription: '[{…}, {…}]',
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
        [INSPECTED_VALUE]: map,
        valueDescription: 'Map(1) {{…} => {…}}',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: obj1,
            keyDescription: '0',
            valueDescription: '[{…}, {…}]',
            hasChildren: true,
            children: [
              {
                [INSPECTED_VALUE]: obj2,
                keyDescription: '0',
                valueDescription: '{aaa: 111}',
                hasChildren: true,
              },
              {
                [INSPECTED_VALUE]: obj3,
                keyDescription: '1',
                valueDescription: '{bbb: 222}',
                hasChildren: true,
              },
              {
                [INSPECTED_VALUE]: 2,
                keyDescription: 'length',
                valueDescription: '2',
              },
            ],
          },
        ],
      });
    });
  });
});
