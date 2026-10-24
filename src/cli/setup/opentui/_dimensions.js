/** @module cli/setup/opentui/dimensions - the per-dimension checklist */

/**
 * Show every installable dimension with the sentence that explains what it
 * writes. Space toggles, Enter confirms, q cancels.
 *
 * @param {{ dimensions: string[], details: Record<string,string>, selected?: string[] }} options
 * @returns {Promise<string[]|null>} the chosen dimensions, or null on cancel
 */
export async function pickDimensions({ dimensions, details, selected = [] }) {
  const { BoxRenderable, TextRenderable, createCliRenderer } = await import("@opentui/core");
  const renderer = await createCliRenderer({ exitOnCtrlC: true });
  const chosen = new Set(selected);
  let index = 0;

  return new Promise((resolve) => {
    const box = new BoxRenderable(renderer, { flexDirection: "column", gap: 1, padding: 1 });
    const heading = new TextRenderable(renderer, { content: "What should this install write?", fg: "#DCE3FF" });
    const rows = dimensions.map(() => new TextRenderable(renderer, { content: "", fg: "#AEBBFF" }));

    box.add(heading);
    for (const row of rows) box.add(row);
    renderer.root.add(box);

    const paint = () => {
      dimensions.forEach((dimension, i) => {
        const mark = chosen.has(dimension) ? "[x]" : "[ ]";
        const cursor = i === index ? ">" : " ";
        rows[i].content = `${cursor} ${mark} ${dimension}: ${details[dimension] ?? ""}`;
        rows[i].fg = i === index ? "#FFFFFF" : "#AEBBFF";
      });
    };

    paint();

    renderer.keyInput.on("keypress", (key) => {
      if (key.name === "q" || key.name === "escape") {
        renderer.destroy();
        resolve(null);
        return;
      }

      if (key.name === "up") index = (index + dimensions.length - 1) % dimensions.length;
      else if (key.name === "down") index = (index + 1) % dimensions.length;
      else if (key.name === "space") {
        const dimension = dimensions[index];
        if (chosen.has(dimension)) chosen.delete(dimension);
        else chosen.add(dimension);
      } else if (key.name === "return") {
        renderer.destroy();
        resolve([...chosen]);
        return;
      } else return;

      paint();
    });
  });
}
