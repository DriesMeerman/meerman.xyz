#!/bin/sh
set -eu

site_url="${1:?The site URL is required}"
expected_revision="${2:?The expected Git revision is required}"
attempts="${DEPLOY_CHECK_ATTEMPTS:-12}"
delay="${DEPLOY_CHECK_DELAY:-5}"
attempt=1

while [ "$attempt" -le "$attempts" ]; do
  if actual_revision=$(curl --fail --silent --show-error --connect-timeout 5 --max-time 15 \
    --header 'Cache-Control: no-cache' \
    "${site_url%/}/deployment-revision.txt?expected=$expected_revision"); then
    if [ "$actual_revision" = "$expected_revision" ]; then
      echo "Deployment verified: $expected_revision"
      exit 0
    fi
  fi

  echo "The site has not served revision $expected_revision (attempt $attempt/$attempts)." >&2
  if [ "$attempt" -lt "$attempts" ]; then sleep "$delay"; fi
  attempt=$((attempt + 1))
done

echo "Deployment verification failed for $site_url." >&2
exit 1
