# Loja Auster

Sistema interno de loja de pontos para colaboradores. Os funcionarios acumulam moedas via [Feedz](https://feedz.com.br) e resgatam produtos nesta plataforma.

**Stack:** React 18 + Vite 5 + TypeScript | Express 4 + Prisma 7 | PostgreSQL 16 | shadcn/ui + Tailwind CSS

---

## Desenvolvimento local

### Pre-requisitos

- Node.js 20+
- PostgreSQL 16 rodando localmente (ou via Docker)

### Passo a passo

```bash
# 1. Clone o repositorio
git clone https://github.com/ittsjoao/Loja-Auster.git
cd Loja-Auster

# 2. Instale as dependencias
npm install

# 3. Crie o arquivo .env na raiz
cp .env.example .env
# Preencha as variaveis (veja secao abaixo)

# 4. Gere o Prisma Client e aplique o schema no banco
npm run db:generate
npm run db:push

# 5. Popule o banco com dados iniciais
npm run db:seed

# 6. Inicie frontend + backend simultaneamente
npm run dev:full
```

O frontend roda em `http://localhost:5173` e o backend em `http://localhost:3001`.

### Variaveis de ambiente (.env)

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/lojaAuster"
PORT=3001
NODE_ENV=development
VITE_API_URL=http://localhost:3001/api
FEEDZ_API_KEY=sua-api-key-feedz
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USER=seu-email@exemplo.com
SMTP_PASS=sua-senha-smtp
HR_EMAIL=rh@suaempresa.com.br
UPLOAD_DIR=./uploads
```

### Scripts disponiveis

| Comando | Descricao |
|---------|-----------|
| `npm run dev:full` | Inicia frontend (Vite) + backend (Express) |
| `npm run dev` | Apenas o frontend |
| `npm run dev:api` | Apenas o backend |
| `npm run build` | Build de producao |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:push` | Aplica o schema no banco |
| `npm run db:seed` | Popula o banco com dados iniciais |
| `npm run db:studio` | Abre o Prisma Studio |

---

## Docker

O `docker-compose.yml.example` vem configurado com duas redes Docker:

- **`lojauster-internal`** — rede interna entre app e banco de dados
- **`proxy`** — rede externa para integrar com reverse proxies (Nginx, Traefik, Caddy, etc.)

A rede `proxy` e declarada como `external: true`, ou seja, precisa existir previamente. Isso e util quando voce tem outros servicos (ex: Nginx ou Cloudflare Tunnel) rodando na mesma rede Docker.

### Docker local (sem proxy/tunnel)

Para rodar localmente sem reverse proxy, remova a rede `proxy` do compose:

```bash
# 1. Copie o exemplo
cp docker-compose.yml.example docker-compose.yml

# 2. Edite o docker-compose.yml:
#    - Remova "proxy" do bloco "networks" do servico "app"
#    - Remova o bloco "proxy: external: true" de "networks" no final
#    - Altere VITE_API_URL para http://localhost:3001/api
#    - Preencha as demais credenciais

# 3. Suba os containers
docker-compose up -d --build

# 4. Acompanhe os logs
docker-compose logs -f app
```

Ou de forma mais rapida, use este compose simplificado sem a rede externa:

```yaml
version: "3.8"

services:
  db:
    image: postgres:16-alpine
    container_name: lojauster-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: SUA_SENHA
      POSTGRES_DB: lojaAuster
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    container_name: lojauster-app
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://postgres:SUA_SENHA@db:5432/lojaAuster
      PORT: 3001
      NODE_ENV: production
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: postgres
      VITE_API_URL: http://localhost:3001/api
      FEEDZ_API_KEY: SUA_API_KEY
      SMTP_HOST: smtp.exemplo.com
      SMTP_PORT: 587
      SMTP_USER: email@exemplo.com
      SMTP_PASS: senha-smtp
      HR_EMAIL: rh@empresa.com.br
    ports:
      - "3001:3001"

volumes:
  postgres_data:
```

Acesse `http://localhost:3001` no navegador.

### Docker com rede proxy (para reverse proxy)

Use esta opcao quando voce ja tem um Nginx, Traefik ou outro reverse proxy rodando em uma rede Docker compartilhada.

```bash
# 1. Crie a rede proxy (se ainda nao existe)
docker network create proxy

# 2. Copie e preencha o compose
cp docker-compose.yml.example docker-compose.yml
# Edite com suas credenciais

# 3. Suba os containers
docker-compose up -d --build
```

O servico `app` estara acessivel pelos outros containers na rede `proxy` pelo hostname `lojauster-app` na porta `3001`.

Exemplo de configuracao Nginx (rodando na mesma rede `proxy`):

```nginx
server {
    listen 80;
    server_name loja.seudominio.com.br;

    location / {
        proxy_pass http://lojauster-app:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Entrypoint automatico

Ao subir, o container automaticamente:
- Aguarda o PostgreSQL ficar pronto
- Aplica o schema do Prisma (`db push`)
- Executa o seed inicial
- Inicia o servidor

### Atualizando

```bash
git pull
docker-compose up -d --build
```

---

## Expondo com Cloudflare Tunnel

O Cloudflare Tunnel permite expor a aplicacao para a internet sem abrir portas no firewall/roteador.

### Pre-requisitos

- Conta no [Cloudflare](https://dash.cloudflare.com) com um dominio configurado
- `cloudflared` instalado ([download](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/))

### Configuracao

```bash
# 1. Autentique no Cloudflare
cloudflared tunnel login

# 2. Crie um tunnel
cloudflared tunnel create lojauster

# 3. Configure o DNS (substitua pelo seu dominio)
cloudflared tunnel route dns lojauster loja.seudominio.com.br

# 4. Crie o arquivo de configuracao
# Linux/Mac: ~/.cloudflared/config.yml
# Windows: %USERPROFILE%\.cloudflared\config.yml
```

Conteudo do `config.yml`:

```yaml
tunnel: <ID_DO_TUNNEL>
credentials-file: <CAMINHO>/cert.json

ingress:
  - hostname: loja.seudominio.com.br
    service: http://localhost:3001
  - service: http_status:404
```

```bash
# 5. Inicie o tunnel
cloudflared tunnel run lojauster
```

### Tunnel como servico (Linux)

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

### Importante

- Atualize `VITE_API_URL` no `docker-compose.yml` para `https://loja.seudominio.com.br/api`
- Rebuild apos alterar: `docker-compose up -d --build`

---

## Estrutura do projeto

```
src/
  client/           # Frontend React
    components/      # Componentes reutilizaveis
    contexts/        # AuthContext, CartContext
    pages/           # Paginas da aplicacao
    services/        # Chamadas API
    types/           # TypeScript types
    utils/           # Utilitarios (formatacao, desconto)
  server/            # Backend Express
    routes/          # Rotas da API
    services/        # Servicos (email, feedz)
    middleware/      # Autenticacao
    lib/             # Prisma client
prisma/
  schema.prisma      # Schema do banco
  seed.ts            # Dados iniciais
```
