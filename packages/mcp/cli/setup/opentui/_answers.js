/**
 * @module cli/setup/opentui/answers
 *
 * The two answers that are not a value: the user quit, or asked to go back.
 *
 * Symbols rather than null or false, because every value a step can return has
 * to stay expressible - an empty list is a real answer ("write nothing"), and
 * a step that returned null for it could not be told apart from a cancel.
 */

/** The user quit the wizard. */
export const CANCEL = Symbol("cancel");

/** The user asked for the previous step. */
export const BACK = Symbol("back");
