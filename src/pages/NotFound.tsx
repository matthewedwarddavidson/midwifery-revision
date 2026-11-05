import { Link } from 'react-router'

export function NotFound() {
  return (
    <div className="page narrow">
      <h1>Not found</h1>
      <p className="muted">That page doesn't exist.</p>
      <Link to="/" className="btn">
        Home
      </Link>
    </div>
  )
}
