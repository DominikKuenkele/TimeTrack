package authentification

import "testing"

func TestRebaseURL(t *testing.T) {
	tests := []struct {
		name, url, from, to, want string
	}{
		{
			name: "moves a URL under from",
			url:  "http://localhost:5556/dex/keys",
			from: "http://localhost:5556/dex", to: "http://dex:5556/dex",
			want: "http://dex:5556/dex/keys",
		},
		{
			name: "ignores trailing slashes of from and to",
			url:  "http://localhost:9000/application/o/timetrack/jwks/",
			from: "http://localhost:9000/application/o/timetrack/", to: "http://authentik:9000/application/o/timetrack/",
			want: "http://authentik:9000/application/o/timetrack/jwks/",
		},
		{
			name: "keeps a URL that is already under to",
			url:  "http://dex:5556/dex/keys",
			from: "http://localhost:5556/dex", to: "http://dex:5556/dex",
			want: "http://dex:5556/dex/keys",
		},
		{
			name: "keeps a URL that only shares a prefix of the path",
			url:  "http://localhost:5556/dexter/keys",
			from: "http://localhost:5556/dex", to: "http://dex:5556/dex",
			want: "http://localhost:5556/dexter/keys",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := rebaseURL(tt.url, tt.from, tt.to); got != tt.want {
				t.Errorf("rebaseURL(%q, %q, %q) = %q, want %q", tt.url, tt.from, tt.to, got, tt.want)
			}
		})
	}
}
