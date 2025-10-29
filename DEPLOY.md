# 🚀 Deploy GerenciAi

## Status Atual

✅ **Site já está no ar!**
- URL Temporária: https://storage.googleapis.com/gerenciai-app/index.html
- Backend: https://gerenciai-backend-798546007335.us-east1.run.app

## Fazer Deploy no Firebase Hosting (Recomendado)

### Passo 1: Execute o script de deploy

```bash
./deploy-firebase.sh
```

Ou manualmente:

```bash
# Fazer login no Firebase (só precisa fazer uma vez)
source ~/.nvm/nvm.sh && nvm use 20
firebase login

# Deploy
npx vite build
firebase deploy --only hosting
```

### Passo 2: Acessar seu site

Após o deploy, seu site estará disponível em:
- https://gerenciai-476500.web.app
- https://gerenciai-476500.firebaseapp.com

## Conectar Domínio Customizado (www.gerenciai.com)

### 1. No Firebase Console

1. Acesse: https://console.firebase.google.com/project/gerenciai-476500/hosting
2. Clique em **"Add custom domain"**
3. Digite seu domínio: `gerenciai.com`
4. Firebase vai mostrar os registros DNS necessários

### 2. Na Hostinger (ou seu registrador de domínios)

Configure os seguintes registros DNS:

**Para domínio apex (gerenciai.com):**
```
Tipo: A
Nome: @
Valor: [IP fornecido pelo Firebase]
TTL: 3600
```

**Para www (www.gerenciai.com):**
```
Tipo: A
Nome: www
Valor: [IP fornecido pelo Firebase]
TTL: 3600
```

### 3. Aguardar propagação

- DNS leva de 10 minutos a 48 horas para propagar
- Firebase configura HTTPS automaticamente
- Você pode verificar em: https://console.firebase.google.com/project/gerenciai-476500/hosting

## Atualizações Futuras

Sempre que fizer mudanças no código:

```bash
# Build
npx vite build

# Deploy
firebase deploy --only hosting
```

Ou simplesmente:

```bash
./deploy-firebase.sh
```

## Custos

**Firebase Hosting:** GRATUITO
- 10 GB de armazenamento
- 360 MB/dia de transferência
- Certificado SSL gratuito
- CDN global incluído

**Backend (Cloud Run):** ~$0-5/mês
- Baseado em uso
- Free tier generoso

## Suporte

Se tiver problemas:
1. Verifique os logs: `firebase hosting:channel:list`
2. Console do Firebase: https://console.firebase.google.com
3. Documentação: https://firebase.google.com/docs/hosting
