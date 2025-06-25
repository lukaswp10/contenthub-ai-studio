import { AyrshareResponse, SocialAccount, ScheduledPost } from '@/types/social'

const AYRSHARE_API_URL = 'https://app.ayrshare.com/api'

class AyrshareClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request(endpoint: string, method: 'GET' | 'POST' | 'DELETE' = 'GET', data?: any) {
    const response = await fetch(`${AYRSHARE_API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      throw new Error(`Ayrshare API error: ${response.statusText}`)
    }

    return response.json()
  }

  // Get user profiles
  async getProfiles(): Promise<SocialAccount[]> {
    const response = await this.request('/profiles')
    return response.profiles || []
  }

  // Post to social media
  async createPost(postData: {
    post: string
    platforms: string[]
    mediaUrls?: string[]
    scheduleDate?: string
    shortenLinks?: boolean
  }): Promise<AyrshareResponse> {
    return this.request('/post', 'POST', postData)
  }

  // Get post analytics
  async getPostAnalytics(postId: string) {
    return this.request(`/analytics/post/${postId}`)
  }

  // Get profile analytics
  async getProfileAnalytics(profileKey: string, platform: string) {
    return this.request(`/analytics/profile?profileKey=${profileKey}&platform=${platform}`)
  }

  // Delete scheduled post
  async deletePost(postId: string): Promise<AyrshareResponse> {
    return this.request(`/delete/${postId}`, 'DELETE')
  }

  // Get media upload URL
  async getUploadUrl(fileName: string, contentType: string) {
    return this.request('/upload', 'POST', {
      fileName,
      contentType
    })
  }

  // Shorten URL
  async shortenUrl(url: string) {
    return this.request('/shorten', 'POST', { url })
  }
}

// Helper functions for Supabase Edge Functions
export async function connectSocialAccount(platform: string, accessToken: string): Promise<SocialAccount> {
  // This would be called from the connect-social-account edge function
  // Implementation depends on platform-specific OAuth flow
  throw new Error('Implementation needed in Edge Function')
}

export async function schedulePost(
  clipId: string,
  platforms: string[],
  content: string,
  scheduledFor?: string
): Promise<ScheduledPost> {
  // This would be called from the schedule-post edge function
  throw new Error('Implementation needed in Edge Function')
}

export async function getAnalytics(
  accountId: string,
  timeRange: { start: string; end: string }
) {
  // This would be called from an analytics edge function
  throw new Error('Implementation needed in Edge Function')
}

export { AyrshareClient } 