#!/bin/bash

echo "🚀 Deploy GerenciAi para Firebase Hosting"
echo "=========================================="
echo ""

# Usar Node 20
source ~/.nvm/nvm.sh
nvm use 20

# Build do projeto
echo "📦 Fazendo build do projeto..."
npx vite build

# Login no Firebase (apenas primeira vez)
echo ""
echo "🔐 Fazendo login no Firebase..."
echo "   (Uma janela do navegador vai abrir)"
firebase login

# Deploy
echo ""
echo "🚀 Fazendo deploy..."
firebase deploy --only hosting

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "Seu site estará disponível em:"
echo "  • https://gerenciai-476500.web.app"
echo "  • https://gerenciai-476500.firebaseapp.com"
echo ""
echo "Para adicionar domínio customizado (www.gerenciai.com):"
echo "  1. Acesse: https://console.firebase.google.com"
echo "  2. Vá em Hosting > Add custom domain"
echo "  3. Siga as instruções para configurar DNS"
