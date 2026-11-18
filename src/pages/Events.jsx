import SectionHeading from "../components/SectionHeading.jsx";
import { events } from "../data/content.js";
import { CalendarDays, MapPin } from "lucide-react";

export default function Events() {
  return <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
    <SectionHeading eyebrow="What's happening" title="Events & activities" description="Find upcoming opportunities to participate and revisit the society's past activities." />
    <div className="mt-12 max-w-3xl divide-y divide-[#dedfd7] border-y border-[#dedfd7]">
      {events.map((event) => <article key={event.title} className="py-7"><h2 className="display-font text-2xl text-[#183d32]">{event.title}</h2><div className="mt-4 flex flex-wrap gap-5 text-sm text-[#68716b]"><span className="flex items-center gap-2"><CalendarDays size={16}/>{event.date}</span><span className="flex items-center gap-2"><MapPin size={16}/>{event.location}</span></div></article>)}
    </div>
  </div>;
}