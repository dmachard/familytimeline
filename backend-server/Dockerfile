# Use the official Node.js image as a base
FROM node:22.9.0

# Set the working directory in the container
WORKDIR /app

# Copy the rest of the application code
# Copy package.json and package-lock.json
COPY src/ ./src
COPY package*.json ./

# Install dependencies
RUN npm install

# Expose the port that the app will run on
EXPOSE 5000

# Command to run the application
CMD ["npm", "start"]