import mongoose, { ClientSession } from 'mongoose';
import { User } from '../models/User.model';
import { Resume } from '../models/Resume.model';
import { assertRequestActive } from './aiRequestContext.service';

/** Fence writes against account/resume deletion; a read-only existence check is insufficient. */
export async function withOwnedWrite<T>(userId: string, resumeId: string | null, action: (session: ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(async () => {
      assertRequestActive();
      const user = await User.updateOne({ _id: userId }, { $inc: { writeFence: 1 } }, { session });
      if (!user.matchedCount) throw Object.assign(new Error('Your account is no longer available.'), { statusCode: 409, isOperational: true });
      if (resumeId) {
        const resume = await Resume.updateOne({ _id: resumeId, userId }, { $inc: { writeFence: 1 } }, { session });
        if (!resume.matchedCount) throw Object.assign(new Error('This resume was deleted while the request was running.'), { statusCode: 409, isOperational: true });
      }
      const result = await action(session);
      assertRequestActive();
      return result;
    });
  } finally { await session.endSession(); }
}
