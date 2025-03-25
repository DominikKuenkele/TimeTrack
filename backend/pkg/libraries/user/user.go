package user

import "context"

type userType string

const userKey userType = "userID"

func ToContext(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userKey, userID)
}

func FromContext(ctx context.Context) string {
	return ctx.Value(userKey).(string)
}
