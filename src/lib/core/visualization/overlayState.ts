import type { SortEvent } from '../sorting/types';

export interface Highlight {
  kind: 'compare' | 'compare-value' | 'swap' | 'write' | 'read';
  indices: number[];
  aux?: boolean;
  createdAt: number;
  ttl: number;
  label?: string;
  values?: number[];
}

export interface OverlaySnapshot {
  transients: readonly Highlight[];
  sortedRanges: ReadonlyArray<readonly [number, number]>;
  activeRange: readonly [number, number] | null;
  activeIndex: number | null;
  pivotIndex: number | null;
}

const MAX_TRANSIENTS = 8;

/**
 * Tracks persistent sorted regions, scoped partition/active state, and
 * transient operation highlights independently so frequent read/compare events
 * never evict long-lived sorted or pivot markers.
 */
export class OverlayTracker {
  private transients: Highlight[] = [];
  private sortedRanges: Array<[number, number]> = [];
  private activeRange: [number, number] | null = null;
  private activeIndex: number | null = null;
  private pivotIndex: number | null = null;

  snapshot(): OverlaySnapshot {
    return {
      transients: this.transients,
      sortedRanges: this.sortedRanges,
      activeRange: this.activeRange,
      activeIndex: this.activeIndex,
      pivotIndex: this.pivotIndex,
    };
  }

  reset(): void {
    this.transients = [];
    this.sortedRanges = [];
    this.activeRange = null;
    this.activeIndex = null;
    this.pivotIndex = null;
  }

  prepareForStep(): boolean {
    if (this.transients.length === 0) return false;
    this.transients = [];
    return true;
  }

  onPause(): boolean {
    if (this.transients.length === 0) return false;
    if (this.transients.length > 2) {
      this.transients = this.transients.slice(-2);
    }
    for (const item of this.transients) {
      item.ttl = Number.POSITIVE_INFINITY;
    }
    return true;
  }

  onResume(): boolean {
    if (this.transients.length === 0) return false;
    this.transients = [];
    return true;
  }

  setComplete(elementCount: number): void {
    this.transients = [];
    this.activeRange = null;
    this.activeIndex = null;
    this.pivotIndex = null;
    this.sortedRanges = elementCount > 0 ? [[0, elementCount]] : [];
  }

  prune(now: number): boolean {
    if (this.transients.length === 0) return false;
    let write = 0;
    for (let i = 0; i < this.transients.length; i += 1) {
      const item = this.transients[i];
      if (item.ttl === Number.POSITIVE_INFINITY || now - item.createdAt <= item.ttl) {
        this.transients[write] = item;
        write += 1;
      }
    }
    if (write === this.transients.length) return false;
    this.transients.length = write;
    return true;
  }

  applyEvent(event: SortEvent, now: number, ttlMs: number, isPaused: boolean): boolean {
    const ttl = isPaused ? Number.POSITIVE_INFINITY : ttlMs;

    switch (event.type) {
      case 'compare':
        this.pushTransient({
          kind: 'compare',
          indices: [event.i, event.j],
          values: [event.a, event.b],
          aux: event.aux,
          createdAt: now,
          ttl,
        });
        return true;

      case 'compare-value':
        this.pushTransient({
          kind: 'compare-value',
          indices: [event.index],
          values: [event.value, event.against],
          aux: event.aux,
          createdAt: now,
          ttl,
          label: 'KEY',
        });
        return true;

      case 'read':
        if (event.auxKind === 'counts') return false;
        this.pushTransient({
          kind: 'read',
          indices: [event.index],
          values: [event.value],
          aux: event.aux,
          createdAt: now,
          ttl,
        });
        return true;

      case 'swap':
        if (this.activeIndex === event.i || this.activeIndex === event.j) {
          this.activeIndex = null;
        }
        if (this.pivotIndex === event.i) {
          this.pivotIndex = event.j;
        } else if (this.pivotIndex === event.j) {
          this.pivotIndex = event.i;
        }
        this.pushTransient({
          kind: 'swap',
          indices: [event.i, event.j],
          values: [event.a, event.b],
          createdAt: now,
          ttl,
        });
        return true;

      case 'write':
        if (event.auxKind === 'counts') return false;
        this.pushTransient({
          kind: 'write',
          indices: [event.index],
          values: [event.value],
          aux: event.aux,
          createdAt: now,
          ttl,
          label: event.aux ? 'AUX' : 'W',
        });
        return true;

      case 'mark':
        if (event.role === 'pivot') {
          this.pivotIndex = event.indices[0] ?? null;
          return true;
        }
        if (event.role === 'sorted') {
          if (event.range) {
            this.addSortedRange(event.range[0], event.range[1]);
            if (
              this.pivotIndex !== null &&
              this.pivotIndex >= event.range[0] &&
              this.pivotIndex < event.range[1]
            ) {
              this.pivotIndex = null;
            }
          } else {
            for (const idx of event.indices) {
              this.addSortedRange(idx, idx + 1);
              if (this.pivotIndex === idx) this.pivotIndex = null;
            }
          }
          return true;
        }
        if (event.role === 'active' || event.role === 'range') {
          if (event.range) {
            const changedRange =
              !this.activeRange ||
              this.activeRange[0] !== event.range[0] ||
              this.activeRange[1] !== event.range[1];
            this.activeRange = [event.range[0], event.range[1]];
            if (changedRange) this.pivotIndex = null;
          }
          this.activeIndex = event.indices.length > 0 ? event.indices[0] : null;
          return true;
        }
        return false;

      case 'complete':
        return false;

      default:
        return false;
    }
  }

  addSortedRange(start: number, end: number): void {
    if (end <= start) return;
    const len = this.sortedRanges.length;

    if (len === 0) {
      this.sortedRanges.push([start, end]);
      return;
    }

    const last = this.sortedRanges[len - 1];
    if (start > last[1]) {
      this.sortedRanges.push([start, end]);
      return;
    }
    if (start >= last[0] && start <= last[1]) {
      if (end > last[1]) last[1] = end;
      return;
    }

    const first = this.sortedRanges[0];
    if (end >= first[0] && start <= first[0] && (len === 1 || end < this.sortedRanges[1][0])) {
      first[0] = Math.min(first[0], start);
      first[1] = Math.max(first[1], end);
      return;
    }

    // Binary search for first interval whose end >= start.
    let lo = 0;
    let hi = len;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.sortedRanges[mid][1] < start) lo = mid + 1;
      else hi = mid;
    }

    let ns = start;
    let ne = end;
    let mergeEnd = lo;
    while (mergeEnd < len && this.sortedRanges[mergeEnd][0] <= ne) {
      ns = Math.min(ns, this.sortedRanges[mergeEnd][0]);
      ne = Math.max(ne, this.sortedRanges[mergeEnd][1]);
      mergeEnd += 1;
    }

    this.sortedRanges.splice(lo, mergeEnd - lo, [ns, ne]);
  }

  private pushTransient(highlight: Highlight): void {
    this.transients.push(highlight);
    if (this.transients.length > MAX_TRANSIENTS) {
      this.transients.splice(0, this.transients.length - MAX_TRANSIENTS);
    }
  }
}
