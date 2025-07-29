FROM node:18-bullseye

# Install required packages
RUN apt-get update && \
    apt-get install -y \
        ffmpeg \
        imagemagick \
        webp && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package.json first (for cached layers)
COPY package.json .

# Install dependencies
RUN npm install && npm install -g qrcode-terminal pm2

# Copy all project files
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
