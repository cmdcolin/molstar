/**
 * Copyright (c) 2018-2023 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { iterableToArray } from "../mol-data/util/array";

// TODO use set@@iterator when targeting es6

export namespace SetUtils {
  export function toArray<T>(set: ReadonlySet<T>) {
    return iterableToArray(set.values());
  }

  /** Test if set a contains all elements of set b. */
  export function isSuperset<T>(setA: ReadonlySet<T>, setB: ReadonlySet<T>) {
    if (setA.size < setB.size) {
      return false;
    }
    for (const elem of setB) {
      if (!setA.has(elem)) {
        return false;
      }
    }
    return true;
  }

  /** Add all elements from `sets` to `out` */
  export function add<T>(out: Set<T>, ...sets: ReadonlySet<T>[]): Set<T> {
    for (const set of sets) {
      for (const elem of set) {
        out.add(elem);
      }
    }
    return out;
  }

  /** Create set containing elements of both set a and set b. */
  export function union<T>(setA: ReadonlySet<T>, setB: ReadonlySet<T>): Set<T> {
    const union = new Set(setA);
    for (const elem of setB) {
      union.add(elem);
    }
    return union;
  }

  export function unionMany<T>(...sets: ReadonlySet<T>[]) {
    const union = new Set<T>();
    for (const set of sets) {
      for (const elem of set) {
        union.add(elem);
      }
    }
    return union;
  }

  export function unionManyArrays<T>(arrays: T[][]) {
    const union = new Set<T>();
    for (const array of arrays) {
      for (const elem of array) {
        union.add(elem);
      }
    }

    return union;
  }

  /** Create set containing elements of set a that are also in set b. */
  export function intersection<T>(
    setA: ReadonlySet<T>,
    setB: ReadonlySet<T>,
  ): Set<T> {
    const intersection = new Set<T>();
    for (const elem of setB) {
      if (setA.has(elem)) {
        intersection.add(elem);
      }
    }
    return intersection;
  }

  export function areIntersecting<T>(
    setA: ReadonlySet<T>,
    setB: ReadonlySet<T>,
  ): boolean {
    for (const elem of setB) {
      if (setA.has(elem)) {
        return true;
      }
    }
    return false;
  }

  export function intersectionSize<T>(
    setA: ReadonlySet<T>,
    setB: ReadonlySet<T>,
  ): number {
    if (setA.size < setB.size) [setA, setB] = [setB, setA];
    let count = 0;
    for (const elem of setB) {
      if (setA.has(elem)) {
        count += 1;
      }
    }
    return count;
  }

  /** Create set containing elements of set a that are not in set b. */
  export function difference<T>(
    setA: ReadonlySet<T>,
    setB: ReadonlySet<T>,
  ): Set<T> {
    const difference = new Set(setA);
    for (const elem of setB) {
      difference.delete(elem);
    }
    return difference;
  }

  /** Number of elements that are in set a but not in set b. */
  export function differenceSize<T>(
    setA: ReadonlySet<T>,
    setB: ReadonlySet<T>,
  ): number {
    let count = setA.size;
    for (const elem of setA) {
      if (setB.has(elem)) {
        count -= 1;
      }
    }
    return count;
  }

  /** Test if set a and b contain the same elements. */
  export function areEqual<T>(setA: ReadonlySet<T>, setB: ReadonlySet<T>) {
    if (setA.size !== setB.size) return false;
    for (const elem of setB) {
      if (!setA.has(elem)) {
        return false;
      }
    }
    return true;
  }
}
