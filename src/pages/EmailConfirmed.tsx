import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const EmailConfirmed = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type');

        if (type === 'signup' && token) {
          // Verifica se o email foi confirmado
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'signup'
          });

          if (error) {
            setStatus('error');
            setMessage('Link de confirmação inválido ou expirado.');
            toast({
              title: "Erro na confirmação",
              description: "Link de confirmação inválido ou expirado.",
              variant: "destructive"
            });
          } else {
            setStatus('success');
            setMessage('Email confirmado com sucesso! Você pode fazer login agora.');
            toast({
              title: "Email confirmado!",
              description: "Sua conta foi ativada com sucesso.",
            });
          }
        } else {
          // Fallback para confirmações diretas
          setStatus('success');
          setMessage('Email confirmado com sucesso! Você pode fazer login agora.');
          toast({
            title: "Email confirmado!",
            description: "Sua conta foi ativada com sucesso.",
          });
        }
      } catch (error) {
        setStatus('error');
        setMessage('Erro ao confirmar email. Tente novamente.');
        toast({
          title: "Erro",
          description: "Erro ao confirmar email. Tente novamente.",
          variant: "destructive"
        });
      }
    };

    handleEmailConfirmation();
  }, [searchParams, toast]);

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">ContentHub AI</span>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
              {status === 'error' && <XCircle className="h-6 w-6 text-red-600" />}
              {status === 'loading' && 'Confirmando email...'}
              {status === 'success' && 'Email confirmado!'}
              {status === 'error' && 'Erro na confirmação'}
            </CardTitle>
            <CardDescription>
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'success' && (
              <Button onClick={handleLoginRedirect} className="w-full">
                Fazer Login
              </Button>
            )}
            {status === 'error' && (
              <div className="space-y-2">
                <Button onClick={() => navigate('/register')} className="w-full">
                  Criar Nova Conta
                </Button>
                <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
                  Tentar Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailConfirmed;