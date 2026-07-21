import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthRequest = Request & { user?: { id: number; role: string; email: string } };

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "Authentication required." });
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET || "change-me") as AuthRequest["user"];
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
