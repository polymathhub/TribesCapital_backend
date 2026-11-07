# File Upload Storage

Profile images, chat attachments, due-diligence files, and project-pipeline files use multipart uploads. In production, the application server's local disk is the default storage provider unless `UPLOAD_STORAGE_PROVIDER=s3` is explicitly set. In non-production environments, S3 remains the default provider unless `UPLOAD_STORAGE_PROVIDER=local` is set.

## Application settings

For S3 storage, configure these backend environment variables:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_S3_URL` (optional custom asset base URL)

To select local disk storage explicitly (recommended on a persistent Plesk server), set:

- `UPLOAD_STORAGE_PROVIDER=local`
- `UPLOADS_STORAGE_PATH` to an absolute path in a private directory outside the release/application directory (for example, `/var/www/vhosts/<domain>/private/tribes-uploads`)

The application process must be able to write to `UPLOADS_STORAGE_PATH`. Confirm the directory survives both PM2 restarts and deployments, monitor available disk space, and include it in regular backups. Local storage does not require AWS credentials for new uploads. When local mode is enabled, existing objects not present on disk continue to be read from S3 if S3 is configured; this allows a gradual transition without breaking saved profile and document URLs. If an older S3 object is missing locally, serving it still requires valid S3 credentials and permissions. Profile images and messaging attachments use public routes; due-diligence and project-pipeline downloads require an authenticated API request. Protect server access and backups accordingly. Incomplete multipart sessions are stored under `.multipart` and should be removed periodically after confirming they are no longer active.

For PM2, set `UPLOADS_STORAGE_PATH` in the application's environment (for example, its ecosystem configuration or the environment used by the Plesk Node.js app), create the directory, and grant the PM2 process user write access. Production defaults to local storage unless `UPLOAD_STORAGE_PROVIDER=s3` is set. Restart PM2 after changing environment variables. If PM2 runs multiple hosts/containers rather than multiple processes on the same Plesk filesystem, local storage must be a shared persistent mount; otherwise use S3.

- `API_PUBLIC_URL` (public backend origin used to build OAuth callback URLs)
- `SOCIAL_PROFILE_CALLBACK_URL` (optional exact OAuth callback URL override)
- `SOCIAL_PROFILE_FRONTEND_URL` (frontend origin allowed to receive OAuth popup completion messages)
- `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`
- `X_CLIENT_ID` and `X_CLIENT_SECRET`
- `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET`
- `INSTAGRAM_GRAPH_VERSION` (optional, defaults to `v23.0`)

For S3 storage, the runtime identity needs `s3:PutObject`, `s3:AbortMultipartUpload`, `s3:ListMultipartUploadParts`, `s3:GetObject`, and `s3:DeleteObject` for the configured bucket. Keep the bucket private; file download routes issue short-lived signed URLs after checking record access. Profile image URLs use a stable public API path that redirects to a short-lived S3 signature, so the URL stored in a user record does not expire.

Register `SOCIAL_PROFILE_CALLBACK_URL` as the exact redirect URI in all three provider apps. LinkedIn requests OpenID Connect `openid profile email`; this normally supplies name and profile picture, not headline or location. X requests `users.read users.email offline.access` and can supply name, bio, location, profile image, and website where available. Instagram requires an eligible professional account and the `instagram_business_basic` permission; it can supply name, username, biography, profile image, and website where the API returns them. Imported values fill empty Tribes Capital fields only. Provider tokens are exchanged and discarded on the backend.

## S3 bucket CORS

When using S3, add a bucket CORS rule for each real application origin and the local Vite origin used by developers. Do not use `*` for production origins. S3 must expose `ETag` so the browser can complete a multipart upload, and `Content-Length` so the download UI can report byte progress.

```json
[
  {
    "AllowedOrigins": [
      "http://community.tribes.capital",
      "https://community.tribes.capital"
    ],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3000
  }
]
```

Replace `https://community.tribes.capital` with the deployed frontend origin. If the API and frontend use additional origins, list each explicitly.

## Interrupted uploads

The browser saves the upload ID, object key, and completed part ETags in local storage, scoped to the selected file and upload purpose. If a transfer is interrupted, select the same file again to resume completed parts. For S3, add a bucket lifecycle rule to abort incomplete multipart uploads after seven days. For local storage, periodically remove abandoned directories under `.multipart` only after confirming they are older than the maximum upload-resume window.

## Database migration

Production startup applies pending checked-in Prisma migrations automatically. To apply the migration manually before deploying the updated backend:

```sh
npx prisma migrate deploy
npx prisma generate
```

The migration adds the S3 key for portfolio documents, multi-profile links for users, and pipeline metadata and attachments for projects.
