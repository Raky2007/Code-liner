import { Request, Response, NextFunction } from 'express';
import { User } from '../modules/projects/models';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const LOCAL_USER_ID = '60c72b2f9b1d8a23d4f8e3f2';
const LOCAL_USER_EMAIL = 'local-user@code-liner.local';

export async function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await User.updateOne(
      { _id: LOCAL_USER_ID },
      { $setOnInsert: { email: LOCAL_USER_EMAIL, passwordHash: 'bypassed' } },
      { upsert: true }
    );
  } catch (err) {
    // Ignore duplicate/concurrent upsert race
  }

  req.user = {
    id: LOCAL_USER_ID,
    email: LOCAL_USER_EMAIL,
  };
  
  next();
}
