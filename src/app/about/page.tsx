import PortfolioHeader from "../home/PortfolioHeader";
import Image from "next/image";
import styles from "./about.module.css";


export default function Page() {
  return <main className={styles.page}><PortfolioHeader active="about" />
      {/* artist statement */}
      <section id="about" aria-label="About Esther Ko" className={styles.statement}>
        <div className={styles.grid}>
          <p className={styles.intro}>
          is a multidisciplinary artist<br />
          she is either tattooing, writing, or working on mixed media pieces with one intention in mind:
          </p>

          <figure className={styles.tattooPhoto}>
            <Image
              src="/images/artist/esther-tattooing.jpg"
              width={640}
              height={480}
              sizes="(max-width: 640px) calc(100vw - 48px), 34vw"
              alt="Esther tattooing a client's chest"
              className="block h-auto w-full grayscale contrast-[1.04]"
            />
          </figure>

          <p className={styles.question}>
            will she be apart of building a kingdom that will die with her, or a Kingdom that will outlive any other?
          </p>

          <p className={styles.reflection}>
            this Kingdom is marked by sharing, so she will share what she discovers about it along the way. there is no
            obligation to come along for the ride, but her hope is that her process might invite you to think more deeply
            about your own.
          </p>

          <figure className={styles.drawingPhoto}>
            <Image
              src="/images/artist/esther-drawing.jpg"
              width={1349}
              height={1800}
              sizes="(max-width: 640px) calc(100vw - 48px), 34vw"
              alt="Esther sketching on a tablet in her studio"
              className="block h-auto w-full grayscale contrast-[1.04]"
            />
          </figure>
        </div>
      </section>

  </main>;
}
