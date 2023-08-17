# Create a new image from the base amazonlinux image
FROM amazonlinux:latest

# Install required dependencies
# RUN yum install -y curl tar gzip

# Install Node.js 18.x
# RUN curl -sL https://rpm.nodesource.com/setup_18.x | bash -
# RUN yum install -y nodejs


# Update packages
RUN yum update -y

# Nginx setup
# RUN amazon-linux-extras install -y nodejs14

RUN yum install -y gcc-c++ make
RUN curl -sL https://rpm.nodesource.com/setup_18.x | bash -
RUN yum install -y nodejs

# Create and set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the app source code
COPY . .

# Build the app
RUN npm run build

# Expose the port that the app will run on
EXPOSE 3000

# Start nginx when the container has been provisioned
CMD ["node", "dist/packages/be/main.js"]
