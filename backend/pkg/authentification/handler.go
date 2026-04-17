package authentification

import (
	"context"
	"errors"
	"fmt"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"github.com/coreos/go-oidc/v3/oidc"
)

type Handler interface {
	VerifyBearerToken(token string) (string, error)
}

type handlerImpl struct {
	logger         logger.Logger
	oauthServerURL string
	provider       *oidc.Provider
	verifier       *oidc.IDTokenVerifier
}

var _ Handler = &handlerImpl{}

func NewHandler(
	l logger.Logger,
	oauthServerURL,
	oauthDiscoveryURL,
	oauthClientID string,
) (Handler, error) {
	ctx := context.Background()

	if oauthDiscoveryURL != oauthServerURL {
		ctx = oidc.InsecureIssuerURLContext(ctx, oauthServerURL)
	}

	provider, err := oidc.NewProvider(ctx, oauthDiscoveryURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create OIDC provider: %w", err)
	}

	verifier := provider.Verifier(&oidc.Config{
		ClientID: oauthClientID,
	})

	return &handlerImpl{
		logger:         l,
		oauthServerURL: oauthServerURL,
		provider:       provider,
		verifier:       verifier,
	}, nil
}

func (h *handlerImpl) VerifyBearerToken(token string) (string, error) {
	if token == "" {
		return "", errors.New("token must not be empty")
	}

	idToken, err := h.verifier.Verify(context.Background(), token)
	if err != nil {
		return "", fmt.Errorf("failed to verify token: %w", err)
	}

	var claims struct {
		Sub string `json:"sub"`
	}
	if err := idToken.Claims(&claims); err != nil {
		return "", fmt.Errorf("failed to parse token claims: %w", err)
	}

	if claims.Sub == "" {
		return "", errors.New("invalid token: missing subject")
	}

	return claims.Sub, nil
}
