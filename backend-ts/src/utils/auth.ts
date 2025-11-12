import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// JWT Secret (em produção, usar variável de ambiente)
const JWT_SECRET = 'your-secret-key-change-in-production';

// Utilitários de autenticação
export const generateToken = (user: { id: number; email: string }): string => {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): { id: number; email: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: number; email: string };
  } catch {
    return null;
  }
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
