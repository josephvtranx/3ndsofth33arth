import Link from "next/link";
import LandingInteractions from "./LandingInteractions";
import styles from "./landing.module.css";

export default function LandingPage() {
  return (
    <main className={styles.landing}>
      <LandingInteractions />
      <span aria-hidden="true" className={styles.star}>✺</span>
      <div aria-hidden="true" className={styles.dotField}>
        <div className={`${styles.lens} ${styles.dotsLeft}`} />
        <div className={`${styles.lens} ${styles.dotsRight}`} />
        <div className={`${styles.lens} ${styles.dotsBottom}`} />
      </div>
      <Link href="/home" className={styles.enter} aria-label="Enter Esther Ko’s home page">
        <div className={styles.identity}>
          <h1>esther ko</h1>
          <p>tattoo · writing · mixed media</p>
        </div>
      </Link>
      <Link href="/booking" className={styles.booking}>booking <span aria-hidden="true">→</span></Link>
    </main>
  );
}
