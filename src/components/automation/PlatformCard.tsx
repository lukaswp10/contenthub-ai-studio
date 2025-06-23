import { SocialPlatform, SocialAccount } from '@/types/social'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { Plus, Check, AlertCircle, TrendingUp, Users, Clock } from 'lucide-react'

interface PlatformCardProps {
  platform: SocialPlatform
  connectedAccounts: SocialAccount[]
  maxAllowed: number
  onConnect: () => void
  canAdd: boolean
  userPlan: 'free' | 'pro' | 'agency'
}

export function PlatformCard({
  platform,
  connectedAccounts,
  maxAllowed,
  onConnect,
  canAdd,
  userPlan,
}: PlatformCardProps) {
  const isLocked = maxAllowed === 0
  const connectedCount = connectedAccounts.length
  const usagePercentage = maxAllowed > 0 ? (connectedCount / maxAllowed) * 100 : 0

  // Calculate platform analytics
  const totalFollowers = connectedAccounts.reduce((sum, acc) => sum + (acc.total_followers || 0), 0)
  const activeAccounts = connectedAccounts.filter(acc => acc.connection_status === 'connected').length
  const errorAccounts = connectedAccounts.filter(acc => acc.connection_status === 'error').length
  const rateLimitedAccounts = connectedAccounts.filter(acc => acc.connection_status === 'rate_limited').length

  return (
    <div
      className={cn(
        'bg-card rounded-lg border p-4 sm:p-6 transition-all hover:shadow-md',
        isLocked ? 'opacity-60' : 'hover:border-primary/20'
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Platform icon */}
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center text-xl sm:text-2xl text-white flex-shrink-0"
            style={{
              background: platform.bgGradient || platform.color,
            }}
          >
            {platform.icon}
          </div>
          
          {/* Platform info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2 mb-1">
              {platform.name}
              {isLocked && (
                <Badge variant="secondary" className="text-xs">Pro</Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {connectedCount}/{maxAllowed} contas
            </p>
            
            {/* Usage progress bar */}
            {maxAllowed > 0 && (
              <div className="space-y-1">
                <Progress value={usagePercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(usagePercentage)}% do limite usado
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Connect button */}
        {!isLocked && (
          <Button
            size="sm"
            onClick={onConnect}
            disabled={!canAdd}
            variant={canAdd ? 'default' : 'outline'}
            className="w-full sm:w-auto"
          >
            {canAdd ? (
              <>
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Conectar</span>
                <span className="sm:hidden">+</span>
              </>
            ) : (
              'Limite atingido'
            )}
          </Button>
        )}
      </div>

      {/* Analytics for connected accounts */}
      {connectedCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <Users className="h-3 w-3" />
              <span className="text-xs font-medium">{activeAccounts}</span>
            </div>
            <p className="text-xs text-muted-foreground">Ativas</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs font-medium">
                {totalFollowers > 1000000 
                  ? `${(totalFollowers / 1000000).toFixed(1)}M`
                  : totalFollowers > 1000 
                    ? `${(totalFollowers / 1000).toFixed(1)}K`
                    : totalFollowers.toLocaleString()
                }
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Seguidores</p>
          </div>
          
          {errorAccounts > 0 && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                <AlertCircle className="h-3 w-3" />
                <span className="text-xs font-medium">{errorAccounts}</span>
              </div>
              <p className="text-xs text-muted-foreground">Erros</p>
            </div>
          )}
          
          {rateLimitedAccounts > 0 && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                <Clock className="h-3 w-3" />
                <span className="text-xs font-medium">{rateLimitedAccounts}</span>
              </div>
              <p className="text-xs text-muted-foreground">Rate Limit</p>
            </div>
          )}
        </div>
      )}

      {/* Features */}
      <div className="space-y-2 mb-4">
        {platform.features.slice(0, 3).map((feature, index) => (
          <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="truncate">{feature}</span>
          </div>
        ))}
      </div>

      {/* Connected accounts preview */}
      {connectedAccounts.length > 0 && (
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground mb-2">Contas conectadas:</p>
          <div className="flex flex-wrap gap-2">
            {connectedAccounts.slice(0, 3).map(account => (
              <div
                key={account.id}
                className="flex items-center gap-2 bg-muted rounded-full px-2 sm:px-3 py-1"
              >
                <img
                  src={account.avatar_url || `https://ui-avatars.com/api/?name=${account.username}&size=20`}
                  alt={account.username}
                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-full"
                />
                <span className="text-xs sm:text-sm truncate max-w-20 sm:max-w-24">@{account.username}</span>
                <Badge
                  variant={account.connection_status === 'connected' ? 'default' : 'destructive'}
                  className="text-xs px-1 py-0 h-4"
                >
                  {account.connection_status === 'connected' ? '✓' : '!'}
                </Badge>
              </div>
            ))}
            {connectedAccounts.length > 3 && (
              <span className="text-xs sm:text-sm text-muted-foreground px-2">
                +{connectedAccounts.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Upgrade prompt */}
      {isLocked && (
        <div className="bg-muted rounded-lg p-3 mt-4">
          <p className="text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 inline mr-1" />
            Disponível no plano {maxAllowed > 0 ? 'Pro' : 'Agency'}
          </p>
        </div>
      )}
    </div>
  )
}
