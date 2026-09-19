# 🎯 Radar de Oportunidades Tech — Simão

Painel de monitoramento de hackathons, desafios de IA e editais de inovação,
alimentado **diretamente pela planilha do Google Drive** (Google Sheets).

## 📁 Estrutura do projeto

```javascript
radar-vercel/
├── index.html        # Estrutura da página
├── css/
│   └── styles.css    # Todos os estilos
├── js/
│   ├── data.js       # Integração com Google Sheets (loader + fallback)
│   └── app.js        # Renderização, filtros, modal e KPIs
└── README.md
```

## 🔗 Como funciona a integração com o Google Drive

O site lê a planilha em tempo real pelo endpoint público **gviz** do Google
Sheets (`https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?...`).

**Não usa API key no front-end** (ela ficaria exposta no código público).
O único requisito é liberar a leitura da planilha:

1. Abra a planilha no Google Sheets
2. **Compartilhar → Acesso geral → "Qualquer pessoa com o link" → Leitor**
3. Pronto — o site já consegue ler os dados.

> 💡 **Cache**: os dados ficam 10 min em cache no navegador (localStorage).
> O botão "Sincronizar com Planilha" força uma nova leitura.
> Se a planilha estiver fora do ar, o site usa o cache e, na última instância,
> os dados embarcados em `js/data.js` (FALLBACK_EVENTS).

### Ajustes possíveis em `js/data.js`

| Constante | O que faz | Padrão |
| --- | --- | --- |
| `SHEET_ID` | ID da planilha no Drive | já configurado |
| `SHEET_NAME` | Nome da **aba** da planilha | `"Página1"` |
| `SHEET_PUBLIC` | `true` se você usar "Arquivo → Compartilhar → Publicar na Web" (atualiza sem delay de cache do Google) | `false` |
| `CACHE_TTL_MS` | Tempo de cache local | 10 min |

⚠️ **Importante sobre o nome da aba**: no arquivo Excel o nome era "Página1",
mas no Google Sheets ela pode ter sido renomeada. Se nada carregar, confira o
nome exato da aba (a guia embaixo da planilha) e atualize `SHEET_NAME`.

## 🚀 Deploy no Vercel via GitHub

### 1. Criar o repositório

```bash
# na pasta do projeto
git init
git add .
git commit -m "Radar de Oportunidades Tech v1"
```

No GitHub: **New repository** → nome `radar-oportunidades-tech` → **Create**.
Depois:

```bash
git remote add origin https://github.com/SEU_USUARIO/radar-oportunidades-tech.git
git branch -M main
git push -u origin main
```

### 2. Conectar na Vercel

1. Acesse [vercel.com](https://vercel.com) e entre com sua conta **GitHub**
2. **Add New → Project**
3. Selecione o repositório `radar-oportunidades-tech`
4. **Framework Preset: Other** (é um site estático puro — sem build)
5. Clique em **Deploy**

Pronto! A cada `git push` na branch `main`, o Vercel redeploya
automaticamente. O site fica em `https://SEU-PROJETO.vercel.app`.

## 🔒 Alternativa: Google Sheets API com chave protegida (opcional)

Se um dia precisar de escrita na planilha ou de dados privados, a forma segura
é esconder a chave numa **Serverless Function** da Vercel:

1. Crie uma API key no [Google Cloud Console](https://console.cloud.google.com)
(API "Google Sheets API" habilitada, restrição por IP/referer)
2. No painel da Vercel: **Settings → Environment Variables → `GOOGLE_API_KEY`**
3. Faça o front chamar `/api/sheet` (função serverless que adiciona a chave
server-side e repassa a resposta)

O endpoint `gviz` usado aqui cobre 100% do caso de leitura pública,
então essa etapa só vale a pena se o radar crescer.

## 📋 Contrato da planilha

O mapeamento de colunas está em `COLUMN_MAP` (data.js). Se você renomear
colunas na planilha, atualize lá. Datas podem vir como número de série do
Excel (ex.: `46282`) ou texto — o loader converte automaticamente.
