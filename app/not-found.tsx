import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <div>
        <h1>404</h1>
        <p>This Vivir review only includes the approved directions.</p>
        <Link href="/">Return to review</Link>
      </div>
    </main>
  );
}
