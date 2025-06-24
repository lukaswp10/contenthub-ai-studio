import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Video, Mail, CheckCircle, Clock, RefreshCw, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import toast from 'react-hot-toast';

const ConfirmEmail = () => {
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = location.state?.email || '';

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Check for email confirmation in URL (when user clicks email link)
  useEffect(() => {
    const checkEmailConfirmation = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (data.session) {
        toast.success('Email confirmado com sucesso!');
        navigate('/onboarding');
      }
    };

    checkEmailConfirmation();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        toast.success('Email confirmado com sucesso!');
        navigate('/onboarding');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleResendEmail = async () => {
    if (!email) {
      setMessage('Email não encontrado. Tente fazer o registro novamente.');
      return;
    }

    setIsResending(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast.success('Email de confirmação reenviado!');
      setResendCooldown(60); // 60 seconds cooldown
    } catch (err: any) {
      console.error('Erro ao reenviar email:', err);
      setMessage('Erro ao reenviar email. Tente novamente.');
    } finally {
      setIsResending(false);
    }
  };

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

        {/* Confirmation Card */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl">Confirme seu email</CardTitle>
            <CardDescription className="text-base">
              Enviamos um link de confirmação para
              {email && (
                <div className="font-medium text-gray-900 mt-1">{email}</div>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-blue-900 flex items-center">
                <CheckCircle className="mr-2 h-5 w-5" />
                Como confirmar:
              </h3>
              <ol className="text-sm text-blue-800 space-y-1 ml-7">
                <li>1. Abra seu email</li>
                <li>2. Procure por um email do ClipsForge</li>
                <li>3. Clique no link "Confirmar Email"</li>
                <li>4. Você será redirecionado automaticamente</li>
              </ol>
            </div>

            {/* Status Message */}
            {message && (
              <Alert variant="destructive">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="space-y-4">
              <Button
                onClick={handleResendEmail}
                disabled={isResending || resendCooldown > 0}
                variant="outline"
                className="w-full h-12"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    Reenviando...
                  </>
                ) : resendCooldown > 0 ? (
                  <>
                    <Clock className="mr-2 h-5 w-5" />
                    Aguarde {resendCooldown}s para reenviar
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Reenviar email
                  </>
                )}
              </Button>

              <div className="text-center">
                <Link
                  to="/auth/register"
                  className="inline-flex items-center text-sm text-purple-600 hover:text-purple-700 hover:underline"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Voltar ao registro
                </Link>
              </div>
            </div>

            {/* Help */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Não recebeu o email?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Verifique sua caixa de spam/lixo eletrônico</li>
                <li>• Aguarde alguns minutos e tente reenviar</li>
                <li>• Verifique se o email está correto</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Precisa de ajuda?{' '}
            <Link to="/support" className="text-purple-600 hover:underline">
              Entre em contato
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail; 