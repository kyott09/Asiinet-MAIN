import test from "node:test";
import assert from "node:assert/strict";

import { formatUserDate } from "./user.service.js";

test("formatUserDate normalizes valid date values", () => {
  assert.equal(formatUserDate(new Date(2024, 4, 20)), "2024-05-20");
  assert.equal(formatUserDate("2024-05-20"), "2024-05-20");
  assert.equal(formatUserDate(""), null);
  assert.equal(formatUserDate(null), null);
  assert.equal(formatUserDate(undefined), null);
});
