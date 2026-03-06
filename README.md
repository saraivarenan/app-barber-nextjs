# BarberBook — Next.js

App de gestão de agendamentos para barbeiros.

## Stack
- **Next.js 14** com App Router e Server Actions
- **PostgreSQL** via Neon (serverless)
- **Drizzle ORM** para queries tipadas
- **Vercel** para deploy (gratuito, sem limite de horas)

## Setup Local

### 1. Instalar dependências
```bash
npm install
```

### 2. Criar banco de dados
Acesse [neon.tech](https://neon.tech), crie uma conta gratuita e um novo projeto.
Copie a **Connection String**.

### 3. Configurar variáveis de ambiente
Edite `.env.local`:
```
DATABASE_URL=sua_connection_string_do_neon
JWT_SECRET=qualquer_string_longa_e_secreta
```

### 4. Rodar migrations (criar tabelas)
```bash
npx drizzle-kit push:pg
```

### 5. Iniciar o servidor
```bash
npm run dev
```
Acesse http://localhost:3000

---

## Deploy no Vercel

### 1. Push para GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/SEU_USER/barberbook.git
git push -u origin main
```

### 2. Deploy
1. Acesse [vercel.com](https://vercel.com) → **New Project**
2. Importe o repositório do GitHub
3. Em **Environment Variables**, adicione:
   - `DATABASE_URL` → connection string do Neon
   - `JWT_SECRET` → string secreta
4. Clique em **Deploy**

### 3. Rodar migrations no Neon
No painel do Neon → **SQL Editor**, cole e execute:
```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client TEXT NOT NULL,
  phone TEXT DEFAULT '',
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  service TEXT NOT NULL DEFAULT 'Corte',
  recurrence TEXT NOT NULL DEFAULT 'none',
  recur_days TEXT NOT NULL DEFAULT '[]',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Tornar-se Admin
No Neon → **SQL Editor**:
```sql
UPDATE users SET is_admin = true WHERE email = 'seu@email.com';
```

---

## Estrutura do Projeto
```
barberbook/
├── app/
│   ├── auth/login/      → Tela de login
│   ├── auth/register/   → Tela de cadastro
│   └── (app)/
│       ├── home/        → Agenda do dia (timeline)
│       ├── calendar/    → Calendário mensal
│       ├── contacts/    → Contatos
│       └── admin/       → Gestão de usuários (só admin)
├── actions/             → Server Actions (backend)
│   ├── auth.ts
│   ├── schedules.ts
│   ├── contacts.ts
│   └── admin.ts
├── components/          → Componentes React
├── lib/
│   ├── db.ts            → Conexão Neon + Drizzle
│   ├── schema.ts        → Tabelas do banco
│   ├── auth.ts          → JWT + sessão
│   └── recurrence.ts    → Engine de recorrências
└── styles/globals.css   → Estilos globais
```
