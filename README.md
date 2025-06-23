# Supabase CLI

[![Coverage Status](https://coveralls.io/repos/github/supabase/cli/badge.svg?branch=main)](https://coveralls.io/github/supabase/cli?branch=main) [![Bitbucket Pipelines](https://img.shields.io/bitbucket/pipelines/supabase-cli/setup-cli/master?style=flat-square&label=Bitbucket%20Canary)](https://bitbucket.org/supabase-cli/setup-cli/pipelines) [![Gitlab Pipeline Status](https://img.shields.io/gitlab/pipeline-status/sweatybridge%2Fsetup-cli?label=Gitlab%20Canary)
](https://gitlab.com/sweatybridge/setup-cli/-/pipelines)

[Supabase](https://supabase.io) is an open source Firebase alternative. We're building the features of Firebase using enterprise-grade open source tools.

This repository contains all the functionality for Supabase CLI.

- [x] Running Supabase locally
- [x] Managing database migrations
- [x] Creating and deploying Supabase Functions
- [x] Generating types directly from your database schema
- [x] Making authenticated HTTP requests to [Management API](https://supabase.com/docs/reference/api/introduction)

## Getting started

### Install the CLI

Available via [NPM](https://www.npmjs.com) as dev dependency. To install:

```bash
npm i supabase --save-dev
```

To install the beta release channel:

```bash
npm i supabase@beta --save-dev
```

When installing with yarn 4, you need to disable experimental fetch with the following nodejs config.

```
NODE_OPTIONS=--no-experimental-fetch yarn add supabase
```

> **Note**
For Bun versions below v1.0.17, you must add `supabase` as a [trusted dependency](https://bun.sh/guides/install/trusted) before running `bun add -D supabase`.

<details>
  <summary><b>macOS</b></summary>

  Available via [Homebrew](https://brew.sh). To install:

  ```sh
  brew install supabase/tap/supabase
  ```

  To install the beta release channel:
  
  ```sh
  brew install supabase/tap/supabase-beta
  brew link --overwrite supabase-beta
  ```
  
  To upgrade:

  ```sh
  brew upgrade supabase
  ```
</details>

<details>
  <summary><b>Windows</b></summary>

  Available via [Scoop](https://scoop.sh). To install:

  ```powershell
  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
  scoop install supabase
  ```

  To upgrade:

  ```powershell
  scoop update supabase
  ```
</details>

<details>
  <summary><b>Linux</b></summary>

  Available via [Homebrew](https://brew.sh) and Linux packages.

  #### via Homebrew

  To install:

  ```sh
  brew install supabase/tap/supabase
  ```

  To upgrade:

  ```sh
  brew upgrade supabase
  ```

  #### via Linux packages

  Linux packages are provided in [Releases](https://github.com/supabase/cli/releases). To install, download the `.apk`/`.deb`/`.rpm`/`.pkg.tar.zst` file depending on your package manager and run the respective commands.

  ```sh
  sudo apk add --allow-untrusted <...>.apk
  ```

  ```sh
  sudo dpkg -i <...>.deb
  ```

  ```sh
  sudo rpm -i <...>.rpm
  ```

  ```sh
  sudo pacman -U <...>.pkg.tar.zst
  ```
</details>

<details>
  <summary><b>Other Platforms</b></summary>

  You can also install the CLI via [go modules](https://go.dev/ref/mod#go-install) without the help of package managers.

  ```sh
  go install github.com/supabase/cli@latest
  ```

  Add a symlink to the binary in `$PATH` for easier access:

  ```sh
  ln -s "$(go env GOPATH)/bin/cli" /usr/bin/supabase
  ```

  This works on other non-standard Linux distros.
</details>

<details>
  <summary><b>Community Maintained Packages</b></summary>

  Available via [pkgx](https://pkgx.sh/). Package script [here](https://github.com/pkgxdev/pantry/blob/main/projects/supabase.com/cli/package.yml).
  To install in your working directory:

  ```bash
  pkgx install supabase
  ```

  Available via [Nixpkgs](https://nixos.org/). Package script [here](https://github.com/NixOS/nixpkgs/blob/master/pkgs/development/tools/supabase-cli/default.nix).
</details>

### Run the CLI

```bash
supabase bootstrap
```

Or using npx:

```bash
npx supabase bootstrap
```

The bootstrap command will guide you through the process of setting up a Supabase project using one of the [starter](https://github.com/supabase-community/supabase-samples/blob/main/samples.json) templates.

## Docs

Command & config reference can be found [here](https://supabase.com/docs/reference/cli/about).

## Breaking changes

We follow semantic versioning for changes that directly impact CLI commands, flags, and configurations.

However, due to dependencies on other service images, we cannot guarantee that schema migrations, seed.sql, and generated types will always work for the same CLI major version. If you need such guarantees, we encourage you to pin a specific version of CLI in package.json.

## Developing

To run from source:

```sh
# Go >= 1.22
go run . help
```

# ContentHub AI Studio

Sistema completo de automação de redes sociais com IA.

## 🚀 Deploy Status

- **Vercel**: [https://contenthub-ai-studio.vercel.app](https://contenthub-ai-studio.vercel.app)
- **Última atualização**: OAuth real implementado via Ayrshare

## ✨ Funcionalidades

### Sistema de Autenticação
- ✅ Login/Registro com validação completa
- ✅ Login social (Google/GitHub)
- ✅ Recuperação de senha
- ✅ Confirmação de email
- ✅ Proteção de rotas
- ✅ Gerenciamento de sessão
- ✅ Onboarding para novos usuários

### Sistema de Múltiplas Contas Sociais
- ✅ Interface para conectar até 20 contas por rede
- ✅ **OAuth real via Ayrshare** (sem mais demo)
- ✅ Gerenciamento individual de cada conta
- ✅ Configuração de horários personalizados
- ✅ Auto-posting com limites e intervalos
- ✅ Detecção de rate limits
- ✅ Analytics por conta
- ✅ **Bulk management de contas**

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + Shadcn/ui
- **Backend**: Supabase
- **OAuth**: Ayrshare API
- **Deploy**: Vercel

## 📦 Instalação

```bash
npm install
npm run dev
```

## 🔧 Configuração

1. Configure as variáveis de ambiente:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

2. Configure a Edge Function no Supabase:
```env
AYRSHARE_API_KEY=sua_chave_ayrshare
```

## 🚀 Deploy

O projeto está configurado para deploy automático no Vercel. Qualquer push para a branch `main` dispara um novo deploy.

## 📱 Redes Suportadas

- **TikTok** (1-20 contas por plano)
- **Instagram** (1-20 contas por plano)
- **YouTube Shorts** (0-10 contas por plano)
- **X (Twitter)** (0-10 contas por plano)
- **LinkedIn** (0-5 contas por plano)
- **Facebook** (1-10 contas por plano)

## 💡 Planos

- **Free**: 1 conta por rede principal
- **Pro**: 5 contas por rede, todas as redes
- **Agency**: 20 contas por rede, recursos avançados

---

**Status**: ✅ Produção - OAuth real implementado
