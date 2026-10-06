# Object Storage Uploads

Profile images, chat attachments, due-diligence files, and project-pipeline files use private S3 multipart uploads. The browser sends 8 MiB parts directly to S3; the API issues short-lived URLs, verifies ownership of each object key, completes the multipart upload, and stores the resulting key with its owning record.

## Application settings

Configure these backend environment variables:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_S3_BUCKET`
- `AWS_S3_URL` (optional custom asset base URL)
- `API_PUBLIC_URL` (public backend origin used to build OAuth callback URLs)
- `SOCIAL_PROFILE_CALLBACK_URL` (optional exact OAuth callback URL override)
- `SOCIAL_PROFILE_FRONTEND_URL` (frontend origin allowed to receive OAuth popup completion messages)
- `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`
- `X_CLIENT_ID` and `X_CLIENT_SECRET`
- `INSTAGRAM_CLIENT_ID` and `INSTAGRAM_CLIENT_SECRET`
- `INSTAGRAM_GRAPH_VERSION` (optional, defaults to `v23.0`)

The runtime identity needs `s3:PutObject`, `s3:AbortMultipartUpload`, `s3:ListMultipartUploadParts`, `s3:GetObject`, and `s3:DeleteObject` for the configured bucket. Keep the bucket private; file download routes issue short-lived signed URLs after checking record access. Profile image URLs use a stable public API path that redirects to a short-lived S3 signature, so the URL stored in a user record does not expire.

Register `SOCIAL_PROFILE_CALLBACK_URL` as the exact redirect URI in all three provider apps. LinkedIn requests OpenID Connect `openid profile email`; this normally supplies name and profile picture, not headline or location. X requests `users.read users.email offline.access` and can supply name, bio, location, profile image, and website where available. Instagram requires an eligible professional account and the `instagram_business_basic` permission; it can supply name, username, biography, profile image, and website where the API returns them. Imported values fill empty Tribes Capital fields only. Provider tokens are exchanged and discarded on the backend.

## Bucket CORS

Add a bucket CORS rule for each real application origin and the local Vite origin used by developers. Do not use `*` for production origins. S3 must expose `ETag` so the browser can complete a multipart upload, and `Content-Length` so the download UI can report byte progress.

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "https://app.example.com"
    ],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length", "Content-Type"],
    "MaxAgeSeconds": 3000
  }
]
```

Replace `https://app.example.com` with the deployed frontend origin. If the API and frontend use additional origins, list each explicitly.

## Interrupted uploads

The browser saves the S3 upload ID, object key, and completed part ETags in local storage, scoped to the selected file and upload purpose. If a transfer is interrupted, select the same file again to resume completed parts. S3 multipart uploads that are never completed should be removed automatically; add a bucket lifecycle rule to abort incomplete multipart uploads after seven days.

## Database migration

Apply the checked-in migration before deploying the updated backend:

```sh
npx prisma migrate deploy
npx prisma generate
```

The migration adds the S3 key for diligence documents, multi-profile links for users, and pipeline metadata and attachments for projects. No database migration was run as part of the local code changes.