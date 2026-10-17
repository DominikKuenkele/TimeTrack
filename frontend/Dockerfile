FROM node:lts-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:lts-alpine AS dev

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# The dev stack mounts the sources over this, the e2e stack (compose.e2e.yaml) has no mounts
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM nginx:alpine AS prod

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]