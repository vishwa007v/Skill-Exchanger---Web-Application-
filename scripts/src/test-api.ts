import app from "../../artifacts/api-server/src/app";
import http from "node:http";

async function runTests() {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://localhost:${port}/api`;

  console.log(`Test server running at ${baseUrl}`);

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  const testLearnerId = `test-learner-${Date.now()}`;
  const testTeacherId = `test-teacher-${Date.now()}`;

  try {
    // 1. Health check
    await test("GET /healthz", async () => {
      const res = await fetch(`${baseUrl}/healthz`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status !== "ok") throw new Error(`Unexpected status: ${data.status}`);
    });

    // 2. List courses
    let courseList: any[] = [];
    await test("GET /courses", async () => {
      const res = await fetch(`${baseUrl}/courses`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      courseList = await res.json();
      if (!Array.isArray(courseList) || courseList.length === 0) {
        throw new Error("Expected non-empty array of courses");
      }
    });

    // 3. Search and Sort
    await test("GET /courses?search=coding", async () => {
      const res = await fetch(`${baseUrl}/courses?search=coding`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.some((c: any) => c.title.includes("Creative Coding"))) {
        throw new Error("Search did not match expected course");
      }
    });

    // 4. Get specific course
    const targetCourse = courseList[0];
    await test(`GET /courses/${targetCourse.id}`, async () => {
      const res = await fetch(`${baseUrl}/courses/${targetCourse.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.id !== targetCourse.id) throw new Error("Course ID mismatch");
    });

    // 5. Get course progress initially
    await test(`GET /courses/${targetCourse.id}/progress (initial)`, async () => {
      const res = await fetch(`${baseUrl}/courses/${targetCourse.id}/progress`, {
        headers: { "x-user-id": testLearnerId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.completed !== false) throw new Error("Expected completed=false initially");
    });

    // 6. Gated rating - should fail before completion
    await test("POST rating before completion rejects with 403", async () => {
      const res = await fetch(`${baseUrl}/courses/${targetCourse.id}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": testLearnerId,
        },
        body: JSON.stringify({ rating: 5 }),
      });
      if (res.status !== 403) {
        throw new Error(`Expected 403 Forbidden, got ${res.status}`);
      }
    });

    // 7. Complete course
    await test("POST /courses/:id/complete", async () => {
      const res = await fetch(`${baseUrl}/courses/${targetCourse.id}/complete`, {
        method: "POST",
        headers: { "x-user-id": testLearnerId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.completed) throw new Error("Expected completed=true");
    });

    // 8. Progress after completion
    await test("GET progress shows completed=true", async () => {
      const res = await fetch(`${baseUrl}/courses/${targetCourse.id}/progress`, {
        headers: { "x-user-id": testLearnerId },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.completed !== true) throw new Error("Expected completed=true");
    });

    // 9. Rate course after completion - should succeed
    await test("POST rating after completion succeeds", async () => {
      const res = await fetch(`${baseUrl}/courses/${targetCourse.id}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": testLearnerId,
        },
        body: JSON.stringify({ rating: 5 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (typeof data.rating !== "number") throw new Error("Expected updated rating");
    });

    // 10. Quiz Verification
    const quizBlock = targetCourse.contents.find((b: any) => b.type === "quiz");
    if (quizBlock) {
      await test("POST /courses/:id/quiz/:blockId/verify", async () => {
        const res = await fetch(`${baseUrl}/courses/${targetCourse.id}/quiz/${quizBlock.id}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: [0, 0] }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (typeof data.score !== "number" || typeof data.passed !== "boolean") {
          throw new Error("Invalid quiz verification response");
        }
      });
    }

    // 11. Create new course
    let createdCourseId = "";
    await test("POST /courses (create course)", async () => {
      const newCoursePayload = {
        title: "Test Automation with TypeScript",
        description: "Learn end-to-end testing and integration workflows.",
        category: "Code & design",
        level: "intermediate",
        instructor: "Senior Architect",
        contents: [
          {
            id: "b-1",
            type: "video",
            title: "Intro to integration tests",
            description: "How to run test suites.",
            duration: 15,
            source: "https://www.youtube.com/embed/aqz-KE-bpKQ",
            questions: [],
          },
          {
            id: "b-2",
            type: "quiz",
            title: "Testing check",
            description: "Verify knowledge.",
            duration: 5,
            source: null,
            questions: [
              {
                prompt: "What is an assertion?",
                options: ["A check", "A loop", "A string"],
                answer: 0,
              },
            ],
          },
        ],
      };

      const res = await fetch(`${baseUrl}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "test-teacher-1",
          "x-user-role": "teacher",
        },
        body: JSON.stringify(newCoursePayload),
      });

      if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
      const data = await res.json();
      if (!data.id || data.title !== newCoursePayload.title) {
        throw new Error("Failed to create course properly");
      }
      createdCourseId = data.id;
    });

    // 12. Verify newly created course exists in catalog
    await test("Newly created course is searchable", async () => {
      const res = await fetch(`${baseUrl}/courses?search=Automation`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.some((c: any) => c.id === createdCourseId)) {
        throw new Error("Created course not found in catalog");
      }
    });

    // 13. Teacher summary
    await test("GET /teacher/summary", async () => {
      const res = await fetch(`${baseUrl}/teacher/summary`, {
        headers: { "x-user-id": "test-teacher-1" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (typeof data.publishedCount !== "number" || typeof data.totalLearners !== "number") {
        throw new Error("Invalid teacher summary response");
      }
    });
  } finally {
    server.close();
  }

  console.log(`\nTest results: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
