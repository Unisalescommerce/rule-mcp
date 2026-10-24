/** @module cli/setup/opentui/render - the OpenTUI profile picker */

/**
 * Draw the profile picker and resolve with the chosen profile.
 *
 * OpenTUI is imported here, not at module load: the test suite and the
 * non-interactive path must not pay for the native renderer.
 *
 * @param {{ profiles: Array<{ id: string, label: string, description: string }>, title?: string }} options
 * @returns {Promise<string|null>} the chosen id, or null on quit
 */
export async function pickProfile({ profiles, title = "Which installation profile?" }) {
  const { BoxRenderable, TextRenderable, createCliRenderer } = await import("@opentui/core");
  const renderer = await createCliRenderer({ exitOnCtrlC: true });
  let index = 0;

  return new Promise((resolve) => {
    const box = new BoxRenderable(renderer, { flexDirection: "column", gap: 1, padding: 1 });
    const heading = new TextRenderable(renderer, { content: title, fg: "#DCE3FF" });
    const rows = profiles.map((profile) => new TextRenderable(renderer, { content: `  ${profile.label} - ${profile.description}`, fg: "#AEBBFF" }));

    box.add(heading);
    for (const row of rows) box.add(row);
    renderer.root.add(box);

    const paint = () => {
      rows.forEach((row, i) => {
        row.content = `${i === index ? ">" : " "} ${profiles[i].label} - ${profiles[i].description}`;
        row.fg = i === index ? "#FFFFFF" : "#AEBBFF";
      });
    };

    paint();

    renderer.keyInput.on("keypress", (key) => {
      if (key.name === "q" || key.name === "escape") {
        renderer.destroy();
        resolve(null);
        return;
      }

      if (key.name === "up") index = (index + profiles.length - 1) % profiles.length;
      else if (key.name === "down") index = (index + 1) % profiles.length;
      else if (key.name === "return") {
        renderer.destroy();
        resolve(profiles[index].id);
        return;
      } else return;

      paint();
    });
  });
}
