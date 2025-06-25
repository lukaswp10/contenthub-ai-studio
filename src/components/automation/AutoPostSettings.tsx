import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import {
    AlertCircle,
    Bot,
    Calendar,
    CheckCircle,
    Clock,
    Facebook,
    Instagram,
    Linkedin,
    Send,
    Settings,
    Target,

    Twitter,
    Video,
    Youtube,
    Zap
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface SocialAccount {
  id: string
  platform: 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'tiktok' | 'linkedin'
  username: string
  connected: boolean
  auto_post: boolean
  followers?: number
  engagement_rate?: number
}

interface AutoPostSettings {
  enabled: boolean
  platforms: Record<string, boolean>
  schedule_time: 'immediate' | 'optimal' | 'custom'
  custom_time: string
  hashtags: string
  caption_template: string
  min_viral_score: number
  auto_optimize: boolean
}

export default function AutoPostSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([])
  const [settings, setSettings] = useState<AutoPostSettings>({
    enabled: false,
    platforms: {
      instagram: false,
      facebook: false,
      twitter: false,
      youtube: false,
      tiktok: false,
      linkedin: false
    },
    schedule_time: 'optimal',
    custom_time: '12:00',
    hashtags: '#viral #clips #content #ai',
    caption_template: '🔥 Novo clip incrível!\n\n{title}\n\n{hashtags}',
    min_viral_score: 70,
    auto_optimize: true
  })

  useEffect(() => {
    loadSocialAccounts()
    loadAutoPostSettings()
  }, [user])

  const loadSocialAccounts = async () => {
    try {
      // Mock data - será substituído por dados reais da API
      setSocialAccounts([
        { 
          id: '1', 
          platform: 'instagram', 
          username: '@meucanal', 
          connected: false, 
          auto_post: false,
          followers: 0,
          engagement_rate: 0
        },
        { 
          id: '2', 
          platform: 'facebook', 
          username: 'Minha Página', 
          connected: false, 
          auto_post: false,
          followers: 0,
          engagement_rate: 0
        },
        { 
          id: '3', 
          platform: 'twitter', 
          username: '@meutwitter', 
          connected: false, 
          auto_post: false,
          followers: 0,
          engagement_rate: 0
        },
        { 
          id: '4', 
          platform: 'youtube', 
          username: 'Meu Canal', 
          connected: false, 
          auto_post: false,
          followers: 0,
          engagement_rate: 0
        },
        { 
          id: '5', 
          platform: 'tiktok', 
          username: '@meutiktok', 
          connected: false, 
          auto_post: false,
          followers: 0,
          engagement_rate: 0
        },
        { 
          id: '6', 
          platform: 'linkedin', 
          username: 'Meu LinkedIn', 
          connected: false, 
          auto_post: false,
          followers: 0,
          engagement_rate: 0
        }
      ])
    } catch (error) {
      console.error('Erro ao carregar contas sociais:', error)
    }
  }

  const loadAutoPostSettings = async () => {
    try {
      // Carregar configurações salvas do usuário
      const { data, error } = await supabase
        .from('user_settings')
        .select('auto_post_settings')
        .eq('user_id', user?.id)
        .single()

      if (!error && data?.auto_post_settings) {
        setSettings(data.auto_post_settings)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const saveAutoPostSettings = async () => {
    try {
      setLoading(true)

      // Salvar configurações no banco
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          auto_post_settings: settings,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      toast({
        title: "Configurações salvas!",
        description: "Suas preferências de postagem automática foram atualizadas.",
      })
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const connectSocialAccount = async (platform: string) => {
    try {
      setLoading(true)

      // Chamar função para conectar conta social
      const { data, error } = await supabase.functions.invoke('connect-social-account', {
        body: { platform }
      })

      if (error) throw error

      // Atualizar estado local
      setSocialAccounts(prev =>
        prev.map(account =>
          account.platform === platform
            ? { ...account, connected: true, username: data.username }
            : account
        )
      )

      toast({
        title: "Conta conectada!",
        description: `Sua conta ${platform} foi conectada com sucesso.`,
      })
    } catch (error) {
      console.error('Erro ao conectar conta:', error)
      toast({
        title: "Erro na conexão",
        description: "Não foi possível conectar sua conta. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-4 w-4" />
      case 'facebook': return <Facebook className="h-4 w-4" />
      case 'twitter': return <Twitter className="h-4 w-4" />
      case 'youtube': return <Youtube className="h-4 w-4" />
      case 'tiktok': return <Video className="h-4 w-4" />
      case 'linkedin': return <Linkedin className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram': return 'text-pink-600'
      case 'facebook': return 'text-blue-600'
      case 'twitter': return 'text-sky-500'
      case 'youtube': return 'text-red-600'
      case 'tiktok': return 'text-black'
      case 'linkedin': return 'text-blue-700'
      default: return 'text-gray-600'
    }
  }

  const getOptimalTimeDescription = (platform: string) => {
    const times = {
      instagram: '18:00-21:00',
      facebook: '15:00-16:00',
      twitter: '12:00-15:00',
      youtube: '14:00-16:00',
      tiktok: '18:00-24:00',
      linkedin: '08:00-10:00'
    }
    return times[platform as keyof typeof times] || '12:00-18:00'
  }

  return (
    <div className="space-y-6">
      {/* Main Settings */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-green-600" />
            Postagem Automática
          </CardTitle>
          <CardDescription>
            Configure a postagem automática dos seus clips nas redes sociais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Auto-Post */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-900">Ativar Automação</p>
                <p className="text-sm text-green-700">Posts automáticos quando clips ficarem prontos</p>
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>

          {settings.enabled && (
            <div className="space-y-6 p-4 bg-gray-50 rounded-lg">
              {/* Scheduling Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Horário de Postagem</Label>
                  <Select
                    value={settings.schedule_time}
                    onValueChange={(value: 'immediate' | 'optimal' | 'custom') =>
                      setSettings(prev => ({ ...prev, schedule_time: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">
                        <div className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Imediatamente
                        </div>
                      </SelectItem>
                      <SelectItem value="optimal">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Horário Otimizado
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Horário Personalizado
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings.schedule_time === 'custom' && (
                  <div>
                    <Label>Horário Personalizado</Label>
                    <Input
                      type="time"
                      value={settings.custom_time}
                      onChange={(e) =>
                        setSettings(prev => ({ ...prev, custom_time: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Content Settings */}
              <div className="space-y-4">
                <div>
                  <Label>Template de Legenda</Label>
                  <Textarea
                    value={settings.caption_template}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, caption_template: e.target.value }))
                    }
                    placeholder="Sua legenda padrão..."
                    className="mt-1"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {'{title}'} para o título do vídeo e {'{hashtags}'} para as hashtags
                  </p>
                </div>

                <div>
                  <Label>Hashtags Padrão</Label>
                  <Input
                    value={settings.hashtags}
                    onChange={(e) =>
                      setSettings(prev => ({ ...prev, hashtags: e.target.value }))
                    }
                    placeholder="#viral #clips #content #ai"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Score Viral Mínimo</Label>
                  <Select
                    value={settings.min_viral_score.toString()}
                    onValueChange={(value) =>
                      setSettings(prev => ({ ...prev, min_viral_score: parseInt(value) }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50">50% - Baixo</SelectItem>
                      <SelectItem value="70">70% - Médio</SelectItem>
                      <SelectItem value="85">85% - Alto</SelectItem>
                      <SelectItem value="95">95% - Muito Alto</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Só postar clips com score acima deste valor
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Otimização Automática</p>
                    <p className="text-sm text-gray-600">Ajustar conteúdo para cada plataforma</p>
                  </div>
                  <Switch
                    checked={settings.auto_optimize}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, auto_optimize: checked }))
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <Button 
            onClick={saveAutoPostSettings}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Social Accounts */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Contas Conectadas
          </CardTitle>
          <CardDescription>
            Conecte suas redes sociais para postagem automática
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {socialAccounts.map((account) => (
            <div key={account.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`${getPlatformColor(account.platform)}`}>
                    {getPlatformIcon(account.platform)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium capitalize">{account.platform}</p>
                      {account.connected ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Conectado
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Desconectado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {account.connected ? account.username : 'Não conectado'}
                    </p>
                    {account.connected && settings.schedule_time === 'optimal' && (
                      <p className="text-xs text-gray-500">
                        Horário otimizado: {getOptimalTimeDescription(account.platform)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {account.connected && settings.enabled && (
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`auto-${account.id}`} className="text-sm">Auto</Label>
                      <Switch
                        id={`auto-${account.id}`}
                        checked={settings.platforms[account.platform]}
                        onCheckedChange={(checked) =>
                          setSettings(prev => ({
                            ...prev,
                            platforms: { ...prev.platforms, [account.platform]: checked }
                          }))
                        }
                      />
                    </div>
                  )}
                  
                  <Button
                    variant={account.connected ? "outline" : "default"}
                    size="sm"
                    onClick={() => connectSocialAccount(account.platform)}
                    disabled={loading}
                    className={account.connected ? "" : "bg-blue-600 hover:bg-blue-700"}
                  >
                    {account.connected ? 'Desconectar' : 'Conectar'}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {settings.enabled && Object.values(settings.platforms).some(Boolean) && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Automação Ativa</span>
              </div>
              <p className="text-sm text-blue-700">
                Clips com score ≥ {settings.min_viral_score}% serão postados automaticamente nas plataformas selecionadas
                {settings.schedule_time === 'optimal' ? ' nos horários otimizados' : 
                 settings.schedule_time === 'custom' ? ` às ${settings.custom_time}` : 
                 ' imediatamente'}.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 