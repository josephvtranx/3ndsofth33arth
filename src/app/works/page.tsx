import Link from "next/link";
import ProjectDetails from "@/components/ProjectDetails";
import { PROJECTS } from "@/lib/projects";
import PortfolioHeader from "../home/PortfolioHeader";

export default function WorksPage() {
  return <main className="min-h-screen bg-white">
    <PortfolioHeader />
    <nav aria-label="Select a work" className="flex flex-wrap justify-center gap-8 px-6 py-12">
      {PROJECTS.map(project => <a key={project.id} href={`#${project.id}`} className="underline underline-offset-4">{project.name}</a>)}
    </nav>
    <div className="space-y-32 px-6 pb-24">
      {PROJECTS.map(project => <ProjectDetails key={project.id} project={project} />)}
    </div>
    <footer className="p-12 text-center"><Link href="/home">Back to home</Link></footer>
  </main>;
}
