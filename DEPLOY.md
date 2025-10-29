# 🚀 Deploy GerenciAi

## ✅ Status Atual

**SITE NO AR!** 🎉

- **URL App Engine:** https://gerenciai-476500.ue.r.appspot.com
- **Backend API:** https://gerenciai-backend-798546007335.us-east1.run.app
- **Domínio:** arenai.com.br (pendente configuração)

## Custos

### App Engine (Frontend)
- **GRATUITO** no tier gratuito:
  - 28 horas de instância por dia
  - 1 GB de tráfego por dia
  - 1 GB de armazenamento
- Para sites pequenos/médios = **$0/mês** ✅

### Cloud Run (Backend)
- ~$0-5/mês baseado em uso
- Free tier inclui:
  - 2 milhões de requests/mês
  - 360,000 GB-segundos
  - 180,000 vCPU-segundos

### Cloud SQL (Banco de Dados)
- ~$10-15/mês (instância f1-micro)

### Total Estimado
- **$10-20/mês** (praticamente só o banco de dados!)

## 📝 Atualizar o Site

Sempre que fizer mudanças no código:

```bash
# 1. Fazer build
npx vite build

# 2. Deploy no App Engine
gcloud app deploy --project=gerenciai-476500 --quiet

# Ou tudo de uma vez:
npx vite build && gcloud app deploy --project=gerenciai-476500 --quiet
```

## 🌐 Conectar Domínio Customizado (arenai.com.br)

### Passo 1: Adicionar domínio no App Engine

```bash
gcloud app domain-mappings create arenai.com.br --project=gerenciai-476500
```

Ou via Console:
1. Acesse: https://console.cloud.google.com/appengine/settings/domains?project=gerenciai-476500
2. Clique em **"Add a custom domain"**
3. Digite: `arenai.com.br`
4. Siga o wizard

### Passo 2: Configurar DNS (no seu registrador)

O Google vai te dar registros para adicionar. Exemplo:

**Para apex domain (arenai.com.br):**
```
Tipo: A
Nome: @
Valor: [IPs fornecidos pelo Google]
TTL: 3600
```

**Registros A típicos do App Engine:**
```
216.239.32.21
216.239.34.21
216.239.36.21
216.239.38.21
```

**Para www (www.arenai.com.br):**
```
Tipo: CNAME
Nome: www
Valor: ghs.googlehosted.com
TTL: 3600
```

### Passo 3: Aguardar propagação

- DNS leva de 10 minutos a 48 horas
- Google configura HTTPS automaticamente
- Verifique em: https://console.cloud.google.com/appengine/settings/domains?project=gerenciai-476500

### Passo 4: Adicionar www também

```bash
gcloud app domain-mappings create www.arenai.com.br --project=gerenciai-476500
```

## 🔒 HTTPS

- **Automático!** O Google provisiona certificados SSL gratuitamente
- Pode levar até 24 horas para ativar após DNS propagar
- Renovação automática

## 📊 Monitoramento

### Ver logs do App Engine:
```bash
gcloud app logs tail -s default --project=gerenciai-476500
```

### Ver métricas:
https://console.cloud.google.com/appengine/metrics?project=gerenciai-476500

### Ver tráfego:
https://console.cloud.google.com/appengine/versions?project=gerenciai-476500

## 🐛 Troubleshooting

### Site não carrega
```bash
# Ver logs em tempo real
gcloud app logs tail -s default --project=gerenciai-476500

# Verificar status
gcloud app versions list --project=gerenciai-476500
```

### Erro no deploy
```bash
# Verificar app.yaml
cat app.yaml

# Deploy verbose
gcloud app deploy --project=gerenciai-476500 --verbosity=debug
```

### Domínio não funciona
1. Verificar propagação DNS: https://dnschecker.org
2. Verificar no console: https://console.cloud.google.com/appengine/settings/domains?project=gerenciai-476500
3. Aguardar até 48h

## 📚 Documentação

- App Engine: https://cloud.google.com/appengine/docs
- Custom Domains: https://cloud.google.com/appengine/docs/standard/mapping-custom-domains
- Cloud Run (Backend): https://cloud.google.com/run/docs

## 🔗 URLs Importantes

- **Console GCP:** https://console.cloud.google.com/home/dashboard?project=gerenciai-476500
- **App Engine:** https://console.cloud.google.com/appengine?project=gerenciai-476500
- **Cloud Run:** https://console.cloud.google.com/run?project=gerenciai-476500
- **Cloud SQL:** https://console.cloud.google.com/sql/instances?project=gerenciai-476500
