#!/bin/sh
# Markdown list of what reached the default branch since the last tag matching $1 (e.g. 'deploy-*'):
# for merge commits the MR title and reference, for direct commits their subject.
set -eu

previous=$(git describe --tags --abbrev=0 --match "$1" HEAD^ 2>/dev/null || true)
if [ -z "$previous" ]; then
  echo "- First release of this kind, no earlier one to compare with"
  exit
fi

git log --first-parent --format='%H %P' "$previous..HEAD" | while read -r sha parents; do
  if [ "$(echo "$parents" | wc -w)" -gt 1 ]; then
    body=$(git show -s --format=%b "$sha")
    echo "- $(echo "$body" | sed -n 1p) $(echo "$body" | grep -o '![0-9]*' | tail -n 1)"
  else
    echo "- $(git show -s --format=%s "$sha")"
  fi
done
