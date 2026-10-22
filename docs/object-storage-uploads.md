# File Upload Storage

Profile images, chat attachments, due-diligence files, and project-pipeline files use multipart uploads. S3 remains the default provider: the browser sends 8 MiB parts directly to S3 and the API issues short-lived URLs. Deployments without cloud-storage credentials can instead store uploads on the application server.

## Application settings

For S3 storage, configure these backend environment variables:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_S3_URL` (optional custom asset base URL)

To use local disk storage, set:

- `UPLOAD_STORAGE_PROVIDER=local`
- `UPLOADS_STORAGE_PATH` (optional absolute path; defaults to `<application-root>/storage/uploads`)

The application process must be able to write to `UPLOADS_STORAGE_PATH`. Choose a persistent directory that is not removed during deployments, monitor available disk space, and include it in regular backups. Local storage does not require AWS credentials. Files are stored outside the directory served as legacy `/uploads` static content. Profile images and messaging attachments use public routes; due-diligence and project-pipeline downloads require an authenticated API request. Protect server access and backups accordingly. Incomplete multipart sessions are stored under `.multipart` and should be removed periodically after confirming they are no longer active.

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
