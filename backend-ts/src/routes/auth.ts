import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';
import { UserCreateSchema, UserLoginSchema } from '../schemas';
import { generateToken, hashPassword, comparePassword } from '../utils/auth';

export default async function authRoutes(fastify: FastifyInstance) {
  // Registro de usuário
  fastify.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = UserCreateSchema.parse(request.body);

      // Verificar se usuário já existe
      const existingUser = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (existingUser) {
        reply.code(400).send({ error: 'Usuário já existe' });
        return;
      }

      // Criar usuário
      const hashedPassword = await hashPassword(body.password);
      const user = await prisma.user.create({
        data: {
          email: body.email,
          password: hashedPassword,
          name: body.name,
        },
      });

      // Gerar token
      const token = generateToken({ id: user.id, email: user.email });

      reply.code(201).send({
        message: 'Usuário criado com sucesso',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch {
      reply.code(500).send({
        error: 'Erro interno do servidor',
      });
    }
  });

  // Login de usuário
  fastify.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = UserLoginSchema.parse(request.body);

      // Buscar usuário
      const user = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!user) {
        reply.code(401).send({ error: 'Credenciais inválidas' });
        return;
      }

      // Verificar senha
      const isValidPassword = await comparePassword(body.password, user.password);
      if (!isValidPassword) {
        reply.code(401).send({ error: 'Credenciais inválidas' });
        return;
      }

      // Gerar token
      const token = generateToken({ id: user.id, email: user.email });

      reply.send({
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch {
      reply.code(400).send({ error: 'Dados inválidos' });
    }
  });

  // Obter perfil do usuário logado
  fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.code(401).send({ error: 'Token não fornecido' });
        return;
      }

      const token = authHeader.substring(7);
      const JWT_SECRET = 'your-secret-key-change-in-production';

      const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
      
      // Buscar dados completos do usuário
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          created_at: true,
        },
      });

      if (!user) {
        reply.code(404).send({ error: 'Usuário não encontrado' });
        return;
      }

      reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
      });
    } catch {
      reply.code(401).send({ error: 'Token inválido' });
    }
  });

  // Obter perfil do usuário logado (alias para /me)
  fastify.get('/profile', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.code(401).send({ error: 'Token não fornecido' });
        return;
      }

      const token = authHeader.substring(7);
      const JWT_SECRET = 'your-secret-key-change-in-production';

      const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
      
      // Buscar dados completos do usuário
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          name: true,
          created_at: true,
        },
      });

      if (!user) {
        reply.code(404).send({ error: 'Usuário não encontrado' });
        return;
      }

      reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
        },
      });
    } catch {
      reply.code(401).send({ error: 'Token inválido' });
    }
  });

  // Endpoint de teste de autenticação
  fastify.get('/test', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        reply.code(401).send({ error: 'Token não fornecido' });
        return;
      }

      const token = authHeader.substring(7);
      const JWT_SECRET = 'your-secret-key-change-in-production';

      const user = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
      reply.send({
        message: 'Autenticação funcionando!',
        user_id: user.id,
        email: user.email,
      });
    } catch {
      reply.code(401).send({ error: 'Token inválido' });
    }
  });

  // Deletar usuário (rota administrativa)
  fastify.delete('/user/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = parseInt(id);

      // Verificar se o usuário existe
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        reply.code(404).send({ error: 'Usuário não encontrado' });
        return;
      }

      // Deletar usuário (cascade vai deletar boards, tasks, etc.)
      await prisma.user.delete({
        where: { id: userId },
      });

      reply.send({ 
        message: `Usuário ${user.email} deletado com sucesso`,
        deletedUser: {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      reply.code(500).send({ error: 'Erro interno do servidor' });
    }
  });

  // Listar todos os usuários (rota administrativa)
  fastify.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          created_at: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      reply.send({
        message: 'Lista de usuários',
        users,
        total: users.length,
      });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      reply.code(500).send({ error: 'Erro interno do servidor' });
    }
  });

  // Deletar usuário por email (rota administrativa)
  fastify.delete('/user-by-email', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email } = request.body as { email: string };

      if (!email) {
        reply.code(400).send({ error: 'Email é obrigatório' });
        return;
      }

      // Verificar se o usuário existe
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        reply.code(404).send({ error: 'Usuário não encontrado' });
        return;
      }

      // Deletar usuário (cascade vai deletar boards, tasks, etc.)
      await prisma.user.delete({
        where: { id: user.id },
      });

      reply.send({ 
        message: `Usuário ${user.email} deletado com sucesso`,
        deletedUser: {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      });
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      reply.code(500).send({ error: 'Erro interno do servidor' });
    }
  });
}
