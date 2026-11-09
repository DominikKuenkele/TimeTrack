FROM node:24-bookworm-slim@sha256:01d566e8d94d8c619591d78652babfccd3c6992a3dffa9ed5ab39e11cf6c70e9

# Only the full Chromium the tests run in (playwright.config.ts), not the other browsers of Playwright's own image.
# Installed before `npm ci`, so that the layer stays cached until the version changes.
# Must follow @playwright/test in package.json
ARG PLAYWRIGHT_VERSION=1.64.1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx -y playwright@${PLAYWRIGHT_VERSION} install --with-deps --no-shell chromium \
    && rm -rf /var/lib/apt/lists/* /root/.npm

WORKDIR /e2e

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

CMD ["npx", "playwright", "test"]
