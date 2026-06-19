# Pin nginx so the runtime image and the brotli modules built below stay
# in lockstep. Bump both by changing this single ARG.
ARG NGINX_VERSION=1.30.3

# --- 1. Build the SPA -------------------------------------------------
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build -- --outDir dist

# --- 2. Compile ngx_brotli as dynamic modules -------------------------
# Built against the exact nginx version with --with-compat, which makes
# the .so files binary-compatible with the official nginx binary.
FROM nginx:${NGINX_VERSION} AS brotli
ARG NGINX_VERSION
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git gcc g++ make cmake libpcre2-dev zlib1g-dev libssl-dev wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /build
RUN git clone --depth=1 --recurse-submodules https://github.com/google/ngx_brotli.git \
    && wget -q "https://nginx.org/download/nginx-${NGINX_VERSION}.tar.gz" \
    && tar -xzf "nginx-${NGINX_VERSION}.tar.gz"
# Build the bundled brotli library as STATIC libs so they link straight into
# the module .so — the final image then needs no runtime brotli package.
RUN cmake -S /build/ngx_brotli/deps/brotli -B /build/ngx_brotli/deps/brotli/out \
        -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF \
    && cmake --build /build/ngx_brotli/deps/brotli/out --target brotlienc -j"$(nproc)"
WORKDIR /build/nginx-${NGINX_VERSION}
RUN ./configure --with-compat --add-dynamic-module=/build/ngx_brotli \
    && make modules

# --- 3. Runtime image -------------------------------------------------
FROM nginx:${NGINX_VERSION}
ARG NGINX_VERSION

COPY --from=brotli /build/nginx-${NGINX_VERSION}/objs/ngx_http_brotli_filter_module.so /usr/lib/nginx/modules/
COPY --from=brotli /build/nginx-${NGINX_VERSION}/objs/ngx_http_brotli_static_module.so /usr/lib/nginx/modules/

COPY nginx/nginx.conf   /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
