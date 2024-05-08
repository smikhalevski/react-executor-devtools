export const SOURCE_OBJECT = Symbol();

/**
 * The result of the value inspection.
 */
export interface Inspection {
  /**
   * The value from which this inspection was produced.
   */
  [SOURCE_OBJECT]?: object;

  /**
   * The preview of the inspected key.
   */
  key?: string;

  /**
   * The preview of the inspected value.
   */
  value: string;

  /**
   * `true` if the inspected object has children.
   */
  hasChildren?: boolean;

  /**
   * The array of child property inspections, or `undefined` if there are no children, or they weren't inspected.
   */
  children?: Inspection[];
}

export interface InspectOptions {
  /**
   * The maximum number of properties rendered in the preview.
   */
  maxProperties?: number;

  /**
   * The maximum length of the string preview.
   */
  maxStringLength?: number;
}

/**
 * Inspects the given value and values in its properties.
 *
 * @param value The value to inspect.
 * @param depth The depth for which the inspection is performed.
 * @param options Additional options.
 * @returns The tree of {@link Inspection} objects.
 */
export function inspect(value: unknown, depth = 0, options: InspectOptions = {}): Inspection {
  if (
    value === null ||
    typeof value !== 'object' ||
    value instanceof Number ||
    value instanceof Boolean ||
    value instanceof String ||
    value instanceof Symbol ||
    value instanceof BigInt
  ) {
    return {
      key: undefined,
      value: previewValue(value, 0, options),
    };
  }

  let hasChildren: boolean | undefined;
  let children: Inspection[] | undefined;
  let child: Inspection;

  if (isIterable(value) && !isArrayOrTypedArray(value)) {
    try {
      for (const item of value) {
        hasChildren = true;

        if (depth === 0) {
          break;
        }
        children ||= [];
        child = inspect(item, depth - 1, options);
        child.key = previewKey(children.length);
        children.push(child);
      }
    } catch {
      // noop
    }
  }

  if (depth !== 0 || !hasChildren) {
    for (const key of Reflect.ownKeys(value)) {
      hasChildren = true;

      if (depth === 0) {
        break;
      }
      children ||= [];
      child = inspect(value[key as keyof object], depth - 1, options);
      child.key = previewKey(key);
      children.push(child);
    }
  }

  return {
    key: undefined,
    value: previewValue(value, 2, options),
    [SOURCE_OBJECT]: value,
    hasChildren,
    children,
  };
}

export function previewKey(key: PropertyKey): string {
  return key.toString();
}

/**
 * Generates a human-readable preview of an arbitrary value.
 *
 * @example
 * // depth = 0
 * 111
 * "aaa…"
 * MyClass
 * {…}
 * […]
 * Map(3)
 * Set(3)
 *
 * // depth = 2
 * MyClass {aaa: 111}
 * {aaa: {…}, bbb: […], ccc: 333, …}
 * [{…}, […]]
 * Map(3) {"aaa" => 111, "bbb" => 222, …}
 * Set(3) {"aaa", 111, …}
 *
 * @param value The value to create preview for.
 * @param detail The level of the preview detail.
 * - If 0 then the preview doesn't include children.
 * - If 1 then the preview includes children without details.
 * - If 2 then children are inspected and included in preview.
 * @param options Additional options.
 */
export function previewValue(value: unknown, detail: number = 2, options: InspectOptions = {}): string {
  const { maxProperties = 5, maxStringLength = 200 } = options;

  let str = '';

  if (
    value === null ||
    value === undefined ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof Number ||
    value instanceof Boolean
  ) {
    return String(value);
  }

  if (typeof value === 'string' || value instanceof String) {
    str = JSON.stringify(value).replace(/\\\\/g, '\\');

    return str.length > maxStringLength + 2 ? ellipsis(str, maxStringLength) + '"' : str;
  }

  if (typeof value === 'symbol' || value instanceof Symbol) {
    return value.toString();
  }

  if (typeof value === 'bigint' || value instanceof BigInt) {
    return value + 'n';
  }

  if (typeof value === 'function') {
    return detail < 2 ? 'ƒ' : value.name.length === 0 ? 'ƒ ()' : 'ƒ ' + value.name + '()';
  }

  let label = getConstructorName(value);
  let index = 0;

  if (isArrayOrTypedArray(value)) {
    const { length } = value;

    if (label !== undefined) {
      label += '(' + length + ')';
    }

    if (detail === 0 || length === 0) {
      return label !== undefined ? label : length === 0 ? '[]' : 'Array(' + length + ')';
    }

    while (index < length) {
      if (index > 0) {
        str += ', ';
      }
      if (index === maxProperties) {
        str += '…';
        break;
      }
      str += previewValue(value[index++], 0, options);
    }

    return (label !== undefined ? label + ' ' : '') + '[' + str + ']';
  }

  if (value instanceof ArrayBuffer) {
    return label + '(' + value.byteLength + ')';
  }

  if (value instanceof Set) {
    label += '(' + value.size + ')';

    if (detail === 0 || value.size === 0) {
      return label!;
    }

    for (const item of value) {
      if (index > 0) {
        str += ', ';
      }
      if (index++ === maxProperties) {
        str += '…';
        break;
      }
      str += previewValue(item, 0, options);
    }

    return label + ' {' + str + '}';
  }

  if (value instanceof Map) {
    label += '(' + value.size + ')';

    if (detail === 0 || value.size === 0) {
      return label!;
    }

    for (const entry of value) {
      if (index > 0) {
        str += ', ';
      }
      if (index++ === maxProperties) {
        str += '…';
        break;
      }
      str += previewValue(entry[0], 0, options) + ' => ' + previewValue(entry[1], 0, options);
    }

    return label + ' {' + str + '}';
  }

  if (detail === 0 && label !== undefined) {
    return label;
  }

  if (isIterable(value)) {
    try {
      for (const item of value) {
        if (detail === 0) {
          return '{…}';
        }
        if (index > 0) {
          str += ', ';
        }
        if (index++ === maxProperties) {
          str += '…';
          break;
        }
        str += previewValue(item, 0, options);
      }
    } catch {
      // noop
    }
  }

  // Properties
  if (index <= maxProperties) {
    for (const key of Reflect.ownKeys(value)) {
      if (detail === 0) {
        return '{…}';
      }
      if (index > 0) {
        str += ', ';
      }
      if (index++ === maxProperties) {
        str += '…';
        break;
      }
      str += key.toString() + ': ' + previewValue(value[key as keyof object], 0, options);
    }
  }

  if (detail === 0 || index === 0) {
    return label !== undefined ? label : '{}';
  }

  return (label !== undefined ? label + ' ' : '') + '{' + str + '}';
}

function isIterable(value: object): value is Iterable<unknown> {
  return Symbol.iterator in value;
}

function isArrayOrTypedArray(value: unknown): value is ArrayLike<unknown> {
  return Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView));
}

/**
 * Looks upwards the prototype chain for the non-empty constructor name.
 */
function getConstructorName(value: object): string | undefined {
  let name: string | undefined;
  let p: any = value;

  while (
    (p = Object.getPrototypeOf(p)) !== null &&
    typeof p.constructor === 'function' &&
    p.constructor !== Object &&
    p.constructor !== Array &&
    (name = p.constructor.name) === ''
  ) {
    name = undefined;
  }

  return name;
}

/**
 * Adds ellipsis to the string after the given length.
 */
function ellipsis(str: string, maxLength: number): string {
  return str.length > maxLength ? RegExp(`^.{0,${maxLength}}\\b(?=\\s)|^.{0,${maxLength}}`).exec(str) + '…' : str;
}
