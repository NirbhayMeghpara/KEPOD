FROM --platform=linux/amd64 node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

ENV PORT=3000 NODE_ENV=development AWS_REGION=us-east-1

EXPOSE 3000 8080

CMD ["node", "dist/server.js"]