#!/usr/bin/env node

/**
 * 🔍 ClipsForge - Deploy Status Checker
 * Verifica automaticamente o status do deploy no Vercel
 * e detecta erros comuns como limites atingidos
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('🔍 Verificando status do deploy...\n');

// Função para executar comandos e capturar erros
function runCommand(command, description) {
  try {
    console.log(`⏳ ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} - OK`);
    return { success: true, output: result };
  } catch (error) {
    console.log(`❌ ${description} - ERRO`);
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

// Verificar se está logado no Vercel
const vercelLogin = runCommand('npx vercel whoami', 'Verificando login Vercel');

if (!vercelLogin.success) {
  console.log('\n🚨 ERRO: Não está logado no Vercel');
  console.log('💡 Execute: npx vercel login');
  process.exit(1);
}

// Verificar status do projeto
const projectStatus = runCommand('npx vercel ls', 'Verificando projetos Vercel');

// Tentar fazer deploy e capturar erros específicos
console.log('\n🚀 Tentando deploy...');
const deployResult = runCommand('npx vercel --prod --yes', 'Deploy para produção');

if (!deployResult.success) {
  const errorOutput = deployResult.output || deployResult.error;
  
  // Detectar tipos específicos de erro
  if (errorOutput.includes('api-deployments-free-per-day')) {
    console.log('\n🚨 LIMITE DE DEPLOY ATINGIDO!');
    console.log('📊 Vercel Free Plan: 100 deploys/dia');
    console.log('⏰ Aguarde o reset (próximas horas) ou faça upgrade');
    console.log('💡 Solução: Aguardar ou upgrade para Pro Plan');
  } else if (errorOutput.includes('build failed')) {
    console.log('\n🚨 ERRO DE BUILD!');
    console.log('🔧 Verifique os logs de build para detalhes');
  } else if (errorOutput.includes('not found')) {
    console.log('\n🚨 PROJETO NÃO ENCONTRADO!');
    console.log('🔗 Reconecte o projeto: npx vercel link');
  } else {
    console.log('\n🚨 ERRO DESCONHECIDO:');
    console.log(errorOutput);
  }
  
  process.exit(1);
} else {
  console.log('\n🎉 DEPLOY REALIZADO COM SUCESSO!');
  console.log(deployResult.output);
} 