FROM node:latest as be-builder

WORKDIR /be

ADD ./be ./

RUN npm --verbose install

RUN npm install -g tsc && npm install -g concurrently

RUN npm run build

FROM node:latest as fe-builder

WORKDIR /fe

ADD ./fe ./

RUN npm --verbose install

RUN npm run build

FROM node:latest

WORKDIR /app

COPY --from=fe-builder /fe ./

COPY --from=be-builder /be ./

EXPOSE 3000

CMD ["node", "/app/dist/index.js"]
