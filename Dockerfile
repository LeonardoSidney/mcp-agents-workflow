FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./

COPY tsconfig.json ./
COPY src ./src
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npx", "tsx", "src/index.ts"]
