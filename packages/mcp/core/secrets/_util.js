/**
@module core/secrets/util

The one line a hook message can carry out of a failed spawn.

A child process that fails says so in three places: a `code` for the OS-level
failure, a `status` for the exit, and a `stderr` that is usually the only one
written by a person. `stderr` wins when it has something in it, because
"Cannot find module" is a reason and "Command failed" is a shrug.
*/

/**
The first non-empty line of a possibly multi-line value.

@param {unknown} value
@returns {string}
*/
export function firstLine(value = "") {
  return (
    String(value)
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line !== "") ?? ""
  );
}
