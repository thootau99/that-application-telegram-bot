# Dockerfile

#
# 🧑‍💻 Development
#
FROM node:18-alpine as dev
# add the missing shared libraries from alpine base image
RUN apk add --no-cache libc6-compat
# Create app folder
WORKDIR /src/app
COPY . .

# Set to dev environment
ENV NODE_ENV dev

# Install dependencies
RUN yarn --frozen-lockfile

# Set Docker as a non-root user
#USER docker-user

#
# 🏡 Production Build
#
FROM node:18-alpine as build

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Set to production environment
ENV NODE_ENV production

# Create non-root user for Docker
RUN addgroup --system --gid 1002 docker-user
RUN adduser --system --uid 1002 docker-user

# In order to run `pnpm build` we need access to the Nest CLI.
# Nest CLI is a dev dependency.
COPY --chown=node:node --from=dev /src/app/node_modules ./node_modules
# Copy source code
COPY --chown=node:node . .

# Generate the production build. The build script runs "nest build" to compile the application.
RUN yarn build

# Install only the production dependencies and clean cache to optimize image size.
RUN yarn --frozen-lockfile --production --yes && yarn cache clean

# Set Docker as a non-root user
USER docker-user

#
# 🚀 Production Server
#
FROM node:18-alpine as prod

WORKDIR /app
RUN apk add --no-cache libc6-compat curl

# Set to production environment
ENV NODE_ENV production

# Create non-root user for Docker
RUN addgroup --system --gid 1002 docker-user
RUN adduser --system --uid 1002 docker-user

# Copy only the necessary files
COPY --chown=node:node --from=build /app/dist dist
COPY --chown=node:node --from=build /app/node_modules node_modules

# Set Docker as non-root user
USER docker-user

CMD ["node", "dist/main.js"]
