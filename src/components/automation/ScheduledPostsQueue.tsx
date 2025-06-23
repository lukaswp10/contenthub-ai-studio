
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, BarChart3 } from 'lucide-react'

interface ScheduledPostsQueueProps {
  posts: any[]
  onUpdate: () => void
}

export function ScheduledPostsQueue({ posts, onUpdate }: ScheduledPostsQueueProps) {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Fila de Posts</h3>
        <p className="text-muted-foreground mb-6">
          Visualize e gerencie todos os posts agendados
        </p>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Em breve
        </Button>
      </div>
    </div>
  )
}
