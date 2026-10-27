import { Router, type IRouter } from "express";
import {
  CompleteCourseParams,
  CreateCourseBody,
  GetCourseParams,
  ListCoursesQueryParams,
  RateCourseBody,
  RateCourseParams,
} from "@workspace/api-zod";
import { storage } from "../db/storage";
import { resolveUser } from "../middlewares/auth";

const router: IRouter = Router();

// Apply user resolution to all course routes
router.use(resolveUser);

/**
 * GET /courses
 * Returns published courses ordered by rating or newest, with optional search.
 */
router.get("/courses", async (req, res, next) => {
  try {
    const query = ListCoursesQueryParams.parse(req.query);
    const result = await storage.listCourses({
      search: query.search,
      sort: query.sort as "rating" | "newest",
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /courses
 * Creates and publishes a new course.
 */
router.post("/courses", async (req, res, next) => {
  try {
    const input = CreateCourseBody.parse(req.body);
    const teacher = {
      id: req.user?.id || "demo-teacher-1",
      name: input.instructor || req.user?.fullName || "Studio Instructor",
    };

    const course = await storage.createCourse(input, teacher);
    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /courses/:courseId/progress
 * Retrieves the current learner's completion and rating status for a course.
 */
router.get("/courses/:courseId/progress", async (req, res, next) => {
  try {
    const { courseId } = GetCourseParams.parse(req.params);
    const userId = req.user?.id || "demo-learner-1";
    const progress = await storage.getCourseProgress(courseId, userId);
    res.json(progress);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /courses/:courseId
 * Retrieves detailed course data including curriculum blocks.
 */
router.get("/courses/:courseId", async (req, res, next) => {
  try {
    const { courseId } = GetCourseParams.parse(req.params);
    const course = await storage.getCourseById(courseId);
    if (!course) {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    res.json(course);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /courses/:courseId/complete
 * Marks a course as complete for the authenticated learner.
 */
router.post("/courses/:courseId/complete", async (req, res, next) => {
  try {
    const { courseId } = CompleteCourseParams.parse(req.params);
    const userId = req.user?.id || "demo-learner-1";
    const result = await storage.completeCourse(courseId, userId);
    res.json(result);
  } catch (error: any) {
    if (error.message === "Course not found") {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    next(error);
  }
});

/**
 * POST /courses/:courseId/rating
 * Rates a completed course (1-5 stars).
 */
router.post("/courses/:courseId/rating", async (req, res, next) => {
  try {
    const { courseId } = RateCourseParams.parse(req.params);
    const { rating } = RateCourseBody.parse(req.body);
    const userId = req.user?.id || "demo-learner-1";

    const updatedCourse = await storage.rateCourse(courseId, userId, rating);
    res.json(updatedCourse);
  } catch (error: any) {
    if (error.message === "Course not found") {
      res.status(404).json({ error: "Course not found" });
      return;
    }
    if (error.message === "Complete the course before rating it") {
      res.status(403).json({ error: "Complete the course before rating it" });
      return;
    }
    next(error);
  }
});

/**
 * POST /courses/:courseId/quiz/:blockId/verify
 * Server-side validation of quiz submissions.
 */
router.post("/courses/:courseId/quiz/:blockId/verify", async (req, res, next) => {
  try {
    const { courseId, blockId } = req.params;
    const submittedAnswers: number[] = Array.isArray(req.body.answers)
      ? req.body.answers
      : [];
    const result = await storage.verifyQuiz(courseId, blockId, submittedAnswers);
    res.json(result);
  } catch (error: any) {
    if (error.message === "Course not found" || error.message === "Quiz block not found") {
      res.status(404).json({ error: error.message });
      return;
    }
    next(error);
  }
});

/**
 * GET /teacher/summary
 * Returns teacher workspace metrics and recent courses.
 */
router.get("/teacher/summary", async (req, res, next) => {
  try {
    const teacherId = req.user?.id;
    const summary = await storage.getTeacherSummary(teacherId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

export default router;
