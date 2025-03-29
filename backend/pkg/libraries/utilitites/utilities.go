package utilitites

func Transform[T any, S any](in []T, f func(T) S) []S {
	transformed := make([]S, 0, len(in))
	for _, t := range in {
		transformed = append(transformed, f(t))
	}

	return transformed
}

func MapKeysToSlice[T comparable, S any](m map[T]S) []T {
	keys := make([]T, 0, len(m))
	for key := range m {
		keys = append(keys, key)
	}

	return keys
}
