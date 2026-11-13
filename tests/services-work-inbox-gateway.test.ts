import {expect, it} from "vitest";
import {transactionPath, transactionQuery, transactionSearch} from "../app/lib/services-transaction-contract";

it("accepts paginated provider inbox reads and retains the provider scope", () => {
  const parts = ["transactions", "messages"];
  expect(transactionPath(parts, "GET")).toBe("service-messages");
  for (const offset of ["0", "100"]) {
    const query = new URLSearchParams({offset});
    expect(transactionQuery(parts, query, "GET")).toBe(true);
    expect(transactionSearch(parts, query).get("provider")).toBe("true");
  }
  for (const invalid of ["offset=-1", "offset=1&offset=2", "provider=false", "organization_ref=BUS_other"]) {
    expect(transactionQuery(parts, new URLSearchParams(invalid), "GET")).toBe(false);
  }
});
