FROM node:26-bookworm-slim@sha256:5df79989ed685e09f0a98019db4cebfb22fb9df1a53c0161664a011f7ff6b0f1

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

WORKDIR /e2e

COPY package.json package-lock.json ./

RUN npm ci

# Only the full Chromium the tests run in (playwright.config.ts), not the other browsers of Playwright's own image.
# After `npm ci`, so it is the browser of the locked @playwright/test.
RUN npx playwright install --with-deps --no-shell chromium \
    && rm -rf /var/lib/apt/lists/*

COPY . .

CMD ["npx", "playwright", "test"]
