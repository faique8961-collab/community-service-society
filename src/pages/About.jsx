import SectionHeading from "../components/SectionHeading.jsx";

export default function About() {
  return <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
    <SectionHeading eyebrow="About the society" title="A community shaped by service." description="This page will tell the society's story, explain its mission and introduce the people who lead its work." />
    <div className="mt-14 grid gap-12 border-t border-[#dedfd7] pt-10 md:grid-cols-2">
      <div><h2 className="display-font text-3xl text-[#183d32]">Our mission</h2><p className="mt-4 leading-8 text-[#68716b]">Add the society's officially approved mission statement here.</p></div>
      <div><h2 className="display-font text-3xl text-[#183d32]">Our history</h2><p className="mt-4 leading-8 text-[#68716b]">Add the society's founding story, milestones and university affiliation here.</p></div>
    </div>
  </div>;
}