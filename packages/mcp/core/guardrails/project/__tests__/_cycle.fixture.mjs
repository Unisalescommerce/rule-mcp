/** Source text for the cycle tests, built so this file holds no import specifier. */

/**
 * One file of a mutual import cycle.
 *
 * @param {string} name
 * @param {string} other
 * @returns {string}
 */
export const cyclicSource = (name, other) => `import { ${other} } from ".${`/${other}`}${".js"}";\nexport const ${name} = 1;\n`;
