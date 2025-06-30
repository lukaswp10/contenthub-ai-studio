// Script para configurar Auth Settings via código
// Execute: node scripts/configure-supabase-auth.js

const SUPABASE_PROJECT_ID = 'rgwbtdzdeibobuveegfp'

const authConfig = {
  // Site URL
  site_url: 'https://clipsforge.vercel.app',
  
  // Redirect URLs
  additional_redirect_urls: [
    'https://clipsforge.vercel.app/login',
    'https://clipsforge.vercel.app/dashboard',
    'https://clipsforge.vercel.app/auth/callback',
    'http://localhost:8081/login',
    'http://localhost:8081/dashboard'
  ],
  
  // Email confirmations
  enable_confirmations: true,
  confirm_email_change: true
}

console.log('🔧 CONFIGURAÇÃO SUPABASE AUTH')
console.log('================================')
console.log('')
console.log('📋 VALORES PARA CONFIGURAR MANUALMENTE:')
console.log('')
console.log('🌐 Site URL:')
console.log(authConfig.site_url)
console.log('')
console.log('🔄 Redirect URLs (uma por linha):')
authConfig.additional_redirect_urls.forEach(url => {
  console.log(url)
})
console.log('')
console.log('🔗 Links diretos:')
console.log(`• Auth Settings: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/auth/settings`)
console.log(`• Email Templates: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/auth/templates`)
console.log('')
console.log('✅ Copie os valores acima e cole nos campos correspondentes!') 