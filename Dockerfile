# Use an official Node.js image as the base
FROM node:18

# Install necessary packages for running xdelta3, xz-utils, and Emscripten
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    git \
    cmake \
    ninja-build \
    wget \
    xdelta3 \
    xz-utils \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables for Emscripten
ENV EMSDK /emsdk
ENV PATH $EMSDK:$EMSDK/upstream/emscripten:$PATH

# Step 1: Download Emscripten SDK archive
RUN wget https://github.com/emscripten-core/emsdk/archive/refs/tags/3.1.65.tar.gz

# Step 2: Extract the archive
RUN tar -xzf 3.1.65.tar.gz

# Step 3: Move the extracted folder to $EMSDK
RUN mv emsdk-3.1.65 $EMSDK

# Step 4: Change directory to $EMSDK and install the specific version
WORKDIR $EMSDK
RUN ./emsdk install 3.1.65

# Step 5: Activate the installed version
RUN ./emsdk activate 3.1.65

# Step 6: Load Emscripten environment variables (this will apply them for future commands in this Dockerfile)
RUN bash -c ". $EMSDK/emsdk_env.sh"

# Step 7: Clean up the downloaded tar.gz file
RUN rm -f /3.1.65.tar.gz

# Set working directory back to /app
WORKDIR /app

# Copy the project files into the container
COPY . .

# Install npm dependencies
RUN npm install

# Default command to run the development server
CMD ["npm", "start"]

