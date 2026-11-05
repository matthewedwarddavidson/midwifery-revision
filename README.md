# Midwifery revision

Revision quizzes for a midwifery degree. Live at https://matthewedwarddavidson.github.io/midwifery-revision/

React + Vite + TypeScript, deployed to GitHub Pages on every push to `main`. Progress is kept in the browser; signing in with Google syncs it across devices through Firebase (Firestore, rules in `firestore.rules`).

## Adding content

Content lives in `src/content`. Each module has topics and resources (quizzes so far), listed in `src/content/index.ts`.

To import a Word quiz where correct options are highlighted:

```sh
node scripts/import-quiz.mjs "quiz.docx" src/content/<module>/<quiz>.json --prefix <module>
```

Then set each question's `topic` and add the quiz to the module. Re-importing keeps ids and topics for unchanged questions. Never reuse or renumber ids: progress is stored against them.

## Firebase settings

The build reads `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` and `VITE_FIREBASE_APP_ID` (repository variables in CI, `.env.local` locally). They're publishable web keys; the security rules protect the data. Without them the app runs local-only and hides sign-in.

## Development

```sh
npm ci
npm run dev
npm test
```
