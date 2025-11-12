'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff, LogIn, UserPlus, Loader2, ArrowLeft } from 'lucide-react';
import { AgileTrackerLogo } from '@/components/agile-tracker-logo';
import { useAuth } from '@/hooks/useAuth';

interface LoginFormData {
  email: string;
  password: string;
}

interface RegisterFormData {
  email: string;
  username: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [loginData, setLoginData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState<RegisterFormData>({
    email: '',
    username: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(loginData.email, loginData.password);
      if (success) {
        router.push('/');
      } else {
        setError('Email ou senha incorretos');
      }
    } catch {
      setError('Erro de conexão. Verifique se o backend está rodando.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('As senhas não coincidem');
      setIsLoading(false);
      return;
    }

    try {
      const success = await register(
        registerData.email,
        registerData.fullName,
        registerData.password
      );
      
      if (success) {
        router.push('/');
      } else {
        setError('Erro ao criar conta. Verifique os dados e tente novamente.');
      }
    } catch {
      setError('Erro de conexão. Verifique se o backend está rodando.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setLoginData({ email: '', password: '' });
    setRegisterData({ email: '', username: '', fullName: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4 relative">
      {/* Botão de voltar */}
      {!isLogin && (
        <button
          onClick={() => {
            setIsLogin(true);
            setError('');
            setRegisterData({ email: '', username: '', fullName: '', password: '', confirmPassword: '' });
          }}
          className="absolute left-4 top-4 p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-all duration-200 z-10 cursor-pointer"
          title="Voltar para login"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
      )}
      
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <AgileTrackerLogo className="h-16 w-16" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AgileTracker</h1>
          <p className="text-gray-600">
            {isLogin ? 'Faça login para continuar' : 'Crie sua conta para começar'}
          </p>
        </div>

        {/* Card de Login/Registro */}
        <Card className="border border-gray-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              {isLogin ? 'Entrar' : 'Criar Conta'}
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              {isLogin 
                ? 'Entre com suas credenciais para acessar sua conta'
                : 'Preencha os dados abaixo para criar sua conta'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Erro */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={isLogin ? loginData.email : registerData.email}
                  onChange={(e) => {
                    if (isLogin) {
                      setLoginData({ ...loginData, email: e.target.value });
                    } else {
                      setRegisterData({ ...registerData, email: e.target.value });
                    }
                  }}
                  required
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Username (apenas no registro) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Nome de usuário
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="seu_usuario"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Nome completo (apenas no registro) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                    Nome completo
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Seu Nome Completo"
                    value={registerData.fullName}
                    onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              {/* Senha */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={isLogin ? loginData.password : registerData.password}
                    onChange={(e) => {
                      if (isLogin) {
                        setLoginData({ ...loginData, password: e.target.value });
                      } else {
                        setRegisterData({ ...registerData, password: e.target.value });
                      }
                    }}
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar senha (apenas no registro) */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirmar senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Botão de submit */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isLogin ? 'Entrando...' : 'Criando conta...'}
                  </>
                ) : (
                  <>
                    {isLogin ? (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Entrar
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Criar Conta
                      </>
                    )}
                  </>
                )}
              </Button>
            </form>

            {/* Toggle entre login e registro */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                <button
                  onClick={toggleMode}
                  className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
                >
                  {isLogin ? 'Criar conta' : 'Fazer login'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>© 2025 AgileTracker. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}
