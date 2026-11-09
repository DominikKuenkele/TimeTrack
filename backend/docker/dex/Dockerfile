# Dex of the dev and e2e stacks. The configs are built in, as the CI runner's remote docker daemon can't mount
# paths of the checkout; compose picks the config by the command.
FROM ghcr.io/dexidp/dex:v2.46.1@sha256:65b72ca0f4b0bf6d4ada84ec21da8851782563404ac7b8f926923d27ceced9ab

COPY config.yaml config.e2e.yaml /etc/dex/
