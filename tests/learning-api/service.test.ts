/**
 * D3 — learning service layer, exercised directly: computeDuration,
 * create/get/update/delete round-trip, and unknown-id handling.
 */

import { afterAll, describe, expect, test } from "bun:test";
import {
  computeDuration,
  createCourse as createCourseDirect,
  deleteCourse as deleteCourseDirect,
  getCertificate as getCertificateDirect,
  getCourse as getCourseDirect,
  updateCourse as updateCourseDirect,
} from "@/lib/services/learning";
import { cleanupAll, MISSING_ID, RUN_ID, trackCourse } from "./helpers";

afterAll(cleanupAll);

describe("learning service layer", () => {
  test("computeDuration sums lesson durations", () => {
    expect(
      computeDuration([
        {
          id: "m1",
          title: "M",
          lessons: [
            { id: "l1", title: "a", duration: "1h", type: "video" },
            { id: "l2", title: "b", duration: "15m", type: "quiz" },
          ],
        },
      ]),
    ).toBe("1h 15m");
    expect(computeDuration([])).toBe("");
    expect(computeDuration(undefined)).toBe("");
  });

  test("course create/get/update/delete round-trip", async () => {
    const created = await createCourseDirect(
      {
        title: `d3-course-svc-${RUN_ID}`,
        description: "A service-layer course created by the D3 integration suite.",
        category: `D3 Category ${RUN_ID}`,
        level: "Intermediate",
      },
      "system:d3-test",
    );
    trackCourse(created.id);

    expect(created.level).toBe("Intermediate");
    expect(created.students).toBe(0);
    expect(created.progress).toBe(0);
    // No modules provided → no derived duration.
    expect(created.duration).toBe("");

    const fetched = await getCourseDirect(created.id);
    expect(fetched?.title).toBe(created.title);

    const updated = await updateCourseDirect(created.id, { students: 5 }, "system:d3-test");
    expect(updated.students).toBe(5);

    expect(await deleteCourseDirect(created.id)).toBe(true);
    expect(await deleteCourseDirect(created.id)).toBe(false);
    expect(await getCourseDirect(created.id)).toBeNull();
  });

  test("unknown ids surface as null, not throws", async () => {
    expect(await getCourseDirect(MISSING_ID)).toBeNull();
    expect(await getCertificateDirect(MISSING_ID)).toBeNull();
  });
});
