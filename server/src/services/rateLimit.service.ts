import { createHash } from 'node:crypto';
import type { Store, Options } from 'express-rate-limit';
import { RequestCounter } from '../models/RequestCounter.model';
import { env } from '../config/env';

/** Fixed-window counters shared by every replica. Keys contain hashes, never email/IP text. */
export class MongoRateLimitStore implements Store {
  localKeys = false;
  private windowMs = 60_000;
  constructor(public readonly prefix: string) {}
  init(options: Options) { this.windowMs = options.windowMs; }
  private key(key: string) { return `${this.prefix}:${Math.floor(Date.now() / this.windowMs)}:${createHash('sha256').update(key).digest('hex')}`; }
  async increment(key: string) {
    const resetTime = new Date((Math.floor(Date.now() / this.windowMs) + 1) * this.windowMs);
    const counter = await RequestCounter.findOneAndUpdate({ _id: this.key(key) }, { $inc: { count: 1 }, $setOnInsert: { expiresAt: resetTime } }, { upsert: true, new: true });
    return { totalHits: counter!.count, resetTime };
  }
  async decrement(key: string) { await RequestCounter.updateOne({ _id: this.key(key), count: { $gt: 0 } }, { $inc: { count: -1 } }); }
  async resetKey(key: string) { await RequestCounter.deleteOne({ _id: this.key(key) }); }
}
export const productionRateStore = (prefix: string) => env.NODE_ENV === 'production' ? new MongoRateLimitStore(prefix) : undefined;
