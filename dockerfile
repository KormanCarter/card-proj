FROM node:latest

LABEL maintainer="Korman Carter"
LABEL description="Copies my latest node project and deploys it with docker"
LABEL cohort="cohort-19"
LABEL Animal = "Panda"

WORKDIR /app

COPY . .

EXPOSE 3000

RUN npm install

CMD ["node", "server.js"]