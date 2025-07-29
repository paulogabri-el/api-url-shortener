# API URL Shortener

API para encurtamento de URLs com autenticação JWT, analytics de cliques, gerenciamento de usuários e persistência de dados usando TypeORM, PostgreSQL e logging estruturado com nestjs-pino.

---

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Clonando o Projeto](#clonando-o-projeto)
- [Configuração de Ambiente](#configuração-de-ambiente)
- [Rodando com Docker Compose](#rodando-com-docker-compose)
- [Acessando a Aplicação](#acessando-a-aplicação)
- [Testes](#testes)
- [Endpoints e Exemplos de Uso](#endpoints-e-exemplos-de-uso)
- [Validações e Segurança](#validações-e-segurança)
- [Banco de Dados e Estrutura](#banco-de-dados-e-estrutura)
- [Logs com nestjs-pino](#logs-com-nestjs-pino)
- [Pontos de Ajuste e Melhorias](#pontos-de-ajuste-e-melhorias)

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/) 
- [Postman](https://www.postman.com/) para testar a API.

---

## Clonando o Projeto

```sh
git clone https://github.com/paulogabri-el/api-url-shortener.git
cd api-url-shortener
```

---

## Configuração de Ambiente

Você pode rodar tudo via Docker Compose, sem precisar instalar Node ou Postgres localmente.

Se quiser rodar localmente, crie um arquivo `.env` na raiz com (Informações do banco e demais configurações sugeridas e inseridas para a criação .yml para o Docker):

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=shortener

JWT_SECRET=segredo_forte
JWT_EXPIRES_IN=10m

PORT=3000
BASE_URL=http://localhost:3000
```

---

## Rodando com Docker Compose

### 1. Crie o arquivo `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### 2. Crie o arquivo `docker-compose.yml`:

```yaml
version: '3.8'

services:
  db:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_DB: shortener
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  app:
    build: .
    depends_on:
      - db
    environment:
      DATABASE_HOST: db
      DATABASE_PORT: 5432
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: postgres
      DATABASE_NAME: shortener
      JWT_SECRET: segredo_forte
      NODE_ENV: production
    ports:
      - "3000:3000"
    command: npm run start:prod
    restart: always

volumes:
  pgdata:
```

### 3. Suba tudo com Docker Compose

```sh
docker compose up --build
```

A primeira vez pode demorar um pouco devido ao build.

---

## Acessando a Aplicação

- **API:** http://localhost:3000
- **Swagger (documentação):** http://localhost:3000/api
- **Banco de dados:** disponível em `localhost:5432` (usuário: `postgres`, senha: `postgres`, banco: `shortener`)

---

## Testes

Execute todos os testes unitários (caso rode localmente):

```sh
npm install
npm run test
```

Os testes cobrem:
- Validação de cadastro, login, autenticação, geração de token, criptografia de senha (bcrypt)
- Criação, listagem, busca e remoção de URLs encurtadas
- Redirecionamento e registro de cliques (analytics)
- Contagem de cliques por shortCode

---

## Endpoints e Exemplos de Uso

### Autenticação

#### `POST /auth/login`
- **Descrição:** Realiza login e retorna um token JWT.
- **Body:**
  ```json
  {
    "email": "usuario@email.com",
    "password": "SenhaSegura123@"
  }
  ```
- **Resposta:**  
  ```json
  { "access_token": "JWT_TOKEN" }
  ```

---

### Usuários

#### `POST /users`
- **Descrição:** Cria um novo usuário.
- **Body:**
  ```json
  {
    "name": "João da Silva",
    "email": "joao@email.com",
    "password": "SenhaForte@123"
  }
  ```
- **Resposta:**  
  ```json
  { "id": 1, "name": "João da Silva", "email": "joao@email.com" }
  ```

#### `GET /users/me`  
**(Requer Bearer Token)**
- **Descrição:** Retorna os dados do usuário autenticado.

---

### Encurtador de URLs

#### `POST /short-url`  
**(Requer Bearer Token)**
- **Descrição:** Cria uma nova URL encurtada associada ao usuário.
- **Body:**
  ```json
  {
    "originalUrl": "https://www.exemplo.com",
    "expiresAt": "2025-08-01" // opcional
  }
  ```
- **Resposta:**  
  ```json
  {
    "id": 1,
    "originalUrl": "https://www.exemplo.com",
    "shortCode": "Ab12Cd",
    "createdAt": "...",
    "updatedAt": "...",
    "expiresAt": "..."
  }
  ```

#### `POST /short-url/public`
- **Descrição:** Cria uma URL encurtada sem autenticação.

#### `GET /short-url/short-urls`  
**(Requer Bearer Token)**
- **Descrição:** Lista todas as URLs encurtadas do usuário.

#### `GET /short-url/:shortCode`
- **Descrição:** Retorna a URL original associada ao shortCode.

---

### Redirecionamento

#### `GET /:shortCode`
- **Descrição:** Redireciona para a URL original e registra o clique (analytics).

---

### Analytics de Cliques

#### `GET /clicks/:shortCode/count`  
**(Requer Bearer Token)**
- **Descrição:** Retorna o número total de cliques registrados para o shortCode.

---

## Validações e Segurança

- **Cadastro de Usuário**
  - Nome: obrigatório.
  - Email: obrigatório e válido.
  - Senha: obrigatória, mínimo 6 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 símbolo.
  - Senha é criptografada usando **bcrypt**.
- **Token JWT**
  - Expira em 10 minutos.
  - Necessário para endpoints protegidos.
- **URLs**
  - `originalUrl` validada.
  - `expiresAt` deve ser data válida.
- **Analytics**
  - Cada clique é registrado com IP e user-agent.

---

## Banco de Dados e Estrutura

- **TypeORM** faz o mapeamento das entidades para tabelas no PostgreSQL.
- Principais tabelas:
  - **user:** usuários (id, name, email, password, createdAt, updatedAt)
  - **short_url:** URLs encurtadas (id, originalUrl, shortCode, userId, createdAt, updatedAt, expiresAt)
  - **click:** cliques em URLs (id, shortUrlId, clickedAt, ipAddress, userAgent)
- Relacionamentos:
  - User 1:N ShortUrl
  - ShortUrl 1:N Click

---

## Logs com nestjs-pino

A aplicação utiliza o [nestjs-pino](https://github.com/iamolegga/nestjs-pino) para logging estruturado e performático.

- Todos os logs relevantes de criação de usuário, login, criação e remoção de URLs, erros e warnings são registrados.
- Os logs são exibidos no terminal em formato colorido e legível, facilitando o acompanhamento em desenvolvimento e produção.
- O logger é configurado globalmente no projeto e pode ser customizado conforme necessidade.
- Exemplo de log:
  ```
  [12:34:56 +0000]  INFO  UsersService: Iniciando criação de usuário joao@email.com
  [12:34:56 +0000]  WARN  UsersService: E-mail já cadastrado: joao@email.com
  ```

---

## Pontos de Ajuste e Melhorias

- **Variáveis sensíveis:** Use variáveis de ambiente para JWT e banco.
- **Expiração do Token:** Ajustável via env.
- **Validações:** Fortes em todas as entradas.
- **Senha:** Sempre criptografada (bcrypt).
- **Analytics:** Registro detalhado de cada clique.
- **Permissões:** Apenas o dono pode deletar suas URLs.
- **Swagger:** Disponível em `/api` para testar e visualizar todos os endpoints.
- **Testes:** Cobrem todos os fluxos principais.
- **Logs:** Logging estruturado com nestjs-pino para rastreabilidade e troubleshooting.

---

## Usando com Postman

- **Importe a collection no Postman para testar os endpoints**:[📥 Download url-shortener.postman_collection.json](./postman/url-shortener.postman_collection.json)


1. **Crie um usuário:**  
   - POST `/users` com nome, email e senha válidos.
2. **Faça login:**  
   - POST `/auth/login` com email e senha.
   - Copie o `access_token` retornado.
3. **Crie uma URL encurtada autenticada:**  
   - POST `/short-url` com o token no header `Authorization: Bearer <token>`.
4. **Crie uma URL encurtada pública:**  
   - POST `/short-url/public` sem autenticação.
5. **Liste suas URLs:**  
   - GET `/short-url/short-urls` com token.
6. **Redirecione:**  
   - GET `/:shortCode` (use o shortCode retornado).
7. **Veja analytics:**  
   - GET `/clicks/:shortCode/count` com token.

---

**Dúvidas ou sugestões?**