# ArenaAi Landing Page

Landing page hero split layout para o produto ArenaAi - Gestão de Quadras Inteligente.

## 🚀 Como testar localmente

### Opção 1: Abrir diretamente no navegador
```bash
open index.html
# ou apenas dar duplo clique no arquivo index.html
```

### Opção 2: Usar servidor local (recomendado)
```bash
# Se tiver Python 3 instalado
cd /Users/mateuscoelho/GerenciAi/landing-page
python3 -m http.server 8000

# Depois abra no navegador:
# http://localhost:8000
```

### Opção 3: Usar Live Server (VS Code)
1. Instale a extensão "Live Server" no VS Code
2. Clique com botão direito no `index.html`
3. Selecione "Open with Live Server"

## 📸 Adicionar a imagem do hero

Para adicionar a imagem do gestor esportivo:

1. Salve a imagem como `hero-person.png`
2. Coloque no diretório: `landing-page/assets/images/hero-person.png`

**Especificações recomendadas da imagem:**
- Formato: PNG com fundo transparente
- Dimensões: 1000x1400px (ou proporção similar)
- Pessoa em pé segurando um tablet
- Fundo removido (recorte limpo)
- Iluminação frontal

**Alternativa:** Se quiser usar a imagem que você mencionou, basta renomeá-la para `hero-person.png` e colocar na pasta `assets/images/`.

## 🎨 Estrutura do projeto

```
landing-page/
├── index.html          # Estrutura HTML
├── style.css           # Estilos e design
├── script.js           # Interatividade e animações
├── README.md           # Este arquivo
└── assets/
    └── images/
        └── hero-person.png  # Imagem do gestor (adicionar aqui)
```

## ✨ Features implementadas

- ✅ Layout hero split (50/50)
- ✅ Navbar com logo, links e botões
- ✅ Headline grande e impactante
- ✅ Texto de suporte com descrição do produto
- ✅ Botão CTA principal
- ✅ Background laranja no lado direito
- ✅ Círculos concêntricos (efeito radar)
- ✅ Cards flutuantes de dashboard
- ✅ Animações e efeitos parallax
- ✅ Design responsivo
- ✅ Smooth scroll
- ✅ Hover effects nos botões

## 🎯 Próximos passos

1. Adicionar a imagem do hero
2. Testar no navegador
3. Ajustar cores/textos se necessário
4. Criar seções adicionais (Recursos, IA, Contato)
5. Integrar com formulário de contato
6. Deploy em produção

## 📝 Notas técnicas

- Design System:
  - Cores: #1a1a1a (dark), #f04f28 (orange), #ffffff (white)
  - Font: System fonts (Apple/Roboto)
  - Animações: CSS3 + JavaScript

- Compatibilidade:
  - Chrome/Edge/Safari/Firefox (últimas versões)
  - Responsivo: Desktop, Tablet, Mobile

- Performance:
  - Sem dependências externas
  - CSS puro (sem frameworks)
  - JavaScript vanilla
  - Leve e rápido
