FROM    node:lts-bullseye-slim
ENV     NODE_ENV=production
ENV     APP_ENV=prod

WORKDIR /workspace

COPY    . .

RUN npm install pm2 -g

RUN apt-get update && apt-get install -y iputils-ping && apt-get install -y iproute2 && apt-get install net-tools

EXPOSE 8322

CMD     ["pm2-runtime", "start", "index.js"]
