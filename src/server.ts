/**
 * Server entry point implementing the Facade pattern.
 *
 * This module serves as a lightweight facade over the server implementation,
 * providing a clean and simple interface to start the server. The Facade pattern
 * is used here to:
 *
 * 1. Hide Complexity: The actual server implementation (middleware setup, error handling,
 *    route configuration, etc.) is abstracted away in the main.ts module.
 *
 * 2. Provide a Clean Interface: This module exposes only what's necessary to start
 *    the server, making it easier to understand and use.
 *
 * 3. Improve Maintainability: Changes to the server implementation can be made
 *    without affecting the entry point, following the Single Responsibility Principle.
 *
 * 4. Better Testing: The facade makes it easier to mock the server for testing
 *    other parts of the application.
 *
 * 5. Separation of Concerns: The entry point is focused solely on starting the server,
 *    while the implementation details are handled elsewhere.
 *
 * @example
 * ```ts
 * // Start the server with default configuration
 * await startServer();
 *
 * // Start the server with custom configuration
 * await startServer({ port: 3000, hostname: 'localhost' });
 * ```
 */

import { startServer } from "@src/api/main.ts";

/**
 * Augments the global `ImportMeta` interface to include a `main` property.
 * This is a custom property, non standard for Deno.
 * This is used to identify if the current module is the main entry point.
 */
declare global {
  interface ImportMeta {
    /**
     * Indicates if the current module is the main entry point of the application.
     */
    main: boolean;
  }
}

/**
 * Entry point for the server application when run directly.
 *
 * This code block is executed only when the script is run as the main module,
 * not when it's imported by another module. It sets up the server's configuration
 * and starts the server.
 */
if (import.meta.main) {
  await startServer();
}
