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

# Download and install precompiled Emscripten SDK
RUN wget https://github.com/emscripten-core/emsdk/archive/refs/tags/3.1.65.tar.gz && \
    tar -xzf 3.1.65.tar.gz && \
    mv emsdk-3.1.65 $EMSDK && \
    cd $EMSDK && \
    ./emsdk install 3.1.65 && \
    ./emsdk activate 3.1.65 && \
    bash -c "source $EMSDK/emsdk_env.sh" && \
    rm -f /3.1.65.tar.gz

# Create and set working directory
WORKDIR /app

# Copy the project files into the container
COPY . .

# Install npm dependencies
RUN npm install

# Default command to run the development server
CMD ["npm", "start"]

