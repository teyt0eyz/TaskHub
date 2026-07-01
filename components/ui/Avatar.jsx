export default function Avatar({ person, size = 30, ring = false }) {
  const dim = `${size}px`;
  return (
    <div
      title={person.name}
      style={{
        width: dim,
        height: dim,
        background: person.bg,
        color: person.color,
        fontSize: size <= 26 ? "10px" : "11px",
        border: ring ? "2px solid #fff" : "none",
      }}
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
    >
      {person.initials}
    </div>
  );
}
