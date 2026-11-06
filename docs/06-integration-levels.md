# Integration levels

An install has two axes. The profile sets how much of the catalog is available: `minimal`, `standard`, `full`, or `custom`. The level sets how deep one host goes.

Use `install --agent <id> --level <Lx>` to set the level. If the level is above the ceiling of the host, the install refuses and gives the reason.

| Level | Writes                               | Needs                           |
| ----- | ------------------------------------ | ------------------------------- |
| `L0`  | The MCP entry                        | A documented configuration file |
| `L1`  | `L0` and the instruction block       | A documented instructions file  |
| `L2`  | `L1` and the `/rule-*` command files | A documented command directory  |
| `L3`  | `L2` and the guard hooks             | A documented hook file          |
| `L4`  | `L3` and a native handler            | A documented handler API        |

A host installs each level that it supports, up to the level that you ask for. The install skips a level that the host does not support and gives the reason. For example, Kiro has a hook file but no command files.

[Install targets](./22-install-targets.md) gives the ceiling of each host. `rule-mcp doctor` prints the state, for example `L2 of L3, next L3`.

## Hosts with special behavior

Seven products have no documented MCP config file: `aider`, `amp`, `continue`, `goose`, `junie`, `openhands`, `trae`. `install --agent aider` writes nothing and tells you so.

`cursor-cli` is covered by `cursor`, because the CLI reads the configuration file of the editor.

The `jetbrains` host writes the Junie file `~/.junie/mcp/mcp.json`. It does not write `.idea/mcp.json`.
