import { Injectable, computed, signal } from '@angular/core';
import { SERVICES } from './site.data';
import { MAX_QUOTE_SAMPLES, SERVICE_PRICING } from './service-pricing';

export const MAX_ORDER_SERVICES = 10;
export interface CartLine { service: string; quantity: number }
const STORAGE_KEY = 'hem-order-cart';

/** Services the visitor is about to order together; kept in this browser until the order is submitted. */
@Injectable({ providedIn: 'root' })
export class OrderCart {
  private readonly state = signal<CartLine[]>(this.restore());
  readonly lines = this.state.asReadonly();
  readonly count = computed(() => this.state().length);
  readonly detailed = computed(() => this.state().map(line => {
    const service = SERVICES.find(entry => entry.slug === line.service)!;
    const price = SERVICE_PRICING[line.service];
    return { ...line, title: service.title, unit: price.unit, rateUsd: price.startingUsd ?? 0, totalUsd: (price.startingUsd ?? 0) * line.quantity };
  }));
  readonly totalUsd = computed(() => this.detailed().reduce((sum, line) => sum + line.totalUsd, 0));

  /** Adds a service, or sets its quantity when it is already in the order. Returns false when the order is full. */
  set(service: string, quantity: number): boolean {
    const normalized = this.normalize({ service, quantity });
    if (!normalized) return false;
    const lines = this.state();
    if (!lines.some(line => line.service === service) && lines.length >= MAX_ORDER_SERVICES) return false;
    this.save(lines.some(line => line.service === service) ? lines.map(line => line.service === service ? normalized : line) : [...lines, normalized]);
    return true;
  }
  has(service: string) { return this.state().some(line => line.service === service); }
  remove(service: string) { this.save(this.state().filter(line => line.service !== service)); }
  clear() { this.save([]); }

  private normalize(line: Partial<CartLine>): CartLine | null {
    const price = typeof line.service === 'string' ? SERVICE_PRICING[line.service] : undefined;
    if (!price || price.startingUsd === null || !SERVICES.some(entry => entry.slug === line.service)) return null;
    const max = price.unit === 'sample' ? MAX_QUOTE_SAMPLES : 1;
    const quantity = Number.isInteger(line.quantity) ? Math.min(Math.max(line.quantity!, 1), max) : 1;
    return { service: line.service!, quantity };
  }
  private save(lines: CartLine[]) {
    this.state.set(lines);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); } catch { /* storage unavailable: keep the order in memory */ }
  }
  private restore(): CartLine[] {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(saved)) return [];
      const lines: CartLine[] = [];
      for (const entry of saved) {
        const line = this.normalize(entry);
        if (line && !lines.some(existing => existing.service === line.service) && lines.length < MAX_ORDER_SERVICES) lines.push(line);
      }
      return lines;
    } catch { return []; }
  }
}
