
import { SocialPlatform, SocialAccount } from '@/types/social'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Plus, Check, AlertCircle } from 'lucide-react'

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

  return (
    <div
      className={cn(
        'bg-card rounded-lg border p-6 transition-all',
        isLocked ? 'opacity-60' : 'hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Platform icon */}
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl text-white"
            style={{
              background: platform.bgGradient || platform.color,
            }}
          >
            {platform.icon}
          </div>
          
          {/* Platform info */}
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              {platform.name}
              {isLocked && (
                <Badge variant="secondary">Pro</Badge>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">
              {connectedAccounts.length}/{maxAllowed} contas
            </p>
          </div>
        </div>

        {/* Connect button */}
        {!isLocked && (
          <Button
            size="sm"
            onClick={onConnect}
            disabled={!canAdd}
            variant={canAdd ? 'default' : 'outline'}
          >
            {canAdd ? (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Conectar
              </>
            ) : (
              'Limite atingido'
            )}
          </Button>
        )}
      </div>

      {/* Features */}
      <div className="space-y-2 mb-4">
        {platform.features.slice(0, 3).map((feature, index) => (
          <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span>{feature}</span>
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
                className="flex items-center gap-2 bg-muted rounded-full px-3 py-1"
              >
                <img
                  src={account.avatar_url || `https://ui-avatars.com/api/?name=${account.username}&size=20`}
                  alt={account.username}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-sm">@{account.username}</span>
                <Badge
                  variant={account.connection_status === 'connected' ? 'default' : 'destructive'}
                  className="text-xs px-1 py-0"
                >
                  {account.connection_status === 'connected' ? '✓' : '!'}
                </Badge>
              </div>
            ))}
            {connectedAccounts.length > 3 && (
              <span className="text-sm text-muted-foreground px-2">
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
