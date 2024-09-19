/* eslint-disable node/prefer-global/process */
import jwt from "jsonwebtoken";

const { VITE_JWT_SECRET } = process.env;

export const getUserIdFromToken = (token: string): number => {
  const decoded = jwt.verify(token, VITE_JWT_SECRET!);
  return Number((decoded as jwt.JwtPayload).userId);
};
