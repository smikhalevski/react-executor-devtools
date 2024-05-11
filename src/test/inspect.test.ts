import { getValuePreview, inspect } from '../main/inspect';
import { INSPECTED_VALUE } from '../main/types';

describe('getValuePreview', () => {
  test('null', () => {
    expect(getValuePreview(null)).toBe('null');
  });

  test('undefined', () => {
    expect(getValuePreview(undefined)).toBe('undefined');
  });

  test('number', () => {
    expect(getValuePreview(111)).toBe('111');
    expect(getValuePreview(new Number(111))).toBe('111');
    expect(getValuePreview(NaN)).toBe('NaN');
    expect(getValuePreview(Infinity)).toBe('Infinity');
  });

  test('boolean', () => {
    expect(getValuePreview(true)).toBe('true');
    expect(getValuePreview(new Boolean(true))).toBe('true');
  });

  test('symbol', () => {
    expect(getValuePreview(Symbol('aaa'))).toBe('Symbol(aaa)');
    expect(getValuePreview(Object(Symbol('aaa')))).toBe('Symbol(aaa)');
  });

  test('bigint', () => {
    expect(getValuePreview(BigInt(111))).toBe('111n');
    expect(getValuePreview(Object(BigInt(111)))).toBe('111n');
  });

  test('string', () => {
    expect(getValuePreview('aaa')).toBe("'aaa'");

    expect(getValuePreview('aaa bbb', 0, { maxStringLength: 5 })).toBe("'aaa…'");
    expect(getValuePreview('aaa bbb ccc', 0, { maxStringLength: 9 })).toBe("'aaa bbb…'");
    expect(getValuePreview('aaabbb bbb', 0, { maxStringLength: 5 })).toBe("'aaabb…'");
    expect(getValuePreview('  aaa bbb', 0, { maxStringLength: 5 })).toBe("'  aaa…'");
    expect(getValuePreview('aaa\tbbb', 0, { maxStringLength: 4 })).toBe("'aaa\\…'");
    expect(getValuePreview('\t\n')).toBe("'\\t\\n'");
  });

  test('function', () => {
    expect(getValuePreview(() => 111, 0)).toBe('ƒ');
    expect(getValuePreview(() => 111, 1)).toBe('ƒ ()');
    expect(getValuePreview(() => 111, 2)).toBe('ƒ ()');

    expect(getValuePreview(function aaa() {}, 0)).toBe('ƒ');
    expect(getValuePreview(function aaa() {}, 1)).toBe('ƒ aaa()');
    expect(getValuePreview(function aaa() {}, 2)).toBe('ƒ aaa()');
  });

  test('Error', () => {
    expect(getValuePreview(new Error(), 0)).toBe('Error');
    expect(getValuePreview(new Error(), 1)).toBe('Error');

    expect(getValuePreview(new Error('aaa'), 0)).toBe('Error');
    expect(getValuePreview(new Error('aaa'), 1)).toBe('Error');
    expect(getValuePreview(new Error('aaa'), 2)).toBe("Error {'aaa'}");

    class DOMException extends Error {
      constructor(message?: string) {
        super(message);
        this.name = 'AbortError';
      }
    }

    expect(getValuePreview(new DOMException('aaa'), 0)).toBe('DOMException');
    expect(getValuePreview(new DOMException('aaa'), 1)).toBe('DOMException(AbortError)');
    expect(getValuePreview(new DOMException('aaa'), 2)).toBe("DOMException(AbortError) {'aaa'}");
  });

  describe('array', () => {
    test('Array', () => {
      expect(getValuePreview([], 0)).toBe('[]');
      expect(getValuePreview([{ aaa: { bbb: 222 } }, 111], 0)).toBe('Array(2)');

      expect(getValuePreview([], 1)).toBe('[]');
      expect(getValuePreview([{ aaa: { bbb: 222 } }, 111], 1)).toBe('[{…}, 111]');

      expect(getValuePreview([], 2)).toBe('[]');
      expect(getValuePreview([{ aaa: { bbb: 222 } }, 111], 2)).toBe('[{aaa: {…}}, 111]');

      expect(getValuePreview([111, 222, 333, 444], 2, { maxProperties: 3 })).toBe('[111, 222, 333, …]');
    });

    test('Uint8Array', () => {
      expect(getValuePreview(new Uint8Array(), 0)).toBe('Uint8Array(0)');
      expect(getValuePreview(new Uint8Array([111, 222]), 0)).toBe('Uint8Array(2)');

      expect(getValuePreview(new Uint8Array(), 1)).toBe('Uint8Array(0)');
      expect(getValuePreview(new Uint8Array([111, 222]), 1)).toBe('Uint8Array(2) [111, 222]');

      expect(getValuePreview(new Uint8Array(), 2)).toBe('Uint8Array(0)');
      expect(getValuePreview(new Uint8Array([111, 222]), 2)).toBe('Uint8Array(2) [111, 222]');

      expect(getValuePreview(new Uint8Array([1, 2, 3, 4]), 2, { maxProperties: 3 })).toBe('Uint8Array(4) [1, 2, 3, …]');
    });

    test('extended Array', () => {
      class Xxx extends Array {}

      const xxx0 = new Xxx();
      const xxx1 = new Xxx();

      xxx1.push({ aaa: { bbb: 222 } }, 111);

      expect(getValuePreview(xxx0, 0)).toBe('Xxx(0)');
      expect(getValuePreview(xxx1, 0)).toBe('Xxx(2)');

      expect(getValuePreview(xxx0, 1)).toBe('Xxx(0)');
      expect(getValuePreview(xxx1, 1)).toBe('Xxx(2) [{…}, 111]');

      expect(getValuePreview(xxx0, 2)).toBe('Xxx(0)');
      expect(getValuePreview(xxx1, 2)).toBe('Xxx(2) [{aaa: {…}}, 111]');
    });
  });

  test('ArrayBuffer', () => {
    expect(getValuePreview(new ArrayBuffer(128), 0)).toBe('ArrayBuffer(128)');
    expect(getValuePreview(new ArrayBuffer(128), 1)).toBe('ArrayBuffer(128)');
    expect(getValuePreview(new ArrayBuffer(128), 2)).toBe('ArrayBuffer(128)');
  });

  test('Set', () => {
    expect(getValuePreview(new Set(), 0)).toBe('Set(0)');
    expect(getValuePreview(new Set([{ aaa: 111 }]), 0)).toBe('Set(1)');
    expect(getValuePreview(new Set([{ aaa: 111 }]), 1)).toBe('Set(1) {{…}}');
    expect(getValuePreview(new Set([{ aaa: 111 }]), 2)).toBe('Set(1) {{aaa: 111}}');
    expect(getValuePreview(new Set(['aaa', 111, 222, 333]), 2, { maxProperties: 3 })).toBe(
      "Set(4) {'aaa', 111, 222, …}"
    );
  });

  describe('Map', () => {
    test('default', () => {
      expect(getValuePreview(new Map(), 0)).toBe('Map(0)');
      expect(getValuePreview(new Map([[{ aaa: 111 }, 'bbb']]), 0)).toBe('Map(1)');
      expect(getValuePreview(new Map([[{ aaa: 111 }, 'bbb']]), 1)).toBe("Map(1) {{…} => 'bbb'}");
      expect(getValuePreview(new Map([[{ aaa: 111 }, 'bbb']]), 2)).toBe("Map(1) {{aaa: 111} => 'bbb'}");
    });

    test('extended Map', () => {
      class Xxx<K, V> extends Map<K, V> {
        constructor(entries?: readonly (readonly [K, V])[] | null) {
          super(entries);
        }
      }

      expect(getValuePreview(new Xxx(), 0)).toBe('Xxx(0)');
      expect(getValuePreview(new Xxx([[{ aaa: 111 }, 'bbb']]), 0)).toBe('Xxx(1)');
      expect(getValuePreview(new Xxx([[{ aaa: 111 }, 'bbb']]), 1)).toBe("Xxx(1) {{…} => 'bbb'}");
      expect(getValuePreview(new Xxx([[{ aaa: 111 }, 'bbb']]), 2)).toBe("Xxx(1) {{aaa: 111} => 'bbb'}");
    });
  });

  describe('object', () => {
    test('plain', () => {
      const xxx = { aaa: 111, bbb: { ccc: 222 } };

      expect(getValuePreview(xxx, 0)).toBe('{…}');
      expect(getValuePreview(xxx, 1)).toBe('{aaa: 111, bbb: {…}}');
      expect(getValuePreview(xxx, 2)).toBe('{aaa: 111, bbb: {ccc: 222}}');
      expect(getValuePreview(xxx, 2, { maxProperties: 1 })).toBe('{aaa: 111, …}');

      expect(getValuePreview({}, 0)).toBe('{}');
      expect(getValuePreview({}, 1)).toBe('{}');
      expect(getValuePreview({}, 2)).toBe('{}');
    });

    test('null prototype', () => {
      const xxx = Object.assign(Object.create(null), { aaa: 111, bbb: { ccc: 222 } });

      expect(getValuePreview(xxx, 0)).toBe('{…}');
      expect(getValuePreview(xxx, 1)).toBe('{aaa: 111, bbb: {…}}');
      expect(getValuePreview(xxx, 2)).toBe('{aaa: 111, bbb: {ccc: 222}}');
      expect(getValuePreview(xxx, 2, { maxProperties: 1 })).toBe('{aaa: 111, …}');

      expect(getValuePreview({}, 0)).toBe('{}');
      expect(getValuePreview({}, 1)).toBe('{}');
      expect(getValuePreview({}, 2)).toBe('{}');
    });

    test('plain iterable', () => {
      const xxx = {
        *[Symbol.iterator]() {
          yield 111;
          yield 222;
          yield 333;
        },
      };

      expect(getValuePreview(xxx, 0)).toBe('{…}');
      expect(getValuePreview(xxx, 1)).toBe('{111, 222, 333, Symbol(Symbol.iterator): ƒ}');
      expect(getValuePreview(xxx, 2)).toBe('{111, 222, 333, Symbol(Symbol.iterator): ƒ [Symbol.iterator]()}');
      expect(getValuePreview(xxx, 2, { maxProperties: 2 })).toBe('{111, 222, …}');

      expect(getValuePreview({ *[Symbol.iterator]() {} }, 0)).toBe('{…}');
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

      expect(getValuePreview(xxx, 0)).toBe('{…}');
      expect(getValuePreview(xxx, 1)).toBe('{111, 222, aaa: 333, Symbol(Symbol.iterator): ƒ, Symbol(ddd): 444}');
      expect(getValuePreview(xxx, 2)).toBe(
        '{111, 222, aaa: 333, Symbol(Symbol.iterator): ƒ [Symbol.iterator](), Symbol(ddd): 444}'
      );
      expect(getValuePreview(xxx, 2, { maxProperties: 2 })).toBe('{111, 222, …}');
    });

    test('class instance', () => {
      class Xxx {
        aaa = 111;
        bbb = { ccc: 222 };
      }

      class Yyy {}

      expect(getValuePreview(new Xxx(), 0)).toBe('Xxx');
      expect(getValuePreview(new Xxx(), 1)).toBe('Xxx {aaa: 111, bbb: {…}}');
      expect(getValuePreview(new Xxx(), 2)).toBe('Xxx {aaa: 111, bbb: {ccc: 222}}');
      expect(getValuePreview(new Xxx(), 2, { maxProperties: 1 })).toBe('Xxx {aaa: 111, …}');

      expect(getValuePreview(new Yyy(), 0)).toBe('Yyy');
      expect(getValuePreview(new Yyy(), 1)).toBe('Yyy');
      expect(getValuePreview(new Yyy(), 2)).toBe('Yyy');
    });

    test('anonymous class instance', () => {
      const xxx = (() =>
        new (class {
          aaa = 111;
        })())();

      expect(getValuePreview(xxx, 0)).toBe('{…}');
      expect(getValuePreview(xxx, 1)).toBe('{aaa: 111}');
      expect(getValuePreview(xxx, 2)).toBe('{aaa: 111}');
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

      expect(getValuePreview(new Xxx(), 0)).toBe('Xxx');
      expect(getValuePreview(new Xxx(), 1)).toBe('Xxx {111, 222, 333, aaa: 111, bbb: {…}}');
      expect(getValuePreview(new Xxx(), 2)).toBe('Xxx {111, 222, 333, aaa: 111, bbb: {ccc: 222}}');
      expect(getValuePreview(new Xxx(), 2, { maxProperties: 1 })).toBe('Xxx {111, …}');

      expect(getValuePreview(new Yyy(), 0)).toBe('Yyy');
      expect(getValuePreview(new Yyy(), 2)).toBe('Yyy {111, 222, 333}');

      expect(getValuePreview(new Zzz(), 0)).toBe('Zzz');
      expect(getValuePreview(new Zzz(), 2)).toBe('Zzz');
    });
  });
});

describe('inspect', () => {
  test('primitive value', () => {
    expect(inspect('aaa', 0)).toEqual({ [INSPECTED_VALUE]: 'aaa', valuePreview: "'aaa'" });
    expect(inspect(111, 0)).toEqual({ [INSPECTED_VALUE]: 111, valuePreview: '111' });
    expect(inspect(NaN, 0)).toEqual({ [INSPECTED_VALUE]: NaN, valuePreview: 'NaN' });
    expect(inspect(Infinity, 0)).toEqual({ [INSPECTED_VALUE]: Infinity, valuePreview: 'Infinity' });
    expect(inspect(true, 0)).toEqual({ [INSPECTED_VALUE]: true, valuePreview: 'true' });
    expect(inspect(Symbol('aaa'), 0)).toEqual({
      [INSPECTED_VALUE]: expect.any(Symbol),
      valuePreview: 'Symbol(aaa)',
    });
    expect(inspect(BigInt(111), 0)).toEqual({ [INSPECTED_VALUE]: BigInt(111), valuePreview: '111n' });
  });

  describe('array', () => {
    test('depth 0', () => {
      const arr1: unknown = [];
      const arr2: unknown = [111];
      const arr3: unknown = [111, 222];

      expect(inspect(arr1, 0)).toEqual({ [INSPECTED_VALUE]: arr1, valuePreview: '[]', hasChildren: true });
      expect(inspect(arr2, 0)).toEqual({ [INSPECTED_VALUE]: arr2, valuePreview: '[111]', hasChildren: true });
      expect(inspect(arr3, 0)).toEqual({
        [INSPECTED_VALUE]: arr3,
        valuePreview: '[111, 222]',
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
        valuePreview: '[]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: 0,
            keyPreview: 'length',
            valuePreview: '0',
          },
        ],
      });

      expect(inspect(arr2, 1)).toEqual({
        [INSPECTED_VALUE]: arr2,
        valuePreview: '[111]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: 111,
            keyPreview: '0',
            valuePreview: '111',
          },
          {
            [INSPECTED_VALUE]: 1,
            keyPreview: 'length',
            valuePreview: '1',
          },
        ],
      });

      expect(inspect(arr3, 1)).toEqual({
        [INSPECTED_VALUE]: arr3,
        valuePreview: '[111, 222]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: 111,
            keyPreview: '0',
            valuePreview: '111',
          },
          {
            [INSPECTED_VALUE]: 222,
            keyPreview: '1',
            valuePreview: '222',
          },
          {
            [INSPECTED_VALUE]: 2,
            keyPreview: 'length',
            valuePreview: '2',
          },
        ],
      });

      expect(inspect(arr4, 1)).toEqual({
        [INSPECTED_VALUE]: arr4,
        valuePreview: '[{…}]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: obj1,
            keyPreview: '0',
            valuePreview: '{aaa: 111, bbb: {…}}',
            hasChildren: true,
          },
          {
            [INSPECTED_VALUE]: 1,
            keyPreview: 'length',
            valuePreview: '1',
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
        valuePreview: '[]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: 0,
            keyPreview: 'length',
            valuePreview: '0',
          },
        ],
      });

      expect(inspect(arr2, 2)).toEqual({
        [INSPECTED_VALUE]: arr2,
        valuePreview: '[111]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: 111,
            keyPreview: '0',
            valuePreview: '111',
          },
          {
            [INSPECTED_VALUE]: 1,
            keyPreview: 'length',
            valuePreview: '1',
          },
        ],
      });

      expect(inspect(arr3, 2)).toEqual({
        [INSPECTED_VALUE]: arr3,
        valuePreview: '[111, 222]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: 111,
            keyPreview: '0',
            valuePreview: '111',
          },
          {
            [INSPECTED_VALUE]: 222,
            keyPreview: '1',
            valuePreview: '222',
          },
          {
            [INSPECTED_VALUE]: 2,
            keyPreview: 'length',
            valuePreview: '2',
          },
        ],
      });

      expect(inspect(arr4, 2)).toEqual({
        [INSPECTED_VALUE]: arr4,
        valuePreview: '[{…}]',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: obj1,
            keyPreview: '0',
            valuePreview: '{aaa: 111, bbb: {…}}',
            hasChildren: true,
            children: [
              {
                [INSPECTED_VALUE]: 111,
                keyPreview: 'aaa',
                valuePreview: '111',
              },
              {
                [INSPECTED_VALUE]: obj2,
                hasChildren: true,
                keyPreview: 'bbb',
                valuePreview: '{ccc: 222}',
              },
            ],
          },
          {
            [INSPECTED_VALUE]: 1,
            keyPreview: 'length',
            valuePreview: '1',
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
        valuePreview: 'Map(1) {{…} => {…}}',
        hasChildren: true,
      });
    });

    test('depth 1', () => {
      const obj = [{ aaa: 111 }, { bbb: 222 }] as const;

      const map = new Map([obj]);

      expect(inspect(map, 1)).toEqual({
        [INSPECTED_VALUE]: map,
        valuePreview: 'Map(1) {{…} => {…}}',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: obj,
            hasChildren: true,
            keyPreview: '0',
            valuePreview: '[{…}, {…}]',
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
        valuePreview: 'Map(1) {{…} => {…}}',
        hasChildren: true,
        children: [
          {
            [INSPECTED_VALUE]: obj1,
            keyPreview: '0',
            valuePreview: '[{…}, {…}]',
            hasChildren: true,
            children: [
              {
                [INSPECTED_VALUE]: obj2,
                keyPreview: '0',
                valuePreview: '{aaa: 111}',
                hasChildren: true,
              },
              {
                [INSPECTED_VALUE]: obj3,
                keyPreview: '1',
                valuePreview: '{bbb: 222}',
                hasChildren: true,
              },
              {
                [INSPECTED_VALUE]: 2,
                keyPreview: 'length',
                valuePreview: '2',
              },
            ],
          },
        ],
      });
    });
  });
});
