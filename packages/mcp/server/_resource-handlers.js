/**
@module server/resource-handlers - the resources/list and resources/read handlers
 *
 * The listing is compressed at the boundary: its labels are prose the model reads
 * to discover a resource, and the every-surface rule applies to them too.
 */

import { ErrorCode, ListResourcesRequestSchema, McpError, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { compressResourceListing, listResources, readResource } from "../resources/index.js";

/** Register the resource handlers on the server. */
export function registerResourceHandlers(server) {
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    // Labels are prose the model reads to discover a resource; the pass is a
    // no-op on the terse real set but keeps the every-surface invariant (2c).
    return { resources: compressResourceListing(listResources()) };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    if (!uri) {
      throw new McpError(ErrorCode.InvalidParams, "Resource URI is required");
    }

    return readResource(uri);
  });
}
