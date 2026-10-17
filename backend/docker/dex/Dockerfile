# Dex of the dev and e2e stacks. The configs are built in, as the CI runner's remote docker daemon can't mount
# paths of the checkout; compose picks the config by the command.
FROM ghcr.io/dexidp/dex:v2.45.1

COPY config.yaml config.e2e.yaml /etc/dex/
