import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { storage } from "../db/storage";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: "learner" | "teacher" | "admin";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware that resolves the caller's identity.
 * 1. Inspects Clerk session if configured.
 * 2. Checks explicit client headers (e.g. x-user-id or x-role).
 * 3. Falls back to deterministic local identities for preview/demo mode.
 */
export async function resolveUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let clerkUserId: string | null = null;
    try {
      const auth = getAuth(req);
      clerkUserId = auth.userId;
    } catch {
      // Clerk not active or unauthenticated
    }

    const headerUserId = req.headers["x-user-id"] as string | undefined;
    const headerRole = (req.headers["x-user-role"] as string | undefined) === "teacher" ? "teacher" : "learner";

    const effectiveId = clerkUserId || headerUserId || (req.path.startsWith("/teacher") ? "demo-teacher-1" : "demo-learner-1");
    const role: "learner" | "teacher" = req.path.startsWith("/teacher") || headerRole === "teacher" ? "teacher" : "learner";

    const userProfile = await storage.getOrCreateUser(
      effectiveId,
      `${effectiveId}@skillexchanger.com`,
      role === "teacher" ? "Studio Instructor" : "Curious Learner",
      role
    );

    req.user = {
      id: userProfile.id,
      email: userProfile.email,
      fullName: userProfile.fullName,
      role: userProfile.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional strict guard that requires an authenticated user.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.user.id) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}
