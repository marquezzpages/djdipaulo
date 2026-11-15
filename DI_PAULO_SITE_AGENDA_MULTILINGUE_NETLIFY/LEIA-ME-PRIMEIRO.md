# SITE OFICIAL DJ DI PAULO — PT / EN / ES + AGENDA GOOGLE SHEETS

## O que está incluído

- Landing page responsiva em português (`/pt/`), inglês (`/en/`) e espanhol (`/es/`).
- Menu de idiomas, SEO, navegação, fotos, discografia, links oficiais e booking.
- Seção **Agenda / Tour Dates / Fechas**, alimentada por Google Sheets.
- Função serverless em `netlify/functions/agenda.mjs` que valida e devolve apenas eventos futuros com `status = Confirmado` e `publicar = SIM`.
- `netlify.toml` pronto para publicar o diretório `public` e a pasta de funções.

## Planilha já enviada para o seu Google Drive

**Google Drive > DJ Di Paulo > Agenda Oficial DJ Di Paulo.xlsx**

Abrir: https://docs.google.com/spreadsheets/d/12l6XHrP2nJOPhJrvMgbqgKnrwtoKew0M/edit?usp=drivesdk&ouid=112608125129934673786&rtpof=true&sd=true

A planilha é um arquivo `.xlsx` editável no Google Sheets. Para ativar a opção *Publicar na Web*, salve como formato nativo do Google:

1. Abra o link acima.
2. No menu **Arquivo**, escolha **Salvar como Planilhas Google**.
3. Na nova planilha criada, use a guia `AGENDA_PUBLICA` para manter a lista de eventos.
4. Confira todas as informações antes de divulgar.

## Editando as apresentações

Na guia `AGENDA_PUBLICA`, cada linha é um evento.

- `data`: preencha a data completa com ano, preferencialmente no formato `2026-12-19`. A integração também aceita `19/12/2026`.
- `horario`: formato `HH:MM`, por exemplo `22:30`.
- `evento`, `local`, `cidade`, `estado`, `pais`: o que aparecerá no site.
- `ingressos_url`: link completo, iniciando por `https://`, para comprar ingressos.
- `mapa_url`: link alternativo quando não houver link de ingressos.
- `status`: escolha `Confirmado` somente quando tiver certeza da apresentação.
- `publicar`: escolha `SIM` para exibição no site; `NAO` mantém a linha oculta.

O filtro exige simultaneamente **data futura + status Confirmado + publicar SIM**. Datas vencidas, incompletas, em revisão e canceladas são ocultadas.

**Importante:** os 14 eventos que estavam no cartaz foram colocados em revisão porque o cartaz não trazia o ano. Corrija e confirme as datas antes de ativar a publicação.

**Privacidade:** a aba `AGENDA_PUBLICA` será publicada como CSV público. Nunca armazene nessa aba cachês, contatos privados, senhas, contratos ou outras informações confidenciais, inclusive em `observacoes`.

## Conectando o Google Sheets ao site

1. Na planilha convertida, clique em **Arquivo > Compartilhar > Publicar na Web**.
2. Selecione **somente** a guia `AGENDA_PUBLICA` (não a planilha inteira).
3. Escolha o formato **Valores separados por vírgulas (.csv)** e clique em **Publicar**.
4. Copie o URL de publicação retornado pelo Google (geralmente começa com `https://docs.google.com/spreadsheets/.../pub?` e termina em `output=csv`).
5. No Netlify, abra o site > **Project configuration > Environment variables** e crie:

   - **Key:** `GOOGLE_SHEET_CSV_URL`
   - **Value:** o link CSV copiado, completo.

6. Certifique-se de que a variável seja disponibilizada para **Functions**. Faça uma nova implantação (deploy) para aplicar.
7. Abra `https://SEU-SITE.netlify.app/.netlify/functions/agenda` para testar. Deve devolver JSON como `{"events":[],"configured":true}` enquanto não houver eventos confirmados.
8. Edite uma data **real** na planilha, marque `Confirmado` e `SIM`, e o site a exibirá depois da atualização do feed/cache (pode levar alguns minutos).

**Não use o link de edição da planilha como variável; é obrigatório o link de publicação em CSV.**

## Publicando o projeto corretamente no Netlify

### Recomendada — GitHub + Netlify

1. Suba **toda esta pasta do projeto** a um repositório GitHub, preservando a estrutura de diretórios.
2. No Netlify, escolha **Add new project > Import an existing project**, conecte o repositório e publique.
3. O Netlify lerá `netlify.toml`: pasta pública `public`, funções em `netlify/functions`.
4. Em seguida, configure a variável `GOOGLE_SHEET_CSV_URL` e publique novamente.

### Alternativa — Netlify CLI

No seu computador, dentro da pasta deste projeto:

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

Responda às perguntas para conectar/criar um site. A CLI lê a configuração `netlify.toml` e publica HTML e Functions. Se necessário, use `netlify deploy --prod --dir=public --functions=netlify/functions`.

**Atenção:** somente arrastar a pasta `public` no Netlify Drop pode publicar as páginas estáticas, **mas não garante a implantação da função** da agenda. Para agenda conectada, prefira GitHub ou CLI.

## Domínio e SEO

O endereço `https://DOMINIO-A-DEFINIR.com.br` é **um placeholder**, não um domínio real. Antes de liberar indexação e divulgar, substitua todas as ocorrências desse endereço no HTML, no `robots.txt` e no `sitemap.xml` pelo domínio oficial com HTTPS. Depois cadastre o domínio no Google Search Console e envie o sitemap.

## Estrutura técnica

```
DI_PAULO_SITE_AGENDA_MULTILINGUE_NETLIFY/
├── public/
│   ├── index.html, styles.css, script.js, robots.txt, sitemap.xml
│   ├── pt/       ← português
│   ├── en/       ← inglês
│   ├── es/       ← espanhol
│   └── assets/   ← logo e fotografias
├── netlify/
│   └── functions/
│       └── agenda.mjs
├── netlify.toml
└── LEIA-ME-PRIMEIRO.md
```

## Situação atual

- Planilha enviada ao Google Drive: **sim**.
- Planilha convertida em formato nativo Google Sheets: **ainda não** (depende da ação do proprietário no Google).
- Guia publicada como CSV: **ainda não**.
- Variável `GOOGLE_SHEET_CSV_URL` configurada no seu projeto Netlify: **ainda não**.
- Site publicado em seu Netlify: **ainda não**.

Por segurança, o site exibe uma mensagem de que não há datas confirmadas até a configuração da fonte ou a aprovação de shows futuros.
