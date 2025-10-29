# 🚀 Setup da Pipeline de CI/CD

## O que foi criado

Pipeline de CI/CD usando GitHub Actions que automaticamente:
- ✅ Faz build do frontend quando houver alterações
- ✅ Faz deploy no App Engine automaticamente
- ✅ Roda apenas quando arquivos relevantes mudarem

## 📋 Configuração Necessária (Uma vez apenas)

### Passo 1: Criar Service Account no GCP

```bash
# 1. Criar service account
gcloud iam service-accounts create github-actions \
    --description="Service Account for GitHub Actions" \
    --display-name="GitHub Actions" \
    --project=gerenciai-476500

# 2. Dar permissões necessárias
gcloud projects add-iam-policy-binding gerenciai-476500 \
    --member="serviceAccount:github-actions@gerenciai-476500.iam.gserviceaccount.com" \
    --role="roles/appengine.deployer"

gcloud projects add-iam-policy-binding gerenciai-476500 \
    --member="serviceAccount:github-actions@gerenciai-476500.iam.gserviceaccount.com" \
    --role="roles/appengine.serviceAdmin"

gcloud projects add-iam-policy-binding gerenciai-476500 \
    --member="serviceAccount:github-actions@gerenciai-476500.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding gerenciai-476500 \
    --member="serviceAccount:github-actions@gerenciai-476500.iam.gserviceaccount.com" \
    --role="roles/cloudbuild.builds.editor"

# 3. Criar e baixar a chave
gcloud iam service-accounts keys create ~/github-actions-key.json \
    --iam-account=github-actions@gerenciai-476500.iam.gserviceaccount.com \
    --project=gerenciai-476500
```

### Passo 2: Adicionar Secret no GitHub

1. **Abra o repositório no GitHub:**
   ```
   https://github.com/ApertAi013/GerenciAi/settings/secrets/actions
   ```

2. **Clique em "New repository secret"**

3. **Adicione o secret:**
   - **Name:** `GCP_SA_KEY`
   - **Value:** Cole o conteúdo completo do arquivo `~/github-actions-key.json`

4. **Clique em "Add secret"**

5. **Delete o arquivo da chave localmente:**
   ```bash
   rm ~/github-actions-key.json
   ```

### Passo 3: Testar a Pipeline

Faça qualquer alteração no código e faça push:

```bash
# Exemplo: alterar um arquivo
echo "// Test pipeline" >> src/App.tsx

# Commit e push
git add src/App.tsx
git commit -m "Test CI/CD pipeline"
git push
```

Acompanhe em:
```
https://github.com/ApertAi013/GerenciAi/actions
```

## 🎯 Como funciona

### Quando a pipeline roda:

A pipeline roda automaticamente quando você faz `git push` alterando:
- Arquivos em `src/` (código React)
- Arquivos em `public/` (assets estáticos)
- `index.html`
- `package.json` ou `package-lock.json`
- `vite.config.ts`
- `app.yaml`
- O próprio arquivo da workflow

### O que a pipeline faz:

1. ✅ Checkout do código
2. ✅ Setup do Node.js 20
3. ✅ Instala dependências (`npm ci`)
4. ✅ Faz build (`vite build`)
5. ✅ Autentica no GCP
6. ✅ Faz deploy no App Engine
7. ✅ Mostra URLs de acesso

### Tempo estimado:

- ⏱️ Build: ~1-2 minutos
- ⏱️ Deploy: ~2-3 minutos
- **Total: ~3-5 minutos**

## 📊 Monitoramento

### Ver logs da pipeline:
```
https://github.com/ApertAi013/GerenciAi/actions
```

### Ver status do deploy no GCP:
```
https://console.cloud.google.com/appengine/versions?project=gerenciai-476500
```

## 🐛 Troubleshooting

### Pipeline falha na autenticação:
- Verifique se o secret `GCP_SA_KEY` está configurado
- Verifique se o JSON está completo e válido

### Pipeline falha no deploy:
- Verifique se a Service Account tem todas as permissões necessárias
- Execute os comandos de permissão novamente

### Build falha:
- Verifique erros de TypeScript localmente: `npm run build`
- Verifique se todas as dependências estão no `package.json`

## 🔒 Segurança

- ✅ Chave da Service Account armazenada como Secret (nunca no código)
- ✅ Service Account com permissões mínimas necessárias
- ✅ Logs de deploy visíveis apenas para colaboradores do repositório

## ✨ Benefícios

- 🚀 **Deploy automático:** Apenas faça `git push`
- 🔄 **Rollback fácil:** Reverter commits = reverter deploy
- 📝 **Histórico:** Todo deploy fica registrado
- 👥 **Colaboração:** Qualquer push no main faz deploy
- ⚡ **Rápido:** ~3-5 minutos do push ao ar
