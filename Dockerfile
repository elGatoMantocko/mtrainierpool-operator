FROM node:22-alpine
WORKDIR /app

# Yarn 4 bundled release is required for install
COPY .yarnrc.yml package.json yarn.lock ./
COPY .yarn/ .yarn/
COPY frontend/package.json frontend/

RUN yarn install --immutable

COPY frontend/ frontend/
COPY supabase/certs/ supabase/certs/

RUN yarn workspace frontend build

EXPOSE 3000
CMD ["yarn", "workspace", "frontend", "preview"]
