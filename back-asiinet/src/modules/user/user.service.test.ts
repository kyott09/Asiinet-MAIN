import test from "node:test";
import assert from "node:assert/strict";

import { formatUserDate, parseDateOnlyToDate } from "./user.service.js";

test("formatUserDate normalizes valid date values", () => {
  assert.equal(formatUserDate(new Date(2024, 4, 20)), "2024-05-20");
  assert.equal(formatUserDate("2024-05-20"), "2024-05-20");
  assert.equal(formatUserDate(""), null);
  assert.equal(formatUserDate(null), null);
  assert.equal(formatUserDate(undefined), null);
});

test("parseDateOnlyToDate preserves the chosen calendar day without timezone drift", () => {
  const parsed = parseDateOnlyToDate("2024-05-20");
  assert.ok(parsed);
  assert.equal(parsed.getFullYear(), 2024);
  assert.equal(parsed.getMonth(), 4);
  assert.equal(parsed.getDate(), 20);
  assert.equal(formatUserDate(parsed), "2024-05-20");
});
