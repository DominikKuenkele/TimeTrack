FROM node:26-bookworm-slim@sha256:add5c17c14752c54d2f3d519ec46a3815684d41c33f198bcb09fb998f7dcbf68

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
