import Image from "next/image";
import Link from "next/link";
import PortfolioHeader from "../home/PortfolioHeader";
import Halftone from "@/components/Halftone";
import styles from "./ink.module.css";
import { getInstagramPosts } from "./instagram";

export const revalidate = 3600;

const GALLERY = [
  {
    src: "/images/ink/ink-sleeve-01.jpg",
    alt: "layered black and gray linework sleeve",
    href: "https://www.instagram.com/3ndsofth33arth/p/DcShKYMm73j/",
  },
  {
    src: "/images/ink/ink-shoulder-02.jpg",
    alt: "black and gray shoulder and upper-arm tattoo",
    href: "https://www.instagram.com/3ndsofth33arth/p/DconIaHGXer/",
  },
  {
    src: "/images/ink/ink-hand-03.jpg",
    alt: "three monkeys tattoo on the back of a hand",
    href: "https://www.instagram.com/3ndsofth33arth/p/DcY4u-YG3aN/",
  },
];

export default async function InkPage() {
  const instagramPosts = await getInstagramPosts();
  const gallery = instagramPosts.length ? instagramPosts : GALLERY;
  return (
    <main className={styles.page}>
      <PortfolioHeader active="ink" />
      <section id="ink" aria-label="Tattoo portfolio" className={styles.portfolio}>
        <div className={styles.socials}>
          <a href="https://www.tiktok.com/@3ndsofth33arth" target="_blank" rel="noreferrer">tiktok - @3ndsofth33arth</a>
          <a href="https://www.instagram.com/3ndsofth33arth/" target="_blank" rel="noreferrer">instagram - @3ndsofth33arth</a>
        </div>
        <div className={styles.galleryArea}>
          <Halftone className={styles.dots} size={260} dot={1.4} gap={12} color="#e6e6e6" />
          <p className={styles.subtitle}>black &amp; gray · fine line · engraving</p>
          <div className={styles.gallery}>
            {gallery.map(post => (
              <a key={post.href} href={post.href} target="_blank" rel="noreferrer" aria-label={`View ${post.alt} on Instagram`} className={styles.post}>
                <Image unoptimized={post.src.startsWith("https://")} src={post.src} alt={post.alt} fill sizes="(max-width: 600px) 90vw, 30vw" />
              </a>
            ))}
          </div>
        </div>
        <div className={styles.booking}>
          <Link href="/booking">interested? → booking &amp; policies</Link>
        </div>
      </section>
    </main>
  );
}
