# Dev: dependencias sao instaladas no start porque o bind mount do
# docker-compose sobrepoe /app com o codigo do host.
FROM node:20-alpine

WORKDIR /app

EXPOSE 3000

CMD ["sh", "-c", "npm install && npm run start:dev"]
