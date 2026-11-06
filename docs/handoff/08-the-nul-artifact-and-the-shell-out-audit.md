# Session handoff 08 - The `nul` artifact, and the audit of the surface that produced it

- Branch: `main`
- Covers: `38e5e904..e50f011c`
- Date: 2026-09-15
- Documents: `docs/audits/security.md` (security v2), `docs/reviews/security.md`, `docs/plans/security.md`

## What happened

**artifact.** 31-byte file named `nul` appeared in repository root after every full
test run, containing `/bin/sh: sc: command not found`. Root cause: `tryExec('sc query "..." 2>nul
|| echo NOT_FOUND')` in `src/cli/daemon/_windows-service.js` is cmd syntax, so on a host whose
shell is not cmd redirect opens real file. It had been deleted once already, in `bb00a3b0`,
and came back on next run.

Two measurements narrowed culprit. First, redirect is redundant: `tryExec` runs with
`stdio: "pipe"`, which discards stderr already (measured: `echo OUT; echo ERR 1>&2` under that
option captures `OUT` only). Dropping it from all five `sc` probes keeps Windows behavior
identical and stops artifact, without adding branch only one platform can take - earlier
try using per-platform null sink pushed branch coverage to 90.97 percent against floor
of 91, so that approach was replaced. Second, file was not written by platform fixture:
when `_platform-arms.fixture.mjs` fakes `process.platform = "win32"`, node picks `ComSpec` as the
shell, which does not exist here, so no shell runs and no file appears. `_windows-service-arms.test.mjs`,
which calls same arms with real platform, is one that wrote it.

regression test runs arms in child process whose working directory is scratch
directory and asserts that directory stays empty. It failed on old code with `['nul']`.

**audit.** `nul` finding was symptom of surface nobody had looked at as whole, so
the security persona audited it: 55 `tryExec` call sites, the single `shell: true` site, the
command strings three platform adapters build, two files they generate and later execute,
and shim that runs whatever PATH resolves. Eight findings are open in
`docs/reviews/security.md`, with steps in `docs/plans/security.md`, worst first. headline
measurements, all reproduced in `docs/audits/security.md`:

- value holding `$(...)` executes through `chmod` template (`_launchd.js`), and through the
  generated macOS wrapper, where escaper is XML escaper;
- every value in surface is module constant, `homedir()` path or install path, so no
  request, repository file or agent argument reaches command string - prerequisite is
  control of HOME or of install tree;
- PowerShell fallback is only shell that parses interpolated string;
- failing command returns `error.message`, which carries command line and stderr into the
  tool result;
- `shimWorks()` ran planted binary from PATH and reported success;
- `tryExec` maps every failure, including 1 MiB output cap, to empty string;
- two measured quoting defects: Windows `binPath` double-quotes already quoted line, and the
  systemd `ExecStart` leaves unbalanced quotes for argument holding quote.

## Measured, and not fixed here

`pnpm test:coverage` reports 90.97, 90.97, 91.03 and 90.99 percent branches against floor of 91
on unchanged tree, with covered and total counts both moving between runs (for example
7713/8475 passing, 7714/8479 failing). floor sits inside run-to-run noise band, so the
gate can flip without code change. It is not caused by `nul` fix: same measurements were
taken with those edits stashed. Recorded in audit as out-of-scope observation and in commit
`38e5e904`; raising floor or stabilizing measurement is its own change.

## Gates

| Gate                                                         | Result                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `pnpm test:all`                                              | 1735 pass, 0 fail, 3 skipped (one more than before: the regression test) |
| `pnpm lint`                                                  | 0 errors, 36 warnings                                                    |
| `pnpm format`                                                | clean                                                                    |
| `pnpm census:check`                                          | census is current                                                        |
| `tests/docs/*`                                               | 58 pass                                                                  |
| `pnpm test:coverage`                                         | red at 90.99 percent branches, floor 91 (see above)                      |
| `nul` after a full run                                       | no such file                                                             |
| `rule_tool_check rule-styleguide-english` on the audit prose | 59 of 59 pass                                                            |

## Open items

- eight findings in `docs/plans/security.md`, worst first: SEC-1 shell interpolation, SEC-2 XML
  escaping in shell context, SEC-3 `shell: true` fallback, SEC-4 error message, SEC-5 the
  shim check, SEC-8 two quoting defects, SEC-6 empty-string failure, SEC-7 duplicated
  surface.
- coverage gate above.
- `docs/plans/oss.md` still carries unmarked steps whose code has landed (handoff 07 lists which).

## Commits

| Commit     | Subject                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| `38e5e904` | fix(daemon): stop the Windows service probe writing a file named nul    |
| `e50f011c` | docs(security): audit the shell-out surface of the daemon service layer |

## Convention reminder

Every commit is `type(scope): subject` plus DCO `Signed-off-by` trailer. `commit-msg` hook
rejects scope-less message.
