# Production Checklist

## Required Environment

Set these before running with `NODE_ENV=production`:

```env
NODE_ENV=production
PORT=5000
APP_URL=https://your-domain.com
ALLOWED_ORIGINS=https://your-domain.com
FORCE_HTTPS=true

DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=recipe_management
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_CONNECTION_LIMIT=10

JWT_SECRET=use-a-long-random-secret-at-least-32-characters
JWT_EXPIRE=7d

BODY_LIMIT=1mb
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
```

For S3 image storage, also set:

```env
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_S3_BUCKET=...
```

Do not set `AWS_S3_ACL` unless the bucket explicitly allows object ACLs.

## Commands

```bash
npm ci
npm run env:check:prod
npm run check
npm run start:prod
```

Use a process manager in production, such as PM2, Docker, systemd, Render, Railway, or your cloud host's native process runner.

## Security Notes

- Keep `.env` out of git.
- Use HTTPS in front of the Node process.
- Keep `FORCE_HTTPS=false` while testing with a raw `http://IP:PORT` URL. Set it to `true` only after HTTPS is configured.
- Set `ALLOWED_ORIGINS` to the deployed domain only.
- Use a managed MySQL database with automated backups.
- Prefer S3 for uploads in production. Local `/uploads` storage is intended for development or single-server deployments with persistent disks.
- Rotate `JWT_SECRET` if it was ever committed, shared, or used in screenshots.

## Health Check

Use:

```text
GET /health
```

It returns server status, environment, and uptime.
