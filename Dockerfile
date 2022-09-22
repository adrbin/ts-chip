FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
ENV NO_UPDATE_NOTIFIER=true
COPY package*.json .
COPY --from=build /app/dist dist
RUN npm ci --only=production
ENTRYPOINT [ "npm", "run", "start", "--" ]
