FROM node:alpine

## Check out latest source code from the git


WORKDIR /usr/src/app

COPY package*.json ./
RUN wget -qO- "https://github.com/dustinblackman/phantomized/releases/download/2.1.1a/dockerized-phantomjs.tar.gz" | tar xz -C /
RUN npm install -g html-pdf
RUN npm install --production
RUN npm install strapi-hook-strapi-mongoose

COPY . .


##Create /tmp/log/websocket.log

RUN mkdir -p /tmp/log/ && cd /tmp/log && touch websocket.log

EXPOSE 1337


## Remove stack docker from the dir

CMD ["rm", "-rf", "stack-docker"]

CMD ["sh", "api.sh"]
