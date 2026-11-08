# Midwifery revision

A little app I made to help my wife revise for her midwifery degree. It starts with one revision quiz, and I'll add more content as she progresses through her studies.

Live at https://matthewedwarddavidson.github.io/midwifery-revision/

It uses the same template as [deutsch-lernen](https://github.com/matthewedwarddavidson/deutsch-lernen), my German learning app: React, Vite and TypeScript, deployed to GitHub Pages on every push to `main`. Progress is kept in the browser, and signing in with Google syncs it across devices through Firebase (Firestore, rules in `firestore.rules`).

## Adding content

Content lives in `src/content`. Each module has topics and resources (quizzes so far), listed in `src/content/index.ts`.

To import a Word quiz where correct options are highlighted, or marked with ✅ (detected automatically):

```sh
node scripts/import-quiz.mjs "quiz.docx" src/content/<module>/<quiz>.json --prefix <module>
```

Then set each question's `topic` and add the quiz to the module. Re-importing keeps ids and topics for unchanged questions. Never reuse or renumber ids: progress is stored against them.

### Diagrams

Labelling diagrams are numbered images from Wikimedia Commons, stored in `public/diagrams` and defined in `src/content/<module>/diagrams.ts`. Each label is tracked like a question (id `<diagram id>-<number>`), so never renumber them. Check every answer against the image: Commons legends contain mistakes.

Credits (each is also shown under its diagram):

- Heart: MesserWoland, after Wapcaplet, CC BY-SA 3.0
- Respiratory system: LadyofHats and Jmarchn, public domain
- Pelvis: Fred the Oyster, CC BY-SA 4.0
- Breast; ovary and fallopian tube: US National Cancer Institute (SEER Training), public domain
- Kidney: Piotr Michał Jaworski, CC BY-SA 3.0

## Firebase settings

The build reads `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` and `VITE_FIREBASE_APP_ID` (repository variables in CI, `.env.local` locally). They're publishable web keys; the security rules protect the data. Without them the app runs local-only and hides sign-in.

## Development

```sh
npm ci
npm run dev
npm test
```
