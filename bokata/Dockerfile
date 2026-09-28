# BO KATA server: hosts the web game and the multiplayer WebSocket (/ws)
FROM node:22-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --omit=dev --no-audit --no-fund
COPY server ./server
COPY www ./www
ENV PORT=8787 NODE_ENV=production
EXPOSE 8787
CMD ["node", "server/server.js"]
