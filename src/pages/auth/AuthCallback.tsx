import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Video, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processando autenticação...');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current session to check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error('Erro ao verificar sessão');
        }

        // Handle URL hash for email confirmation or OAuth callback
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // Handle OAuth callback
        if (accessToken && refreshToken) {
          setMessage('Finalizando login com Google...');
          
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) throw error;

          if (data.session) {
            setStatus('success');
            setMessage('Login realizado com sucesso!');
            
            // Refresh profile data
            await refreshProfile();
            
            toast.success('Bem-vindo ao ClipsForge!');
            
            // Check if user needs onboarding
            setTimeout(() => {
              navigate('/onboarding');
            }, 1500);
            return;
          }
        }

        // Handle email confirmation
        if (type === 'signup' || searchParams.get('type') === 'signup') {
          setMessage('Confirmando seu email...');
          
          if (session) {
            setStatus('success');
            setMessage('Email confirmado com sucesso!');
            
            // Refresh profile data
            await refreshProfile();
            
            toast.success('Email confirmado! Bem-vindo ao ClipsForge!');
            
            setTimeout(() => {
              navigate('/onboarding');
            }, 1500);
            return;
          }
        }

        // Handle recovery/password reset
        if (type === 'recovery' || searchParams.get('type') === 'recovery') {
          setMessage('Redirecionando para redefinir senha...');
          setStatus('success');
          
          setTimeout(() => {
            navigate('/auth/reset-password');
          }, 1500);
          return;
        }

        // If we have a session but no specific type, redirect to dashboard
        if (session) {
          setStatus('success');
          setMessage('Autenticação confirmada!');
          
          // Refresh profile data
          await refreshProfile();
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 1500);
          return;
        }

        // No session found, redirect to login
        setStatus('error');
        setMessage('Sessão não encontrada. Redirecionando para login...');
        
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);

      } catch (error: any) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Erro na autenticação. Redirecionando...');
        
        setTimeout(() => {
          navigate('/auth/login');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams, refreshProfile]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-600" />;
    }
  };

  const getAlertVariant = () => {
    switch (status) {
      case 'success':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Video className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              ClipsForge
            </span>
          </div>
        </div>

        {/* Status Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
              {getIcon()}
            </div>
            <CardTitle className="text-2xl">
              {status === 'loading' && 'Processando...'}
              {status === 'success' && 'Sucesso!'}
              {status === 'error' && 'Erro na Autenticação'}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center">
            <Alert variant={getAlertVariant()} className="border-0 bg-transparent">
              <AlertDescription className="text-base">
                {message}
              </AlertDescription>
            </Alert>

            {status === 'loading' && (
              <div className="mt-4 text-sm text-gray-500">
                Aguarde enquanto processamos sua autenticação...
              </div>
            )}

            {status === 'success' && (
              <div className="mt-4 text-sm text-gray-500">
                Você será redirecionado automaticamente em alguns segundos.
              </div>
            )}

            {status === 'error' && (
              <div className="mt-4 text-sm text-gray-500">
                Se o problema persistir, entre em contato com o suporte.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthCallback; 