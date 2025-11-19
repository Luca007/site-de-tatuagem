# TattooSite Starter Kit

Portfólio estático para tatuadores com editor visual, agenda colaborativa, chat com prova d'água em imagens e deploy direto no GitHub Pages. Tudo roda apenas com HTML/CSS/JS e um backend Firebase (Auth + Firestore).

## Sumário

1. [Visão geral](#visão-geral)
2. [Principais recursos](#principais-recursos)
3. [Arquitetura e stack](#arquitetura-e-stack)
4. [Estrutura do projeto](#estrutura-do-projeto)
5. [Pré-requisitos](#pré-requisitos)
6. [Configuração do Firebase](#configuração-do-firebase)
7. [Upload gratuito de imagens via GitHub](#upload-gratuito-de-imagens-via-github)
8. [Execução local](#execução-local)
9. [Fluxos principais](#fluxos-principais)
10. [Segurança e regras](#segurança-e-regras)
11. [Deployment no GitHub Pages](#deployment-no-github-pages)
12. [Roadmap e próximos passos](#roadmap-e-próximos-passos)
13. [Licenças](#licenças)

## Visão geral

O TattooSite oferece uma experiência completa para artistas: o tatuador autentica-se, arrasta blocos para compor o portfólio, administra agenda e responde clientes em tempo real. As informações são guardadas no Firestore e o front-end é publicado no GitHub Pages, garantindo custo zero de hosting. Para manter o armazenamento de imagens gratuito, o projeto envia anexos para um repositório GitHub do próprio artista e os serve via CDN (jsDelivr).

## Principais recursos

- **Editor visual** (`js/editor.js`, `js/components.js`): grid responsivo com blocos de texto, imagem, vídeo, depoimentos, botões e listas de serviços. Suporta drag & drop com `interact.js`, snapping inteligente e preferências salvas localmente.
- **Canvas configurável**: modal dedicado (`#canvas-settings`) para definir margens e dimensões em porcentagem, permitindo adaptar o layout a diferentes viewports antes de publicar.
- **Agenda colaborativa** (`js/calendar.js`): utiliza Toast UI Calendar para slots disponíveis, reservas completas, bloqueio rápido e painel lateral com pedidos pendentes/confirmados. Clientes autenticados conseguem solicitar horários e o pedido dispara uma mensagem automática no chat.
- **Chat com provas d'água** (`js/chat.js`, `js/watermark.js`, `js/editor-upload.js`): conversas sincronizadas via Firestore, upload opcional de imagens com marca d'água “PREVIEW – © artista” e armazenamento gratuito usando GitHub + jsDelivr.
- **Integrações Firebase** (`js/auth.js`, `js/firebase.js`, `js/db.js`): autenticação por email/senha ou Google, perfis persistidos em `users`, layouts em `portfolio`, agenda em `availability` e reservas em `bookings`.
- **Painel de configurações** (`js/main.js`): preferências de grade/snapping/autosalvar, formulário de perfil, atualização de email/senha e formulário para informar owner/repo/branch/token usados no upload para GitHub.

## Arquitetura e stack

- **Front-end**: HTML sem build step, CSS em `styles.css` e ES Modules (navegador moderno).
- **Bibliotecas via CDN**: Toast UI Calendar, `interact.js`, Firebase SDK 10.13.1. Podem ser baixadas para `vendor/` se preferir empacotar offline.
- **Backend**: Firebase Auth + Firestore. Não há Cloud Functions. Firestore guarda todo o estado (layout, usuários, disponibilidade, chats, bookings) e dispara atualizações em tempo real via `onSnapshot`.
- **Armazenamento gratuito de mídia**: upload para um repositório GitHub privado/público configurado nas preferências. Cada envio gera commit via API, e as imagens são servidas pelo jsDelivr, evitando uso de Firebase Storage (que está bloqueado por regra).
- **Hospedagem**: GitHub Pages (branch `main` ou `docs`).

## Estrutura do projeto

```text
├── assets/                # Logo e ícones
├── js/
│   ├── auth.js            # Fluxos de login, perfil e papéis (tattooer/cliente)
│   ├── calendar.js        # Agenda, slots e pedidos
│   ├── chat.js            # Conversas, uploads e booking requests
│   ├── components.js      # Catálogo de blocos do editor
│   ├── editor.js          # Drag & drop, canvas e salvamento no Firestore
│   ├── editor-upload.js   # Fluxo de upload GitHub
│   ├── github.js          # Persistência local do token e helpers jsDelivr
│   ├── main.js            # Bootstrap geral e formulários do painel
│   ├── ui.js              # Navegação, toasts e helpers visuais
│   └── ...                # firebase.js, db.js, watermark.js etc.
├── firestore.rules        # Regras de coleção (users, portfolio, chats...)
├── storage.rules          # Bloqueia Firebase Storage (usar GitHub)
├── index.html             # Layout principal, modais e views
├── styles.css             # Camadas de layout e componentes
└── vendor/README.md       # Como baixar libs locais se necessário
```

## Pré-requisitos

1. **Node opcional**: não há dependências obrigatórias, mas `live-server` ou outro servidor estático facilita o desenvolvimento local.
2. **Conta Firebase** com projeto criado.
3. **Conta GitHub** com repositório para armazenar imagens (pode ser o mesmo ou um repo dedicado a assets).
4. **Token GitHub (PAT)** com escopo mínimo `contents:write` limitado ao repositório de mídias.

## Configuração do Firebase

1. Ative **Authentication** (Email/Senha e/ou Google) e **Firestore**.
2. Em *Authentication → Settings → Authorized domains* inclua `seuusuario.github.io` e qualquer domínio customizado usado no Pages.
3. Copie as credenciais web e atualize `js/firebase.js` (objeto `firebaseConfig`).
4. Publique as regras fornecidas:
    - `firebase deploy --only firestore:rules`
    - `firebase deploy --only storage:rules`
5. Coleção/resumos utilizados:
    - `users/{uid}`: perfil e papel (`tattooer` ou `client`).
    - `portfolio/{uid}` e `portfolio/public`: layout publicado, usado para visitantes.
    - `availability/{uid}`: slots exibidos no calendário.
    - `bookings/{bookingId}`: pedidos confirmados/cancelados.
    - `chats/{chatId}/messages`: mensagens e anexos referenciando URLs externas.

> **Por que o Storage está bloqueado?** Até que haja necessidade real de uso pago, mantemos `storage.rules` negando todo acesso. Toda mídia fica no GitHub, cumprindo o requisito de armazenamento gratuito.

## Upload gratuito de imagens via GitHub

1. Crie um repositório (ex.: `tattooer/portfolio-assets`).
2. Gere um PAT com `contents:write` e configure no painel **Configurações → Upload GitHub** (os dados ficam apenas no `localStorage`).
3. Ao enviar imagens no chat ou editor, o arquivo recebe marca d'água em `js/watermark.js`, é convertido para base64 em `js/editor-upload.js` e commitado via API.
4. As URLs retornadas já apontam para a CDN `https://cdn.jsdelivr.net/gh/<owner>/<repo>@<branch>/<path>`.
5. Tokens podem ser removidos com “Apagar token local”. Nenhuma credencial é enviada ao Firestore.

## Execução local

```bash
# Servir localmente (exemplo)
npm install --global live-server
live-server

# ou use a extensão "Live Server" do VS Code / outro servidor estático
```

A aplicação usa apenas APIs nativas do navegador. Se preferir, abra `index.html` diretamente, lembrando que alguns recursos (Firebase, módulos) exigem protocolo `http://`.

## Fluxos principais

- **Autenticação & papéis**: ao entrar, o usuário ganha um documento em `users`. Apenas perfis com `role = tattooer` podem editar o layout, publicar agenda ou visualizar configurações avançadas.
- **Editor**: `loadPortfolio()` busca o layout publicado ou o do artista logado. Blocos são arrastados, configurados e salvos como JSON no Firestore. Preferências (grid, snapping, autosave) ficam no `localStorage`.
- **Agenda & reservas**: tatuador cria slots (status aberto/bloqueado). Clientes autenticados selecionam um horário e o sistema cria um `booking` + mensagem automática no chat.
- **Chat**: conversa entre artista e cliente fica em `chats/{tattooer_client}` com subcoleção `messages`. Ao fazer upload de imagem, o arquivo passa pelo `addWatermark()` e segue para GitHub antes de ser referenciado.
- **Perfil & conta**: formulários em Configurações atualizam `users/{uid}` e, quando aplicável, o perfil do Firebase Auth (displayName/email/senha).

## Segurança e regras

- `firestore.rules` restringe escrita de `portfolio`, `availability`, `bookings` e `chats` ao tatuador autenticado. Clientes só podem criar mensagens/pedidos relacionados às conversas onde participam.
- `storage.rules` bloqueia completamente o bucket, garantindo que nenhum upload vá parar no Firebase Storage sem revisão.
- Antes de publicar o projeto, execute `firebase emulators:start` para validar as regras localmente, se desejar.

## Deployment no GitHub Pages

1. Habilite Pages no repositório (`Settings → Pages → Deploy from branch`, selecione `main` e `/root`).
2. Aguarde o build do Pages e acesse `https://seuusuario.github.io/site-de-tatuagem/`.
3. Adicione o domínio ao Firebase (ver seção de pré-requisitos) para que Auth funcione no ambiente publicado.
4. Para atualizar, basta fazer push no `main`; não há etapa de build.

## Roadmap e próximos passos

- [ ] Finalizar a etapa de publicação pública automática para múltiplos tatuadores (hoje expõe apenas `portfolio/public`).
- [ ] Adicionar fila de notificações por email/Push para novos bookings.
- [ ] Criar preset de blocos adicionais (FAQ, mapa, galeria mosaico).
- [ ] Investigar alternativa adicional de armazenamento gratuito (ex.: Cloudinary free tier) para quem não quiser usar GitHub.
- [ ] Automatizar testes de regras Firestore com emuladores.

Sugira melhorias abrindo uma issue ou enviando um PR.

## Licenças

- [Toast UI Calendar](https://github.com/nhn/tui.calendar) – MIT
- [interact.js](https://github.com/taye/interact.js/) – MIT
- [Firebase SDK](https://firebase.google.com/support/release-notes/js) – Apache 2.0
- Todo o restante do código deste repositório – MIT (ajuste conforme necessário para o seu projeto)

Personalize conforme sua identidade visual e expanda os blocos do editor sempre que precisar.
