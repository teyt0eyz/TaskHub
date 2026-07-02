// ตัว render markdown แบบเบาๆ (ไม่พึ่ง library) — รองรับหัวข้อ #/##/###, ตัวหนา **, รายการ -/1.
// พอสำหรับอ่านผลสรุป AI ให้ดูเป็นระเบียบคล้าย Notion

function renderInline(text, keyPrefix) {
  // แยกตัวหนา **...**
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-ink">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{p}</span>;
  });
}

export default function Markdown({ text = "", className = "" }) {
  const lines = String(text).replace(/\r/g, "").split("\n");
  const blocks = [];
  let list = null;
  let listType = null;

  const flush = () => {
    if (list) {
      blocks.push({ type: listType, items: list });
      list = null;
      listType = null;
    }
  };

  lines.forEach((raw) => {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flush();
      return;
    }
    let m;
    if ((m = line.match(/^(#{1,6})\s+(.*)/))) {
      flush();
      blocks.push({ type: "h", level: m[1].length, text: m[2] });
    } else if ((m = line.match(/^\s*[-*]\s+(.*)/))) {
      if (listType !== "ul") {
        flush();
        listType = "ul";
        list = [];
      }
      list.push(m[1]);
    } else if ((m = line.match(/^\s*\d+\.\s+(.*)/))) {
      if (listType !== "ol") {
        flush();
        listType = "ol";
        list = [];
      }
      list.push(m[1]);
    } else {
      flush();
      blocks.push({ type: "p", text: line });
    }
  });
  flush();

  return (
    <div className={`space-y-3 text-[15px] leading-7 text-ink-2 ${className}`}>
      {blocks.map((b, i) => {
        if (b.type === "h") {
          if (b.level <= 2) {
            return (
              <h3 key={i} className="mt-5 border-b border-line pb-1.5 text-lg font-bold text-ink first:mt-0">
                {renderInline(b.text, `h${i}`)}
              </h3>
            );
          }
          return (
            <h4 key={i} className="mt-3 text-base font-semibold text-ink">
              {renderInline(b.text, `h${i}`)}
            </h4>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={i} className="list-disc space-y-1.5 pl-5 marker:text-ink-3">
              {b.items.map((it, j) => (
                <li key={j}>{renderInline(it, `ul${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "ol") {
          return (
            <ol key={i} className="list-decimal space-y-1.5 pl-5 marker:text-ink-3">
              {b.items.map((it, j) => (
                <li key={j}>{renderInline(it, `ol${i}-${j}`)}</li>
              ))}
            </ol>
          );
        }
        return <p key={i}>{renderInline(b.text, `p${i}`)}</p>;
      })}
    </div>
  );
}
