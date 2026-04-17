package authentification

import (
	"fmt"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

func BuildAuthenticator(logger logger.Logger, oauthServerURL, oauthDiscoveryURL, oauthClientID string) (API, error) {
	authenticatorHandler, err := NewHandler(logger, oauthServerURL, oauthDiscoveryURL, oauthClientID)
	if err != nil {
		return nil, fmt.Errorf("error building authenticator. %+v", err)
	}

	api := NewAPI(logger, authenticatorHandler)

	return api, nil
}
