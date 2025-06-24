import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Video, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setIsEmailSent(true);
      toast.success('Email de recuperação enviado!');
    } catch (err: any) {
      console.error('Erro ao enviar email:', err);
      setError(err.message || 'Erro ao enviar email de recuperação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center space-x-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Video className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                ClipsForge
              </span>
            </Link>
          </div>

          {/* Success Card */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Email enviado!</CardTitle>
              <CardDescription className="text-base">
                Enviamos um link de recuperação para
                <div className="font-medium text-gray-900 mt-1">{email}</div>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-blue-900">📧 Próximos passos:</h3>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Verifique sua caixa de entrada</li>
                  <li>2. Clique no link de recuperação</li>
                  <li>3. Crie uma nova senha</li>
                  <li>4. Faça login com a nova senha</li>
                </ol>
              </div>

              <div className="text-center">
                <Link
                  to="/auth/login"
                  className="inline-flex items-center text-purple-600 hover:text-purple-700 hover:underline"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Voltar ao login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Video className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              ClipsForge
            </span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Esqueceu sua senha?
          </h1>
          <p className="text-gray-600">
            Digite seu email para receber um link de recuperação
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl text-center">Recuperar Senha</CardTitle>
            <CardDescription className="text-center">
              Enviaremos um link seguro para redefinir sua senha
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-base"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/auth/login"
                className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 hover:underline"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Voltar ao login
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Help */}
        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">💡 Dica:</h4>
          <p className="text-sm text-gray-600">
            Se não receber o email em alguns minutos, verifique sua pasta de spam/lixo eletrônico.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 