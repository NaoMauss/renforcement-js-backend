# Use Bun runtime as the base image
FROM oven/bun:1

# Set the working directory in the container
WORKDIR /app

COPY package.json ./

# Install dependencies
RUN bun install

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the application using Bun
CMD ["bun", "src/app.ts"]