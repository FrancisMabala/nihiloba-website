// Unit tests must mock network access, even when asserting canonical URL strings.
// Installed directly (not vi.spyOn) so restoreAllMocks cannot restore real sockets.
import { Socket } from "node:net";

globalThis.fetch = async () => {
  throw new Error("Real fetch is disabled in unit tests; install an explicit mock.");
};
Socket.prototype.connect = function () {
  throw new Error("Real sockets are disabled in unit tests.");
};
