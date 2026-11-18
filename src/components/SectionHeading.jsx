export default function SectionHeading({ eyebrow, title, description, light = false }) {
  return (
    <div className="max-w-2xl">
      {eyebrow && <p className={`mb-3 text-xs font-bold uppercase tracking-[0.22em] ${light ? "text-[#d5a65a]" : "text-[#668574]"}`}>{eyebrow}</p>}
      <h2 className={`display-font text-4xl leading-tight tracking-tight sm:text-5xl ${light ? "text-white" : "text-[#183d32]"}`}>{title}</h2>
      {description && <p className={`mt-4 max-w-xl text-base leading-7 ${light ? "text-white/70" : "text-[#68716b]"}`}>{description}</p>}
    </div>
  );
}