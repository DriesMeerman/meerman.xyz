# Deployment and stale-site recovery

Production is deployed from `main`, not `master`. A push to `main` builds the static site, publishes `chrozera/meerman.xyz:sha-<commit>` and `latest`, then replaces the `meerman.xyz` container on the VPS. Pull requests only build. A PR merged into a feature branch does not deploy until its changes reach `main`.

The server port mapping remains `4337:8080`, behind the existing TLS reverse proxy. No new server package, secret, port, or nginx proxy change is required for this fix.

## September 30, 2026 incident

[Deployment run 36689817292](https://github.com/DriesMeerman/meerman.xyz/actions/runs/36689817292) published the new image, but the server pull failed with:

```text
write /var/lib/docker/tmp/GetImageBlob034793014: no space left on device
```

The old SSH script continued, replaced the container using its cached `latest` image, and passed the HTTP 200 health check. A fresh public request still returned files last modified September 15. This was a server disk-space failure, rather than a missing workflow trigger.

## Server recovery

SSH into the VPS and inspect available disk space, inodes, and Docker usage:

```sh
df -h / /var/lib/docker
df -i / /var/lib/docker
docker system df
docker ps --filter 'name=^/meerman[.]xyz$'
```

If Docker reports reclaimable dangling images or build cache, these commands offer interactive cleanup:

```sh
docker image prune
docker builder prune
```

`docker image prune` without `-a` removes dangling images unused by containers. `docker builder prune` removes unused build cache. Review the prompts; these commands do not remove volumes or the running site's image. If storage is still full, investigate other disk use or increase the VPS disk. Leave enough free space to pull and unpack a new image while the current image remains installed. Do not delete `/var/lib/docker` or prune volumes as part of this recovery.

Commit-specific images remain tagged locally after deployments, so dangling-image pruning alone will not remove those older revisions. Periodically inspect `docker image ls chrozera/meerman.xyz` and remove selected old commit tags with `docker image rm chrozera/meerman.xyz:sha-<old-commit>`, retaining the current image and any rollback revisions you want. Monitor VPS disk usage to avoid another full filesystem.

Merge the deployment-fix PR into `main` after freeing space. That merge starts a new deployment. Alternatively, once the fix is on `main`, select **Actions → Build and publish → Run workflow → main**. Re-running a workflow from an older commit still uses the old deployment script.

## Deployment verification

The SSH script pulls the exact commit tag and checks its image revision label before stopping the current container. Pull failures leave the current site running and fail the job. The workflow serializes runs for the same branch and uses a released SSH action version.

Each CI build includes `deployment-revision.txt`. The container serves it with `Cache-Control: no-store` and returns 404 if it is missing, rather than returning the SPA fallback. After SSH deployment, the workflow compares the public response with the expected full commit SHA. An old site returning HTTP 200 fails this check.

After a successful deployment, compare the local upstream with the public site:

```sh
curl -fsS http://127.0.0.1:4337/deployment-revision.txt
curl -fsS -H 'Cache-Control: no-cache' https://meerman.xyz/deployment-revision.txt
docker inspect --format '{{.Config.Image}}' meerman.xyz
```

Both responses should contain the deployed commit SHA. If the local result is current but the public result is old, inspect the VPS reverse proxy's `proxy_pass` and any proxy/CDN cache. The existing proxy should forward to `http://127.0.0.1:4337` or `http://localhost:4337`.

The tagged-release workflow records the same revision marker and label, but publishes images only. It does not replace the VPS container.

## Repository checks

```sh
node --test tools/deploy/deployment.test.mjs
sh -n tools/deploy/deploy-container.sh tools/deploy/verify-revision.sh
```

The tests simulate pull and stop failures, image revision mismatches, and public responses containing an old revision, an HTTP error, or an SPA fallback. They do not access the production server.
