/** The fake `@opentui/core` for `_screen-path.test.mjs`: the classes, and a renderer to replay keys into. */
class FakeNode {
  constructor(_renderer, options = {}) {
    this.options = options;
    this.children = [];
    this.content = options.content ?? "";
    this.destroyed = false;
  }

  add(child) {
    this.children.push(child);
  }

  remove(child) {
    this.children = this.children.filter((entry) => entry !== child);
  }

  getChildren() {
    return this.children;
  }

  destroyRecursively() {
    this.destroyed = true;
  }

  get text() {
    return `${this.content}${this.children.map((child) => child.text ?? "").join(" ")}`;
  }
}

export const BoxRenderable = FakeNode;
export const TextRenderable = FakeNode;
export const TextAttributes = { BOLD: 1 };

export const createCliRenderer = async () => {
  const keys = [];
  const renderer = {
    root: new FakeNode({}),
    terminalWidth: 100,
    terminalHeight: 40,
    keyInput: { on: (_event, handler) => keys.push(handler) },
    destroy() {
      renderer.destroyed = true;
    },
    press: (key) => {
      for (const handler of keys) {
        handler(key);
      }
    },
  };

  Reflect.set(globalThis, "__fakeRenderer", renderer);

  return renderer;
};
