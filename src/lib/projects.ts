export type ProjectMedia =
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
      displayScale?: number;
    }
  | {
      type: "placeholder";
      label: string;
      height: number;
    };

export type ProjectMediaGroup = {
  title?: string;
  link?: {
    href: string;
    label: string;
    newTab?: boolean;
  };
  layout: "grid" | "stage-grid" | "wide-grid" | "stack";
  items: ProjectMedia[];
};

export type PortfolioProject = {
  id: string;
  name: string;
  subtitle: string;
  description: string[];
  cover: {
    image: string | null;
    label: string;
    labelColor: string;
  };
  mediaGroups: ProjectMediaGroup[];
};

export const PROJECTS: PortfolioProject[] = [
  {
    id: "soul-searching",
    name: "soul searching",
    subtitle: "a street outreach series — lost & found posters for the soul",
    description: [],
    cover: {
      image: "/images/soul-poster.png",
      label: "",
      labelColor: "#ffffff",
    },
    mediaGroups: [
      {
        layout: "grid",
        items: [
          {
            type: "image",
            src: "/images/soul-poster.png",
            alt: "soul searching — poster",
          },
          {
            type: "image",
            src: "/images/soul-pole.png",
            alt: "soul searching — posted on a utility pole",
          },
        ],
      },
      {
        layout: "wide-grid",
        items: [
          {
            type: "image",
            src: "/images/soul-card-front.png",
            alt: "soul searching — card front",
          },
          {
            type: "image",
            src: "/images/soul-card-back.png",
            alt: "soul searching — card back",
          },
        ],
      },
    ],
  },
  {
    id: "apoptosis",
    name: "apoptosis",
    subtitle: "poetry · visual art · reflections",
    description: [
      "Apoptosis is a collection of poetry, visual art, and reflections exploring identity, suffering, transformation, and the relentless pursuit of the grace of a forgiving God. It is curated to invite readers into moments of pause, reflection, and wonder.",
      "The project does not demand a response. It invites attention. It asks the viewer to pause long enough for something familiar to become strange, or something uncomfortable to become meaningful.",
    ],
    cover: {
      image: "/images/apoptosis/cover.jpg",
      label: "",
      labelColor: "#ffffff",
    },
    mediaGroups: [
      {
        title: "the collection",
        layout: "stack",
        items: [
          {
            type: "image",
            src: "/images/apoptosis/installation.jpg",
            alt: "The five Apoptosis mixed-media works displayed together in sequence",
            caption: "nightfall · death · dawning · exposure · rebirth",
          },
        ],
      },
      {
        title: "five movements",
        layout: "stage-grid",
        items: [
          {
            type: "image",
            src: "/images/apoptosis/nightfall.jpg",
            alt: "Nightfall, a dark layered mixed-media work",
            caption: "nightfall",
          },
          {
            type: "image",
            src: "/images/apoptosis/death.jpg",
            alt: "Detail from Death featuring shed snakeskin, dried florals, and earth-toned materials",
            caption: "death",
            displayScale: 0.92,
          },
          {
            type: "image",
            src: "/images/apoptosis/dawning.jpg",
            alt: "Dawning, a black textured mixed-media work with a small point of light",
            caption: "dawning",
          },
          {
            type: "image",
            src: "/images/apoptosis/exposure.jpg",
            alt: "Exposure, a green and rust-colored layered mixed-media work",
            caption: "exposure",
          },
          {
            type: "image",
            src: "/images/apoptosis/rebirth.jpg",
            alt: "Rebirth, a red and white mixed-media work with a circular feathered form",
            caption: "rebirth",
            displayScale: 1.12,
          },
        ],
      },
      {
        title: "the book",
        link: {
          href: "/documents/apoptosis.pdf",
          label: "read the full book ↗",
          newTab: true,
        },
        layout: "wide-grid",
        items: [
          {
            type: "image",
            src: "/images/apoptosis/cover.jpg",
            alt: "Apoptosis book cover presented on a textured gray surface",
            caption: "cover",
          },
          {
            type: "image",
            src: "/images/apoptosis/book-open.jpg",
            alt: "Open Apoptosis book showing a poetry spread",
            caption: "interior spread",
          },
        ],
      },
      {
        title: "in exhibition",
        layout: "wide-grid",
        items: [
          {
            type: "image",
            src: "/images/apoptosis/exhibition-overview.jpg",
            alt: "The five Apoptosis artworks installed at the 2026 UW Design Show",
            caption: "2026 UW Design Show",
          },
          {
            type: "image",
            src: "/images/apoptosis/exhibition-book.jpg",
            alt: "Copies of the Apoptosis book displayed with dried flowers at the exhibition",
            caption: "the book in exhibition",
          },
        ],
      },
    ],
  },
  {
    id: "writing",
    name: "writing",
    subtitle: "words along the way",
    description: [],
    cover: {
      image: null,
      label: "writing",
      labelColor: "#555555",
    },
    mediaGroups: [
      {
        layout: "stack",
        items: [
          {
            type: "placeholder",
            label: "writing excerpt #1 — coming soon",
            height: 520,
          },
          {
            type: "placeholder",
            label: "writing excerpt #2 — coming soon",
            height: 520,
          },
        ],
      },
    ],
  },
];
