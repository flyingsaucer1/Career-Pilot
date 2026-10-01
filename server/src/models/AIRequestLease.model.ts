import { Schema, model } from 'mongoose';
const schema = new Schema({
  _id: { type: String, required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const AIRequestLease = model('AIRequestLease', schema);
