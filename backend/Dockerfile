FROM node:20-alpine
WORKDIR /app
COPY package.json server.js store.js ./
# Données stockées dans /data (monté en volume)
ENV PORT=4000 DATA_FILE=/data/data.json
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 4000
CMD ["node", "server.js"]
