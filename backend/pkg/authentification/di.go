package authentification

func BuildAuthenticator(devUser string) API {
	return NewAPI(devUser)
}
