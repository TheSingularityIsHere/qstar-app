# QSTAR App

This app is deployed at https://qstar-research.com/app

Tested with Node `v22.2.0` (Angular CLI `v18.0.2`).

After cloning the project you will want to
`cp src/environment/firebase.config.ts.example src/environment/firebase.config.ts`
and then
`code src/environment/firebase.config.ts`
to update it with values from your database at
https://console.firebase.google.com/project/qstar-app/database

Useful commands:

```bash
npx firebase login

# create database
npx firebase projects:create
npx firebase init  # we're using "realtime database"

# after updating data.json and database.rules.json
npx firebase deploy
npx firebase database:set / data.json
# then either edit values directly in Firebase UI ...
# ... or use Colab to upload new questions / answers in a batch
npx firebase database:set -f /survey/questions questions.json

# running locally
npm run start

# create new component / service
npx ng generate component vote
npx ng generate service identity

# (tests `ng test` and `ng e2e` not currently used)

# Before moving files "dist/qstar-app/browser" into "/app" directory of server:
npm run build
npm run stage
```

Colab utility to convert sheets to questions suitable for `data.json`:
https://colab.research.google.com/drive/1E8UHuBCCXHNIHqn_Qb8k14RAzhHjjNjE
