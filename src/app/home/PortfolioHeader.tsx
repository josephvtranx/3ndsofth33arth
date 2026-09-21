import Link from "next/link";
import styles from "./home.module.css";

export default function PortfolioHeader({ active }: { active?: "about" | "works" | "ink" | "contact" }) {
  return (
    <header className={styles.header}>
      <h1 className={styles.name}><Link href="/" aria-label="Esther Ko — back to landing page">Esther Ko</Link></h1>
      <nav aria-label="Main navigation" className={styles.navigation}>
        <Link href="/about" aria-current={active === "about" ? "page" : undefined}>About</Link>
        <Link href="/works" aria-current={active === "works" ? "page" : undefined}>Works</Link>
        <Link href="/ink" aria-current={active === "ink" ? "page" : undefined}>Ink</Link>
        <Link href="/contact" aria-current={active === "contact" ? "page" : undefined}>Contact</Link>
      </nav>
    </header>
  );
}
