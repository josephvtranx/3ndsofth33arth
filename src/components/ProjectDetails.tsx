import type {
  PortfolioProject,
  ProjectMedia,
  ProjectMediaGroup,
} from "@/lib/projects";

type Props = {
  project: PortfolioProject;
};

const GROUP_CLASSES: Record<ProjectMediaGroup["layout"], string> = {
  grid: "grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-start gap-[18px]",
  "stage-grid":
    "grid grid-cols-1 items-start gap-[18px] sm:grid-cols-2 lg:grid-cols-6 [&>figure>div]:aspect-[2/3] [&>figure>div>img]:h-full [&>figure>div>img]:border-0 [&>figure>div>img]:object-cover lg:[&>*]:col-span-2 lg:[&>*:nth-child(4)]:col-start-2 lg:[&>*:nth-child(5)]:col-start-4",
  "wide-grid":
    "grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[18px]",
  stack: "flex flex-col gap-[18px]",
};

function ProjectMediaItem({ media }: { media: ProjectMedia }) {
  if (media.type === "placeholder") {
    return (
      <div
        className="flex w-full items-center justify-center border border-dashed border-[#ccc] bg-[#f3f3f3] px-6 text-center font-mono text-[13px] tracking-[1px] text-[#999]"
        style={{ minHeight: media.height }}
      >
        {media.label}
      </div>
    );
  }

  return (
    <figure className="m-0">
      <div className="overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.src}
          alt={media.alt}
          loading="lazy"
          decoding="async"
          className="block w-full border border-[#e5e5e5]"
          style={
            media.displayScale
              ? { transform: `scale(${media.displayScale})` }
              : undefined
          }
        />
      </div>
      {media.caption && (
        <figcaption className="mt-2 px-1 font-mono text-[11px] tracking-[1px] text-[#888]">
          {media.caption}
        </figcaption>
      )}
    </figure>
  );
}

export default function ProjectDetails({ project }: Props) {
  const maxWidth = project.mediaGroups.some((group) => group.layout !== "stack")
    ? "max-w-[900px]"
    : "max-w-[720px]";

  return (
    <article
      id={project.id}
      aria-labelledby={`${project.id}-title`}
      className={`mx-auto ${maxWidth}`}
    >
      <header className="mx-auto mb-10 max-w-[720px] text-center">
        <h3
          id={`${project.id}-title`}
          className="mb-2 text-[clamp(36px,5vw,60px)] font-light tracking-[0.02em]"
        >
          {project.name}
        </h3>
        <p className="font-mono text-sm tracking-[1px] text-[#888]">
          {project.subtitle}
        </p>
        {project.description.length > 0 && (
          <div className="mx-auto mt-8 flex max-w-[620px] flex-col gap-5 text-left text-[18px] leading-[1.65]">
            {project.description.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}
      </header>

      {project.mediaGroups.map((group, groupIndex) => (
        <section
          key={`${project.id}-${group.layout}-${groupIndex}`}
          className={groupIndex > 0 ? (group.title ? "mt-20" : "mt-[18px]") : ""}
        >
          {(group.title || group.link) && (
            <div className="mb-5 flex items-baseline justify-between gap-5">
              {group.title && (
                <h4 className="font-mono text-[13px] tracking-[2px] text-[#777]">
                  {group.title}
                </h4>
              )}
              {group.link && (
                <a
                  href={group.link.href}
                  target={group.link.newTab ? "_blank" : undefined}
                  rel={group.link.newTab ? "noopener noreferrer" : undefined}
                  className="shrink-0 font-mono text-[12px] tracking-[1px] underline underline-offset-4"
                >
                  {group.link.label}
                </a>
              )}
            </div>
          )}
          <div className={GROUP_CLASSES[group.layout]}>
            {group.items.map((media, mediaIndex) => (
              <ProjectMediaItem
                key={
                  media.type === "image"
                    ? media.src
                    : `${media.label}-${mediaIndex}`
                }
                media={media}
              />
            ))}
          </div>
        </section>
      ))}
    </article>
  );
}
