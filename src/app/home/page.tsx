import Image from "next/image";
import Link from "next/link";
import PortfolioHeader from "./PortfolioHeader";
import ArtworkCard from "./ArtworkCard";
import styles from "./home.module.css";

const movements = [
  { name: "nightfall", width: 1066, height: 1600, alt: "Nightfall, a dark layered mixed-media work", materials: "Acrylic, plastic, plaster, wire, sand, gravel, & mixed media on panel", description: "Nightfall explores the strange comfort that can be found in bondage & suffocation, simply because it is familiar." },
  { name: "death", width: 1066, height: 1600, alt: "Death, a mixed-media work with shed snakeskin and dried florals", materials: "Watercolor, dirt, ash, shed snakeskin, dried floral, thread, gel medium & mixed media on panel", description: "Inspired by the Fall in Genesis, Death reflects the spiral into the end of oneself and the confrontation with the inescapable reality of death." },
  { name: "dawning", width: 1066, height: 1600, alt: "Dawning, a black textured mixed-media work with a small point of light", materials: "Acrylic, charcoal, gel medium, plaster, gravel, wood glue, LED light & mixed media on panel", description: "Dawning evokes the discovery of a Light that had always been present beyond the horizon, waiting patiently until the darkness became too great to ignore." },
  { name: "exposure", width: 1600, height: 1066, alt: "Exposure, a green and rust-colored layered mixed-media work", materials: "Acrylic, watercolor, crackle paste, buttons, rust-dyed fabric, tissue paper & mixed media on panel", description: "Exposure captures the moment I expected the Light to shame me, only to find that it revealed me instead." },
  { name: "rebirth", width: 1066, height: 1600, alt: "Rebirth, a red and white mixed-media work with a circular feathered form", materials: "Acrylic, feathers, mesh, tulle, spray foam & mixed media on panel", description: "Rebirth reflects the freedom made possible through a necessary sacrifice, revealing that exposure was not the end of the story, but the beginning of new life." },
];

export default function Home() {
  return (
    <main className={styles.home} id="top">
      <PortfolioHeader />
      <figure className={styles.featured}>
        <div className={styles.exhibition}>
          <Image
            src="/images/apoptosis/exhibition-overview.jpg"
            alt="The five Apoptosis mixed-media artworks and accompanying poems installed at the 2026 UW Design Show"
            width={1800}
            height={1200}
            sizes="116vw"
            preload
            className={styles.exhibitionImage}
          />
        </div>
        <figcaption className={styles.caption}>
          <div>
            <p className={styles.captionTitle}>Apoptosis Collection, 2026</p>
            <p className={styles.captionTitle}>2026 UW Design Show</p>
            <p>Mixed Media on Wooden Canvas</p>
            <p>24x32 in.</p>
          </div>
        </figcaption>
      </figure>


      <article id="apoptosis" className={styles.project} aria-labelledby="apoptosis-title">
        <header className={styles.projectHeading}>
          <p className={styles.eyebrow}>selected work</p>
          <h2 id="apoptosis-title">apoptosis</h2>
          <p className={styles.meta}>poetry · visual art · reflections</p>
        </header>
        <div className={styles.prose}>
          <p>Apoptosis is a collection of poetry, visual art, and reflections exploring identity, suffering, transformation, and the relentless pursuit of the grace of a forgiving God. It is curated to invite readers into moments of pause, reflection, and wonder.</p>
          <p className={styles.introContinuation}>For most of my life, I hated being asked this simple question:</p>
          <p><em>Who are you?</em></p>
        </div>
        <section className={styles.artworks} aria-labelledby="movements-title">
          <h3 id="movements-title" className={styles.meta}>five movements</h3>
          <div className={styles.movementGrid}>
            {movements.map((work) => <ArtworkCard key={work.name} work={work} />)}
          </div>
        </section>
        <div className={styles.prose}>
          <p>I never knew how to answer correctly. The answer always seemed to change depending on who I was trying to impress or what temporary vice I hoped would finally make me feel whole. I hated how I didn’t know what to put my identity in.</p>
          <p>I distracted myself before I had to confront why I couldn’t be content with not having a solid answer. So I ran—into relationships. Sex. Drugs. Noise. Although temporary, I would take anything that could satisfy the fear of uncertainty, and the recurring hunger of my heart’s empty gut.</p>
          <p>But after a three-day acid trip in college that led to two months of psychosis, I came to a dead end. I found myself face-to-face with the very question I had spent my entire life avoiding:</p>
          <p><em>Who was I, really?</em></p>
        </div>
        <figure className={styles.bookHero}>
          <Image src="/images/apoptosis/book-open.jpg" alt="An open Apoptosis book on a textured gray surface, showing the poems Cain’s and Offering" width={1600} height={1199} sizes="100vw" />
        </figure>
        <div className={styles.prose}>
          <p>Apoptosis traces the slow unraveling of the false selves we construct to survive—and the opportunity for new life to emerge when those versions of ourselves begin to die.</p>
          <p>This collection refuses to water down the ache of a generation starving for love, truth, identity, authenticity, and belonging.</p>
          <p>Apoptosis will begin in that very hunger. In many ways, it is also the dinner bell for those who do not yet realize they are famished to come home.</p>
          <p>Welcome to my testimony of blossom, from burial.</p>
        </div>
        <section className={styles.bookSection} aria-labelledby="book-title">
          <div className={styles.sectionHeading}>
            <h3 id="book-title" className={styles.meta}>apoptosis: the burial before the bloom</h3>
            <a href="/documents/apoptosis.pdf" target="_blank" rel="noreferrer" className={styles.meta}>read the full book ↗</a>
          </div>
          <div className={styles.bookGrid}>
            <figure><Image src="/images/apoptosis/cover.jpg" alt="Apoptosis book cover" width={1600} height={1200} sizes="(max-width: 600px) 100vw, 50vw" /><figcaption className={styles.meta}>cover</figcaption></figure>
            <figure><Image src="/images/apoptosis/book-open.jpg" alt="Interior poetry spread of the Apoptosis book" width={1600} height={1199} sizes="(max-width: 600px) 100vw, 50vw" /><figcaption className={styles.meta}>interior spread</figcaption></figure>
          </div>
        </section>
        <section className={styles.exhibitionSection} aria-labelledby="exhibition-title">
          <h3 id="exhibition-title" className={styles.meta}>in exhibition</h3>
          <div className={styles.exhibitionGrid}>
            <figure><Image src="/images/apoptosis/exhibition-overview.jpg" alt="The Apoptosis collection with accompanying poems at the 2026 UW Design Show" width={1800} height={1200} sizes="(max-width: 600px) 100vw, 50vw" /><figcaption className={styles.meta}>2026 UW Design Show</figcaption></figure>
            <figure className={styles.exhibitionTall}><Image src="/images/apoptosis/exhibition-book.jpg" alt="Apoptosis books and dried flowers displayed on a table at the exhibition" width={1800} height={1200} sizes="(max-width: 600px) 100vw, 50vw" /><figcaption className={styles.meta}>the book in exhibition</figcaption></figure>
            <figure><Image src="/images/apoptosis/installation.jpg" alt="The five mixed-media works displayed together on a gallery wall" width={1800} height={1499} sizes="(max-width: 600px) 100vw, 50vw" /><figcaption className={styles.meta}>the collection</figcaption></figure>
          </div>
        </section>
      </article>
      <section className={styles.otherWorks} aria-labelledby="other-works-title">
        <h2 id="other-works-title" className={styles.eyebrow}>other works</h2>
        <div className={styles.workLinks}>
          <Link href="/works#soul-searching">soul searching<span aria-hidden="true">.</span></Link>{" "}
          <Link href="/works#writing">writing<span aria-hidden="true">.</span></Link>
        </div>
      </section>
      <footer className={styles.footer}>
        <a href="#top">Back to Top</a>
        <Link href="/contact">Contact</Link>
        <Link href="/booking">Booking</Link>
      </footer>
    </main>
  );
}
