import Image from "next/image";
import { CONTACT_EMAIL } from "@/lib/site";
import PortfolioHeader from "../home/PortfolioHeader";
import styles from "./contact.module.css";

const studioMap = "https://www.google.com/maps/search/?api=1&query=Inscape+Arts+815+Seattle+Blvd+S+Seattle+WA+98134";

export default function ContactPage() {
  return (
    <main className={styles.page}>
      <PortfolioHeader active="contact" />
      <section aria-label="Location and contact details" className={styles.content}>
        <div className={styles.details}>
          <section aria-labelledby="location-title">
            <h2 id="location-title">LOCATION</h2>
            <div className={styles.location}>
              <address>
                Inscape Arts Building<br />
                815 Seattle Blvd S, B-14<br />
                Seattle, WA 98134
              </address>
              <a className={styles.mapLink} href={studioMap} target="_blank" rel="noreferrer" aria-label="Find Inscape Arts Building on Google Maps">
                <svg width="22" height="38" viewBox="0 0 22 38" fill="none" aria-hidden="true">
                  <circle cx="11" cy="11" r="9" fill="currentColor" />
                  <path d="M11 19V35" stroke="currentColor" strokeWidth="2" />
                </svg>
              </a>
            </div>
          </section>
          <section aria-labelledby="contact-title" className={styles.contacts}>
            <h2 id="contact-title">CONTACT</h2>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <a href="https://www.instagram.com/3ndsofth33arth/" target="_blank" rel="noreferrer">https://www.instagram.com/3ndsofth33arth/</a>
            <a href="https://www.tiktok.com/@3ndsofth33arth" target="_blank" rel="noreferrer">https://www.tiktok.com/@3ndsofth33arth</a>
          </section>
        </div>
        <Image
          className={styles.locationPhoto}
          src="/images/studio-interior.jpeg"
          alt="Black-and-white photograph of the tattoo studio inside Inscape Arts Building"
          width={1024}
          height={768}
          sizes="(max-width: 700px) calc(100vw - 48px), 84.4vw"
        />
      </section>
    </main>
  );
}
