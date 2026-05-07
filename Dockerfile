# =============================================================================
# Simon Game — container image for Kubernetes (static site + Tailwind build)
# =============================================================================
#
# What this file does (high level):
#   Stage 1 (builder): Install Node deps, compile Tailwind CSS into public/.
#   Stage 2 (runtime): Serve only public/ with nginx — no Node in the running Pod.
#
# Why multi-stage builds?
#   - Final image stays small (nginx + static files), which matters on worker
#     nodes: faster pulls, less disk, smaller attack surface.
#   - Build tools (Node, npm packages, Tailwind) never ship to production —
#     they exist only in the intermediate builder layer.
#
# Typical flow after this image exists:
#   docker build -t simon-game:dev .
#   kubectl apply ... Deployment using image simon-game:dev (via registry)
#
# =============================================================================

# -----------------------------------------------------------------------------
# STAGE 1 — builder (compile CSS; not used at runtime in the cluster)
# -----------------------------------------------------------------------------
#
# FROM: Official Node image on Alpine Linux — smaller than Debian-based images.
# Pin major versions in real pipelines (22 → bump deliberately when you upgrade).
#
# AS builder: Names this stage so the final stage can COPY --from=builder ...
#
FROM node:22-alpine AS builder

# WORKDIR: Creates /app and sets cwd for subsequent RUN/COPY.
# Prefer WORKDIR over scattered `cd` commands — clearer and less error-prone.
WORKDIR /app

# -----------------------------------------------------------------------------
# Dependencies (layer caching)
# -----------------------------------------------------------------------------
#
# Copy only package manifests first. Docker caches each layer; if package.json
# and package-lock.json are unchanged, the next build skips `npm ci` entirely.
#
# Watch out: Never COPY entire project before npm ci — any file change would
# bust the cache and force a full reinstall every build.
#
COPY package.json package-lock.json ./

#
# npm ci:
#   - Installs exact versions from package-lock.json (reproducible builds).
#   - Deletes node_modules first — clean slate every image build.
#   - Fails if lockfile does not match package.json (catches drift early).
#
# Prefer npm ci over npm install in Docker/CI. npm install may mutate lockfiles.
#
RUN npm ci

# -----------------------------------------------------------------------------
# Application sources needed for the Tailwind build
# -----------------------------------------------------------------------------
#
# tailwind.config.js — content paths (e.g. ./public/*.html), theme, plugins.
# src/input.css       — @tailwind directives + any custom layers.
# public/             — HTML, JS, audio, etc. HTML is scanned for class names;
#                       build overwrites public/styles.css with compiled CSS.
#
# Watch out: tailwind.config.js "content" globs must match files you COPY here.
# If you move HTML to another folder, update config or styles will be wrong.
#
COPY tailwind.config.js ./
COPY src/input.css ./src/
COPY public ./public

#
# npm run build → tailwindcss ... --minify (see package.json "build" script).
# Single production pass — no --watch (watch is for local development only).
#
RUN npm run build

# -----------------------------------------------------------------------------
# STAGE 2 — runtime (this is what runs inside the Pod on a worker node)
# -----------------------------------------------------------------------------
#
# nginx:alpine — minimal web server suited for static files (your game).
# Pin image tags (1.27-alpine here) instead of :latest in production registries
# so upgrades are intentional and rollbacks are predictable.
#
FROM nginx:1.27-alpine

# LABELs: Optional Open Container Initiative metadata for registry/UI tooling.
# Helps teammates see what an image is without inspecting the Dockerfile.
#
LABEL org.opencontainers.image.title="simon-game"
LABEL org.opencontainers.image.description="Simon browser game — static assets behind nginx"

#
# Copy ONLY the built site from the builder stage into nginx’s default doc root.
# Browsers request /index.js, /styles.css, /sounds/... relative to site root.
#
# Watch out:
#   - Do not COPY node_modules, package.json, or src/ — wastes space and leaks
#     dev tooling into an image that should only serve files.
#   - Paths must match how index.html references assets (e.g. ./index.js).
#
COPY --from=builder /app/public /usr/share/nginx/html

#
# EXPOSE documents which port the process listens on inside the container.
# It does NOT publish the port to your host — that is docker run -p or a
# Kubernetes Service / Ingress mapping.
#
# Default nginx listens on 80; align Deployment.containerPort and probes with this.
#
EXPOSE 80

#
# The official nginx image already sets CMD to run nginx in the foreground
# ("daemon off;"). Containers must have one long-running foreground process —
# if it exits, Kubernetes restarts the Pod.
#
# If you later add a custom nginx.conf, use COPY before EXPOSE and ensure the
# config still listens on the port your Service targets (often 80).
#
