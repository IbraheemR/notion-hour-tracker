# Ibraheem's Notion Hour Tracker

Provides webhooks via Firebase Cloud Functions to track the number of hours on different projects in a Notion database.

I use iOS shortcuts to call these webhooks. They are not included here.

If you want to use this, supply a notion token and a database id in `.env` (this should really be in GCP secrets, but this is fine for my personal use). See `.env.example` for more info.

Also does not include `.firebaserc` since this is specific to each deployment.