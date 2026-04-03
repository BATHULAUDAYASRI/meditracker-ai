import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role, email: user.email }, env.jwtSecret, {
    expiresIn: "7d",
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

