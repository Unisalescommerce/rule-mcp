#!/usr/bin/env node

/**
 * @module bin/rule-mcp
 *
 * CLI entry point for rule-mcp.
 * Delegates to the cli() function in src/index.js.
 *
 * Usage: rule-mcp [command] [options]
 *   See `rule-mcp help` for full usage.
 */

import { cli } from "../src/index.js";

cli();
