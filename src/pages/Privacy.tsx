import { Link } from 'react-router'

/** Shown at the bottom of the page when set. Leave empty to hide the contact line. */
const CONTACT_EMAIL = ''

export function Privacy() {
  return (
    <div className="page narrow prose">
      <header className="page-header">
        <h1>Privacy</h1>
        <p>What this site stores about you, and how to delete it.</p>
      </header>

      <h2>If you don't sign in</h2>
      <p>
        Your answers and settings are saved only in this browser, on this device. Nothing about you is sent anywhere.
      </p>

      <h2>If you sign in with Google</h2>
      <p>So your progress follows you between devices, the site stores:</p>
      <ul>
        <li>
          <strong>Your Google account details:</strong> name, email address, profile photo link, and when you signed up
          and last signed in.
        </li>
        <li>
          <strong>Your progress:</strong> each answer (which question, right or wrong, and when) and each round you
          finish.
        </li>
      </ul>
      <p>
        These are kept in Google Firebase, on servers in the United States. Only you can see your progress in the app.
        The site's owner can see the list of accounts and the stored progress through Firebase's admin console, and
        doesn't use them for anything except running the site.
      </p>

      <h2>What the site doesn't do</h2>
      <p>
        No adverts, no analytics and no tracking cookies. Your data isn't sold or shared. Fonts are served from this
        site, not from Google.
      </p>

      <h2>Other services</h2>
      <p>
        The site is hosted on GitHub Pages, which logs visitors' IP addresses for security (see{' '}
        <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">
          GitHub's privacy statement
        </a>
        ). Signing in uses Google's sign-in, covered by{' '}
        <a href="https://policies.google.com/privacy">Google's privacy policy</a>.
      </p>

      <h2>How long it's kept, and deleting it</h2>
      <p>
        Your data is kept until you delete it. In <Link to="/settings">Settings</Link>, <strong>Clear progress</strong>{' '}
        removes your answers and rounds but keeps your account. <strong>Delete my account and data</strong> removes your
        account and everything stored about you.
      </p>

      {CONTACT_EMAIL && (
        <>
          <h2>Questions</h2>
          <p>
            Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </>
      )}

      <p className="faint small">Last updated 5 November 2026.</p>
    </div>
  )
}
