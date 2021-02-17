FROM node:latest

RUN npm install hot-shots
RUN npm install --save dd-trace
RUN npm install crypto-price
RUN npm install redis

WORKDIR /stock/files

COPY . .
CMD [ "node", "crypto.js" ]


