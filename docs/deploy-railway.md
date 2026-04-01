# Railway Deployment Guide

## What Is Ready

This repository is now prepared for a two-service Railway deployment:

- `web` service for the Next.js app
- `api` service for the Fastify backend

The local development database still uses SQLite for speed, but production deployment is prepared to use PostgreSQL through a dedicated Prisma schema:

- local schema: `packages/database/prisma/schema.prisma`
- production schema: `packages/database/prisma/schema.postgres.prisma`

## Recommended Railway Setup

### 1. Create A PostgreSQL Database

In Railway:

- create a PostgreSQL service
- copy its `DATABASE_URL`

### 2. Create The API Service

Use this repo with:

- root directory: `/`
- Dockerfile path: `Dockerfile.api`

Required environment variables:

- `DATABASE_URL`
- `HOST=0.0.0.0`
- `PORT=4000`
- `TELEGRAM_BOT_TOKEN`
- `API_PUBLIC_BASE_URL=https://<your-api-service>.up.railway.app`
- `TELEGRAM_WEBHOOK_BASE_URL=https://<your-api-service>.up.railway.app`
- `META_APP_ID`
- `META_APP_SECRET`

The API container will:

- generate Prisma client using the PostgreSQL schema
- run `prisma db push` at startup
- start the Fastify server

### 3. Create The Web Service

Use this repo with:

- root directory: `/`
- Dockerfile path: `Dockerfile.web`

Required environment variables:

- `PORT=3000`
- `API_BASE_URL=https://<your-api-service>.up.railway.app`
- `NEXT_PUBLIC_API_BASE_URL=https://<your-api-service>.up.railway.app`
- `PUBLIC_ASSET_BASE_URL=https://<your-web-service>.up.railway.app`
- `NEXT_PUBLIC_APP_NAME=AI Social Autopilot`

## GitHub Notes

There is currently no Git remote configured in this workspace.

Before Railway can auto-deploy from GitHub, you still need to:

1. create a GitHub repository
2. add it as remote
3. push this codebase

Example:

```bash
git remote add origin <your-repo-url>
git push -u origin main
```

## Recommended Next Step

After the first Railway deploy:

- point the web app to the Railway API URL
- set `API_PUBLIC_BASE_URL` / `TELEGRAM_WEBHOOK_BASE_URL` to the Railway API domain
- open `Telegram Center` and click `Sync Telegram Webhook`
- verify Telegram webhook state in the panel
- optionally move uploaded assets from local disk to S3 or Cloudinary
