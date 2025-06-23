
import { useState } from 'react'
import { SocialAccount } from '@/types/social'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Settings, Save } from 'lucide-react'

interface PostingScheduleProps {
  accounts: SocialAccount[]
  onUpdate: () => void
}

export function PostingSchedule({ accounts, onUpdate }: PostingScheduleProps) {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Configuração de Agenda</h3>
        <p className="text-muted-foreground mb-6">
          Configure os horários ideais para cada rede social
        </p>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Em breve
        </Button>
      </div>
    </div>
  )
}
