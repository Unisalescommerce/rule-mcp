/**
 * @module cli/setup/opentui
 *
 * The wizard's terminal layer: the screen, the two flows, and the data they draw.
 *
 * A barrel rather than deep imports, because the OpenTUI renderer is the one part
 * of the setup path that can be absent at runtime - it needs a native artifact -
 * and a caller that reaches into `_wizard.js` directly binds itself to a module
 * the next split will move.
 */

export * from "./_answers.js";
export * from "./_clipboard.js";
export * from "./_items.js";
export * from "./_list.js";
export * from "./_screen.js";
export * from "./_wizard.js";
