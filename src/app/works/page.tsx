import PortfolioHeader from "../home/PortfolioHeader";

export default function WorksPage() {
  return (
    <main className="flex min-h-svh flex-col bg-white">
      <PortfolioHeader active="works" />
      <section className="flex flex-1 items-center justify-center px-6 py-24" aria-label="Works">
        <h2 className="text-center text-3xl font-light tracking-tight sm:text-4xl">Coming soon</h2>
      </section>
    </main>
  );
}
