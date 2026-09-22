import { Router, type IRouter } from "express";
import {
  CompleteCourseParams,
  CreateCourseBody,
  GetCourseParams,
  ListCoursesQueryParams,
  RateCourseBody,
  RateCourseParams,
} from "@workspace/api-zod";

type ContentBlock = {
  id: string;
  type: "video" | "presentation" | "quiz";
  title: string;
  description: string;
  duration: number;
  source: string | null;
  questions: { prompt: string; options: string[]; answer: number }[];
};

type Course = {
  id: string;
  title: string;
  description: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  instructor: string;
  instructorInitials: string;
  rating: number;
  ratingCount: number;
  duration: number;
  students: number;
  accent: string;
  contents: ContentBlock[];
  createdAt: string;
};

const accents = ["coral", "lavender", "mint", "blue", "gold"];
const completions = new Set<string>();

const makeBlock = (
  id: string,
  type: ContentBlock["type"],
  title: string,
  description: string,
  duration: number,
  source: string | null = null,
  questions: ContentBlock["questions"] = [],
): ContentBlock => ({
  id,
  type,
  title,
  description,
  duration,
  source,
  questions,
});

const courses: Course[] = [
  {
    id: "course-creative-coding",
    title: "Creative Coding with JavaScript",
    description:
      "Make playful, interactive sketches while learning the fundamentals of JavaScript.",
    category: "Code & design",
    level: "beginner",
    instructor: "Maya Patel",
    instructorInitials: "MP",
    rating: 4.9,
    ratingCount: 128,
    duration: 94,
    students: 1842,
    accent: "coral",
    contents: [
      makeBlock(
        "cc-1",
        "video",
        "Your first interactive sketch",
        "Learn the building blocks of a sketch and make something move.",
        18,
        "https://www.youtube.com/embed/aqz-KE-bpKQ",
      ),
      makeBlock(
        "cc-2",
        "presentation",
        "Thinking in loops",
        "A visual guide to loops, conditions, and playful experimentation.",
        22,
      ),
      makeBlock(
        "cc-3",
        "quiz",
        "Check your foundations",
        "A quick confidence check before you build your own sketch.",
        8,
        null,
        [
          {
            prompt: "Which tool repeats a block of code?",
            options: ["A loop", "A variable", "A string"],
            answer: 0,
          },
        ],
      ),
    ],
    createdAt: "2026-09-15T09:00:00.000Z",
  },
  {
    id: "course-storytelling",
    title: "Storytelling for Presentations",
    description:
      "Turn a pile of ideas into a clear narrative your audience remembers.",
    category: "Communication",
    level: "intermediate",
    instructor: "Jon Bell",
    instructorInitials: "JB",
    rating: 4.8,
    ratingCount: 96,
    duration: 76,
    students: 1206,
    accent: "lavender",
    contents: [
      makeBlock(
        "st-1",
        "presentation",
        "The story spine",
        "A simple structure for making any presentation easier to follow.",
        26,
      ),
      makeBlock(
        "st-2",
        "video",
        "Make the opening matter",
        "Watch a live teardown of three different presentation openings.",
        24,
        "https://www.youtube.com/embed/ysz5S6PUM-U",
      ),
      makeBlock(
        "st-3",
        "quiz",
        "Narrative checkpoint",
        "Put the pieces of a strong opening in the right order.",
        7,
        null,
        [
          {
            prompt: "What earns attention first?",
            options: ["Context", "A clear tension", "A long agenda"],
            answer: 1,
          },
        ],
      ),
    ],
    createdAt: "2026-09-10T09:00:00.000Z",
  },
  {
    id: "course-watercolor",
    title: "Watercolor Landscapes",
    description:
      "Paint calm, atmospheric landscapes with a small palette and a loose hand.",
    category: "Art & craft",
    level: "beginner",
    instructor: "Elena Rossi",
    instructorInitials: "ER",
    rating: 4.7,
    ratingCount: 74,
    duration: 112,
    students: 894,
    accent: "mint",
    contents: [
      makeBlock(
        "wl-1",
        "video",
        "Light before detail",
        "Build a sense of depth before adding the final marks.",
        31,
        "https://www.youtube.com/embed/aqz-KE-bpKQ",
      ),
      makeBlock(
        "wl-2",
        "presentation",
        "A pocket palette",
        "Learn how four colors can create an entire horizon.",
        19,
      ),
    ],
    createdAt: "2026-09-06T09:00:00.000Z",
  },
  {
    id: "course-freelance",
    title: "Build a Freelance Practice",
    description:
      "Set up a repeatable client workflow that leaves room for better work.",
    category: "Business",
    level: "advanced",
    instructor: "Nikhil Shah",
    instructorInitials: "NS",
    rating: 4.6,
    ratingCount: 61,
    duration: 88,
    students: 642,
    accent: "blue",
    contents: [
      makeBlock(
        "fp-1",
        "presentation",
        "Choose a clear offer",
        "Position your work so the right clients can recognize it.",
        25,
      ),
      makeBlock(
        "fp-2",
        "video",
        "The client kickoff",
        "A practical walkthrough of a calm, confident kickoff call.",
        28,
        "https://www.youtube.com/embed/ysz5S6PUM-U",
      ),
    ],
    createdAt: "2026-08-28T09:00:00.000Z",
  },
  {
    id: "course-home-cooking",
    title: "Weeknight Cooking, Uncomplicated",
    description:
      "Build a flexible set of techniques for making good food on busy days.",
    category: "Food & home",
    level: "beginner",
    instructor: "Ari Kim",
    instructorInitials: "AK",
    rating: 4.5,
    ratingCount: 49,
    duration: 68,
    students: 518,
    accent: "gold",
    contents: [
      makeBlock(
        "hc-1",
        "video",
        "Your three-pan system",
        "A rhythm for cooking vegetables, grains, and a main together.",
        20,
        "https://www.youtube.com/embed/aqz-KE-bpKQ",
      ),
      makeBlock(
        "hc-2",
        "quiz",
        "Kitchen confidence check",
        "Choose the next move in a few common weeknight situations.",
        6,
        null,
        [
          {
            prompt: "What should you do before tasting for seasoning?",
            options: ["Turn off the heat", "Add sugar", "Serve immediately"],
            answer: 0,
          },
        ],
      ),
    ],
    createdAt: "2026-08-20T09:00:00.000Z",
  },
];

const router: IRouter = Router();

router.get("/courses", (req, res) => {
  const query = ListCoursesQueryParams.parse(req.query);
  const normalizedSearch = query.search?.trim().toLowerCase();
  const result = courses
    .filter((course) => {
      if (!normalizedSearch) return true;
      return [course.title, course.description, course.category, course.instructor]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    })
    .sort((a, b) => {
      if (query.sort === "newest") return b.createdAt.localeCompare(a.createdAt);
      return b.rating - a.rating || b.ratingCount - a.ratingCount;
    });

  res.json(result);
});

router.post("/courses", (req, res) => {
  const input = CreateCourseBody.parse(req.body);
  const instructorInitials = input.instructor
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const course: Course = {
    id: `course-${Date.now()}`,
    ...input,
    instructorInitials,
    rating: 0,
    ratingCount: 0,
    duration: input.contents.reduce((total, item) => total + item.duration, 0),
    students: 0,
    accent: accents[courses.length % accents.length],
    createdAt: new Date().toISOString(),
  };
  courses.unshift(course);
  res.status(201).json(course);
});

router.get("/courses/:courseId", (req, res) => {
  const { courseId } = GetCourseParams.parse(req.params);
  const course = courses.find((item) => item.id === courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  res.json(course);
});

router.post("/courses/:courseId/complete", (req, res) => {
  const { courseId } = CompleteCourseParams.parse(req.params);
  const course = courses.find((item) => item.id === courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  completions.add(courseId);
  course.students += 1;
  res.json({ courseId, completed: true });
});

router.post("/courses/:courseId/rating", (req, res) => {
  const { courseId } = RateCourseParams.parse(req.params);
  const { rating } = RateCourseBody.parse(req.body);
  const course = courses.find((item) => item.id === courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }
  if (!completions.has(courseId)) {
    res.status(403).json({ error: "Complete the course before rating it" });
    return;
  }
  course.rating =
    course.ratingCount === 0
      ? rating
      : (course.rating * course.ratingCount + rating) / (course.ratingCount + 1);
  course.ratingCount += 1;
  res.json(course);
});

router.get("/teacher/summary", (_req, res) => {
  const totalLearners = courses.reduce((total, course) => total + course.students, 0);
  const ratedCourses = courses.filter((course) => course.ratingCount > 0);
  const averageRating =
    ratedCourses.length === 0
      ? 0
      : ratedCourses.reduce((total, course) => total + course.rating, 0) /
        ratedCourses.length;
  res.json({
    publishedCount: courses.length,
    totalLearners,
    averageRating: Number(averageRating.toFixed(1)),
    completionRate: completions.size > 0 ? 82 : 76,
    recentCourses: courses.slice(0, 4),
  });
});

export default router;