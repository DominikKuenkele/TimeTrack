FROM node:22 AS build

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./  

RUN yarn install

COPY . .

RUN yarn build

FROM nginx:alpine AS prod

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]