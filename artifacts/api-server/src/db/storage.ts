import fs from "node:fs";
import path from "node:path";
import {
  db,
  isDatabaseConfigured,
  coursesTable,
  contentBlocksTable,
  quizQuestionsTable,
  enrollmentsTable,
  ratingsTable,
  usersTable,
} from "@workspace/db";
import { eq, desc, and, or, sql, ilike, inArray } from "drizzle-orm";

export type ContentBlock = {
  id: string;
  type: "video" | "presentation" | "quiz";
  title: string;
  description: string;
  duration: number;
  source: string | null;
  questions: { prompt: string; options: string[]; answer: number }[];
};

export type Course = {
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
  teacherId?: string;
};

export type CourseInput = {
  title: string;
  description: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  instructor: string;
  contents: ContentBlock[];
};

export type UserProfile = {
  id: string;
  clerkId?: string;
  email: string;
  fullName: string;
  role: "learner" | "teacher" | "admin";
  avatarUrl?: string;
  createdAt: string;
};

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
};

export type Rating = {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  createdAt: string;
};

interface PersistentStore {
  users: UserProfile[];
  courses: Course[];
  enrollments: Enrollment[];
  ratings: Rating[];
}

const accents = ["#14B8C4", "#7B6FE8", "#50C7B7", "#4FA3B1", "#F4AD4B"];

export const defaultSeedCourses: Course[] = [
  {
    id: "course-creative-coding",
    title: "Creative Coding with JavaScript",
    description: "Make playful, interactive sketches while learning the fundamentals of JavaScript.",
    category: "Code & design",
    level: "beginner",
    instructor: "Maya Patel",
    instructorInitials: "MP",
    rating: 4.9,
    ratingCount: 128,
    duration: 94,
    students: 1842,
    accent: "#14B8C4",
    teacherId: "teacher-maya-patel",
    createdAt: "2026-09-15T09:00:00.000Z",
    contents: [
      {
        id: "cc-1",
        type: "video",
        title: "Your first interactive sketch",
        description: "Learn the building blocks of a canvas sketch and make something move in the browser.",
        duration: 18,
        source: "https://www.youtube.com/embed/aqz-KE-bpKQ",
        questions: [],
      },
      {
        id: "cc-2",
        type: "presentation",
        title: "Thinking in loops and vectors",
        description: "A visual guide to loops, frame refreshes, conditions, and playful generative patterns.",
        duration: 22,
        source: "https://www.slideshare.net/slideshow/embed_code/key/creative-coding-loops",
        questions: [],
      },
      {
        id: "cc-3",
        type: "quiz",
        title: "Check your foundations",
        description: "A quick confidence check before you build your own autonomous sketch.",
        duration: 8,
        source: null,
        questions: [
          {
            prompt: "Which programming construct is used to repeat drawing operations across frame buffers?",
            options: ["A loop", "A constant", "A single string literal"],
            answer: 0,
          },
          {
            prompt: "What coordinate is at the top-left of standard HTML5 canvas?",
            options: ["(0, 0)", "(100, 100)", "(-1, -1)"],
            answer: 0,
          },
        ],
      },
    ],
  },
  {
    id: "course-storytelling",
    title: "Storytelling for Presentations",
    description: "Turn a pile of ideas into a clear narrative your audience remembers and acts upon.",
    category: "Communication",
    level: "intermediate",
    instructor: "Jon Bell",
    instructorInitials: "JB",
    rating: 4.8,
    ratingCount: 96,
    duration: 76,
    students: 1206,
    accent: "#7B6FE8",
    teacherId: "teacher-jon-bell",
    createdAt: "2026-09-10T09:00:00.000Z",
    contents: [
      {
        id: "st-1",
        type: "presentation",
        title: "The story spine",
        description: "A simple, repeatable structure for making any presentation easier to follow.",
        duration: 26,
        source: null,
        questions: [],
      },
      {
        id: "st-2",
        type: "video",
        title: "Make the opening matter",
        description: "Watch a live teardown of three different presentation openings and why tension works.",
        duration: 24,
        source: "https://www.youtube.com/embed/ysz5S6PUM-U",
        questions: [],
      },
      {
        id: "st-3",
        type: "quiz",
        title: "Narrative checkpoint",
        description: "Put the key components of a strong presentation opening in the right order.",
        duration: 7,
        source: null,
        questions: [
          {
            prompt: "What captures an audience's attention first?",
            options: ["A lengthy agenda", "A clear tension or relatable problem", "A company timeline"],
            answer: 1,
          },
        ],
      },
    ],
  },
  {
    id: "course-watercolor",
    title: "Watercolor Landscapes",
    description: "Paint calm, atmospheric landscapes with a small palette, clean washes, and a loose hand.",
    category: "Art & craft",
    level: "beginner",
    instructor: "Elena Rossi",
    instructorInitials: "ER",
    rating: 4.7,
    ratingCount: 74,
    duration: 112,
    students: 894,
    accent: "#50C7B7",
    teacherId: "teacher-elena-rossi",
    createdAt: "2026-09-06T09:00:00.000Z",
    contents: [
      {
        id: "wl-1",
        type: "video",
        title: "Light before detail",
        description: "Build a sense of atmospheric depth with clean washes before adding foreground marks.",
        duration: 31,
        source: "https://www.youtube.com/embed/aqz-KE-bpKQ",
        questions: [],
      },
      {
        id: "wl-2",
        type: "presentation",
        title: "A pocket palette",
        description: "Learn how four complementary pigments can create an entire glowing horizon.",
        duration: 19,
        source: null,
        questions: [],
      },
    ],
  },
  {
    id: "course-freelance",
    title: "Build a Freelance Practice",
    description: "Set up a repeatable client workflow that protects your focus and leaves room for better work.",
    category: "Business",
    level: "advanced",
    instructor: "Nikhil Shah",
    instructorInitials: "NS",
    rating: 4.6,
    ratingCount: 61,
    duration: 88,
    students: 642,
    accent: "#4FA3B1",
    teacherId: "teacher-nikhil-shah",
    createdAt: "2026-08-28T09:00:00.000Z",
    contents: [
      {
        id: "fp-1",
        type: "presentation",
        title: "Choose a clear offer",
        description: "Position your expertise so the right clients instantly recognize the value.",
        duration: 25,
        source: null,
        questions: [],
      },
      {
        id: "fp-2",
        type: "video",
        title: "The client kickoff",
        description: "A practical walkthrough of a calm, structured kickoff call that sets boundaries.",
        duration: 28,
        source: "https://www.youtube.com/embed/ysz5S6PUM-U",
        questions: [],
      },
    ],
  },
  {
    id: "course-home-cooking",
    title: "Weeknight Cooking, Uncomplicated",
    description: "Build a flexible system of techniques for making nourishing food on busy days.",
    category: "Food & home",
    level: "beginner",
    instructor: "Ari Kim",
    instructorInitials: "AK",
    rating: 4.5,
    ratingCount: 49,
    duration: 68,
    students: 518,
    accent: "#F4AD4B",
    teacherId: "teacher-ari-kim",
    createdAt: "2026-08-20T09:00:00.000Z",
    contents: [
      {
        id: "hc-1",
        type: "video",
        title: "Your three-pan system",
        description: "A synchronized rhythm for cooking seasonal vegetables, grains, and protein together.",
        duration: 20,
        source: "https://www.youtube.com/embed/aqz-KE-bpKQ",
        questions: [],
      },
      {
        id: "hc-2",
        type: "quiz",
        title: "Kitchen confidence check",
        description: "Choose the next move in a few common weeknight cooking situations.",
        duration: 6,
        source: null,
        questions: [
          {
            prompt: "What should you do before tasting food for final salt and acid seasoning?",
            options: ["Turn off extreme heat to protect tastebuds", "Dump white sugar into the pan", "Plate immediately"],
            answer: 0,
          },
        ],
      },
    ],
  },
];

function getWorkspaceDataDir(): string {
  let cur = import.meta.dirname || process.cwd();
  while (cur && cur !== path.dirname(cur)) {
    if (fs.existsSync(path.join(cur, "pnpm-workspace.yaml"))) {
      return path.join(cur, ".data");
    }
    cur = path.dirname(cur);
  }
  return path.resolve(process.cwd(), ".data");
}

export class StorageRepository {
  private dataFilePath: string;
  private memoryStore: PersistentStore;
  private isSeeded: boolean = false;
  private seedPromise: Promise<void> | null = null;

  constructor() {
    const dataDir = getWorkspaceDataDir();
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {
        // Fallback or ignore if already created
      }
    }
    this.dataFilePath = path.join(dataDir, "store.json");
    this.memoryStore = this.loadStore();
  }

  private loadStore(): PersistentStore {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.courses)) {
          return {
            users: parsed.users || [],
            courses: parsed.courses,
            enrollments: parsed.enrollments || [],
            ratings: parsed.ratings || [],
          };
        }
      }
    } catch (err) {
      console.warn("Failed to read storage file, initializing with seeds:", err);
    }

    const initialStore: PersistentStore = {
      users: [
        {
          id: "demo-user-1",
          email: "learner@skillexchanger.com",
          fullName: "Curious Learner",
          role: "learner",
          createdAt: new Date().toISOString(),
        },
        {
          id: "demo-teacher-1",
          email: "teacher@skillexchanger.com",
          fullName: "Studio Instructor",
          role: "teacher",
          createdAt: new Date().toISOString(),
        },
      ],
      courses: [...defaultSeedCourses],
      enrollments: [],
      ratings: [],
    };
    this.persistStore(initialStore);
    return initialStore;
  }

  private persistStore(store: PersistentStore) {
    try {
      const dataDir = path.dirname(this.dataFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(this.dataFilePath, JSON.stringify(store, null, 2), "utf8");
    } catch (err) {
      console.error("Failed to write persistent store to disk:", err);
    }
  }

  /**
   * Initializes and seeds PostgreSQL database if empty.
   */
  public async ensureDatabaseSeeded(): Promise<void> {
    if (!isDatabaseConfigured || !db) return;
    if (this.isSeeded) return;
    if (this.seedPromise) return this.seedPromise;

    this.seedPromise = (async () => {
      try {
        // Check if courses table has any rows
        const existing = await db
          .select({ count: sql<number>`count(*)` })
          .from(coursesTable);

        const count = Number(existing[0]?.count || 0);
        if (count > 0) {
          this.isSeeded = true;
          return;
        }

        console.log("Database courses table is empty. Seeding initial courses & instructors...");

        // 1. Seed default instructors and users
        const seedUsers = [
          { id: "demo-user-1", email: "learner@skillexchanger.com", fullName: "Curious Learner", role: "learner" },
          { id: "demo-teacher-1", email: "teacher@skillexchanger.com", fullName: "Studio Instructor", role: "teacher" },
          { id: "teacher-maya-patel", email: "maya.patel@skillexchanger.com", fullName: "Maya Patel", role: "teacher" },
          { id: "teacher-jon-bell", email: "jon.bell@skillexchanger.com", fullName: "Jon Bell", role: "teacher" },
          { id: "teacher-elena-rossi", email: "elena.rossi@skillexchanger.com", fullName: "Elena Rossi", role: "teacher" },
          { id: "teacher-nikhil-shah", email: "nikhil.shah@skillexchanger.com", fullName: "Nikhil Shah", role: "teacher" },
          { id: "teacher-ari-kim", email: "ari.kim@skillexchanger.com", fullName: "Ari Kim", role: "teacher" },
        ];

        for (const u of seedUsers) {
          await db
            .insert(usersTable)
            .values({
              id: u.id,
              email: u.email,
              fullName: u.fullName,
              role: u.role,
            })
            .onConflictDoNothing();
        }

        // 2. Seed courses, content blocks, and quiz questions
        for (const c of defaultSeedCourses) {
          await db.insert(coursesTable).values({
            id: c.id,
            teacherId: c.teacherId || "demo-teacher-1",
            title: c.title,
            description: c.description,
            category: c.category,
            level: c.level,
            instructor: c.instructor,
            instructorInitials: c.instructorInitials,
            rating: c.rating.toFixed(2),
            ratingCount: c.ratingCount,
            duration: c.duration,
            students: c.students,
            accent: c.accent,
            status: "published",
            createdAt: new Date(c.createdAt),
          }).onConflictDoNothing();

          for (let bIdx = 0; bIdx < c.contents.length; bIdx++) {
            const b = c.contents[bIdx];
            await db.insert(contentBlocksTable).values({
              id: b.id,
              courseId: c.id,
              type: b.type,
              title: b.title,
              description: b.description || "",
              duration: b.duration,
              source: b.source,
              sequenceOrder: bIdx,
            }).onConflictDoNothing();

            if (b.questions && b.questions.length > 0) {
              for (let qIdx = 0; qIdx < b.questions.length; qIdx++) {
                const q = b.questions[qIdx];
                await db.insert(quizQuestionsTable).values({
                  id: `q-${b.id}-${qIdx}`,
                  blockId: b.id,
                  prompt: q.prompt,
                  options: q.options,
                  answer: q.answer,
                  sequenceOrder: qIdx,
                }).onConflictDoNothing();
              }
            }
          }
        }

        this.isSeeded = true;
        console.log("Database seeded successfully with initial courses.");
      } catch (err) {
        console.warn("Failed to check or seed PostgreSQL database:", err);
      }
    })();

    await this.seedPromise;
  }

  // --- Users ---
  async getOrCreateUser(
    userId: string,
    email?: string,
    name?: string,
    role: "learner" | "teacher" = "learner"
  ): Promise<UserProfile> {
    if (isDatabaseConfigured && db) {
      try {
        const found = await db
          .select()
          .from(usersTable)
          .where(or(eq(usersTable.id, userId), eq(usersTable.clerkId, userId)))
          .limit(1);

        if (found.length > 0) {
          const u = found[0];
          return {
            id: u.id,
            clerkId: u.clerkId || undefined,
            email: u.email,
            fullName: u.fullName,
            role: (u.role as "learner" | "teacher" | "admin") || role,
            avatarUrl: u.avatarUrl || undefined,
            createdAt: u.createdAt.toISOString(),
          };
        }

        const effectiveEmail = email || `${userId}@skillexchanger.com`;
        const effectiveName = name || (role === "teacher" ? "Studio Instructor" : "Curious Learner");
        const isClerk = userId.startsWith("user_");

        const inserted = await db
          .insert(usersTable)
          .values({
            id: userId,
            clerkId: isClerk ? userId : null,
            email: effectiveEmail,
            fullName: effectiveName,
            role,
          })
          .onConflictDoUpdate({
            target: usersTable.id,
            set: { fullName: effectiveName },
          })
          .returning();

        const u = inserted[0];
        return {
          id: u.id,
          clerkId: u.clerkId || undefined,
          email: u.email,
          fullName: u.fullName,
          role: (u.role as "learner" | "teacher" | "admin") || role,
          avatarUrl: u.avatarUrl || undefined,
          createdAt: u.createdAt.toISOString(),
        };
      } catch (err) {
        console.warn("Database user query failed, falling back to local store:", err);
      }
    }

    let user = this.memoryStore.users.find((u) => u.id === userId || (u.clerkId && u.clerkId === userId));
    if (!user) {
      user = {
        id: userId,
        clerkId: userId.startsWith("user_") ? userId : undefined,
        email: email || `${userId}@skillexchanger.com`,
        fullName: name || (role === "teacher" ? "Studio Instructor" : "Curious Learner"),
        role,
        createdAt: new Date().toISOString(),
      };
      this.memoryStore.users.push(user);
      this.persistStore(this.memoryStore);
    }
    return user;
  }

  // --- Courses ---
  async listCourses(params?: { search?: string; sort?: "rating" | "newest" }): Promise<Course[]> {
    if (isDatabaseConfigured && db) {
      try {
        await this.ensureDatabaseSeeded();

        const search = params?.search?.trim();
        const sort = params?.sort || "rating";

        let conditions = eq(coursesTable.status, "published");
        if (search) {
          const pattern = `%${search}%`;
          conditions = and(
            conditions,
            or(
              ilike(coursesTable.title, pattern),
              ilike(coursesTable.description, pattern),
              ilike(coursesTable.category, pattern),
              ilike(coursesTable.instructor, pattern)
            )
          )!;
        }

        const orderByClause =
          sort === "newest"
            ? [desc(coursesTable.createdAt)]
            : [desc(coursesTable.rating), desc(coursesTable.ratingCount)];

        const dbCourses = await db
          .select()
          .from(coursesTable)
          .where(conditions)
          .orderBy(...orderByClause);

        if (dbCourses.length === 0) {
          return [];
        }

        const courseIds = dbCourses.map((c) => c.id);

        // Fetch all content blocks for these courses
        const blocks = await db
          .select()
          .from(contentBlocksTable)
          .where(inArray(contentBlocksTable.courseId, courseIds))
          .orderBy(contentBlocksTable.sequenceOrder);

        const blockIds = blocks.filter((b) => b.type === "quiz").map((b) => b.id);

        // Fetch quiz questions
        const questions =
          blockIds.length > 0
            ? await db
                .select()
                .from(quizQuestionsTable)
                .where(inArray(quizQuestionsTable.blockId, blockIds))
                .orderBy(quizQuestionsTable.sequenceOrder)
            : [];

        const questionsByBlockId = new Map<string, typeof questions>();
        for (const q of questions) {
          const list = questionsByBlockId.get(q.blockId) || [];
          list.push(q);
          questionsByBlockId.set(q.blockId, list);
        }

        const blocksByCourseId = new Map<string, ContentBlock[]>();
        for (const b of blocks) {
          const qList = questionsByBlockId.get(b.id) || [];
          const contentBlock: ContentBlock = {
            id: b.id,
            type: b.type as "video" | "presentation" | "quiz",
            title: b.title,
            description: b.description || "",
            duration: b.duration,
            source: b.source || null,
            questions: qList.map((q) => ({
              prompt: q.prompt,
              options: Array.isArray(q.options) ? q.options : [],
              answer: q.answer,
            })),
          };

          const list = blocksByCourseId.get(b.courseId) || [];
          list.push(contentBlock);
          blocksByCourseId.set(b.courseId, list);
        }

        return dbCourses.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          category: c.category,
          level: c.level as "beginner" | "intermediate" | "advanced",
          instructor: c.instructor,
          instructorInitials: c.instructorInitials,
          rating: Number(c.rating),
          ratingCount: c.ratingCount,
          duration: c.duration,
          students: c.students,
          accent: c.accent,
          contents: blocksByCourseId.get(c.id) || [],
          createdAt: c.createdAt.toISOString(),
          teacherId: c.teacherId || undefined,
        }));
      } catch (err) {
        console.warn("Database listCourses failed, falling back to local store:", err);
      }
    }

    const search = params?.search?.trim().toLowerCase();
    const sort = params?.sort || "rating";

    let result = this.memoryStore.courses.filter((course) => {
      if (!search) return true;
      return [course.title, course.description, course.category, course.instructor]
        .join(" ")
        .toLowerCase()
        .includes(search);
    });

    if (sort === "newest") {
      result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else {
      result.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
    }

    return result;
  }

  async getCourseById(courseId: string): Promise<Course | null> {
    if (isDatabaseConfigured && db) {
      try {
        await this.ensureDatabaseSeeded();

        const dbCourses = await db
          .select()
          .from(coursesTable)
          .where(eq(coursesTable.id, courseId))
          .limit(1);

        if (dbCourses.length === 0) {
          return null;
        }

        const c = dbCourses[0];

        // Fetch content blocks
        const blocks = await db
          .select()
          .from(contentBlocksTable)
          .where(eq(contentBlocksTable.courseId, courseId))
          .orderBy(contentBlocksTable.sequenceOrder);

        const blockIds = blocks.filter((b) => b.type === "quiz").map((b) => b.id);
        const questions =
          blockIds.length > 0
            ? await db
                .select()
                .from(quizQuestionsTable)
                .where(inArray(quizQuestionsTable.blockId, blockIds))
                .orderBy(quizQuestionsTable.sequenceOrder)
            : [];

        const questionsByBlockId = new Map<string, typeof questions>();
        for (const q of questions) {
          const list = questionsByBlockId.get(q.blockId) || [];
          list.push(q);
          questionsByBlockId.set(q.blockId, list);
        }

        const contents: ContentBlock[] = blocks.map((b) => ({
          id: b.id,
          type: b.type as "video" | "presentation" | "quiz",
          title: b.title,
          description: b.description || "",
          duration: b.duration,
          source: b.source || null,
          questions: (questionsByBlockId.get(b.id) || []).map((q) => ({
            prompt: q.prompt,
            options: Array.isArray(q.options) ? q.options : [],
            answer: q.answer,
          })),
        }));

        return {
          id: c.id,
          title: c.title,
          description: c.description,
          category: c.category,
          level: c.level as "beginner" | "intermediate" | "advanced",
          instructor: c.instructor,
          instructorInitials: c.instructorInitials,
          rating: Number(c.rating),
          ratingCount: c.ratingCount,
          duration: c.duration,
          students: c.students,
          accent: c.accent,
          contents,
          createdAt: c.createdAt.toISOString(),
          teacherId: c.teacherId || undefined,
        };
      } catch (err) {
        console.warn("Database getCourseById failed, falling back to local store:", err);
      }
    }

    const course = this.memoryStore.courses.find((c) => c.id === courseId);
    return course || null;
  }

  async createCourse(input: CourseInput, teacher: { id: string; name: string }): Promise<Course> {
    const instructorName = input.instructor?.trim() || teacher.name;
    const instructorInitials = instructorName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "SK";

    const totalDuration = input.contents.reduce((sum, item) => sum + (Number(item.duration) || 0), 0);
    const accent = accents[Math.floor(Math.random() * accents.length)];
    const courseId = `course-${Date.now()}`;

    if (isDatabaseConfigured && db) {
      try {
        await this.ensureDatabaseSeeded();
        // Ensure teacher user exists in DB
        await this.getOrCreateUser(teacher.id, undefined, teacher.name, "teacher");

        await db.insert(coursesTable).values({
          id: courseId,
          teacherId: teacher.id,
          title: input.title.trim(),
          description: input.description.trim(),
          category: input.category.trim() || "General",
          level: input.level || "beginner",
          instructor: instructorName,
          instructorInitials,
          rating: "0.00",
          ratingCount: 0,
          duration: totalDuration,
          students: 0,
          accent,
          status: "published",
        });

        for (let idx = 0; idx < input.contents.length; idx++) {
          const b = input.contents[idx];
          const blockId = b.id || `block-${Date.now()}-${idx}`;

          await db.insert(contentBlocksTable).values({
            id: blockId,
            courseId,
            type: b.type,
            title: b.title.trim(),
            description: b.description?.trim() || "",
            duration: Number(b.duration) || 5,
            source: b.source || null,
            sequenceOrder: idx,
          });

          if (b.questions && b.questions.length > 0) {
            for (let qIdx = 0; qIdx < b.questions.length; qIdx++) {
              const q = b.questions[qIdx];
              await db.insert(quizQuestionsTable).values({
                id: `q-${blockId}-${qIdx}`,
                blockId,
                prompt: q.prompt,
                options: q.options || [],
                answer: Number(q.answer) || 0,
                sequenceOrder: qIdx,
              });
            }
          }
        }

        const created = await this.getCourseById(courseId);
        if (created) return created;
      } catch (err) {
        console.warn("Database createCourse failed, falling back to local store:", err);
      }
    }

    const newCourse: Course = {
      id: courseId,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category.trim() || "General",
      level: input.level || "beginner",
      instructor: instructorName,
      instructorInitials,
      rating: 0,
      ratingCount: 0,
      duration: totalDuration,
      students: 0,
      accent,
      teacherId: teacher.id,
      contents: input.contents.map((b, idx) => ({
        id: b.id || `block-${Date.now()}-${idx}`,
        type: b.type,
        title: b.title.trim(),
        description: b.description?.trim() || "",
        duration: Number(b.duration) || 5,
        source: b.source || null,
        questions: (b.questions || []).map((q) => ({
          prompt: q.prompt,
          options: q.options || [],
          answer: Number(q.answer) || 0,
        })),
      })),
      createdAt: new Date().toISOString(),
    };

    this.memoryStore.courses.unshift(newCourse);
    this.persistStore(this.memoryStore);
    return newCourse;
  }

  // --- Enrollments & Completion ---
  async getCourseProgress(
    courseId: string,
    userId: string
  ): Promise<{ completed: boolean; rated: boolean; userRating?: number }> {
    if (isDatabaseConfigured && db) {
      try {
        await this.ensureDatabaseSeeded();

        const [enrollment, ratingRecord] = await Promise.all([
          db
            .select()
            .from(enrollmentsTable)
            .where(and(eq(enrollmentsTable.courseId, courseId), eq(enrollmentsTable.userId, userId)))
            .limit(1),
          db
            .select()
            .from(ratingsTable)
            .where(and(eq(ratingsTable.courseId, courseId), eq(ratingsTable.userId, userId)))
            .limit(1),
        ]);

        return {
          completed: Boolean(enrollment[0]?.completed),
          rated: Boolean(ratingRecord[0]),
          userRating: ratingRecord[0]?.rating ?? undefined,
        };
      } catch (err) {
        console.warn("Database getCourseProgress failed, falling back to local store:", err);
      }
    }

    const enrollment = this.memoryStore.enrollments.find(
      (e) => e.courseId === courseId && e.userId === userId
    );
    const ratingRecord = this.memoryStore.ratings.find(
      (r) => r.courseId === courseId && r.userId === userId
    );

    return {
      completed: Boolean(enrollment?.completed),
      rated: Boolean(ratingRecord),
      userRating: ratingRecord?.rating,
    };
  }

  async completeCourse(courseId: string, userId: string): Promise<{ courseId: string; completed: boolean }> {
    if (isDatabaseConfigured && db) {
      try {
        await this.ensureDatabaseSeeded();

        const course = await this.getCourseById(courseId);
        if (!course) {
          throw new Error("Course not found");
        }

        // Ensure user exists in database
        await this.getOrCreateUser(userId);

        const existingEnrollment = await db
          .select()
          .from(enrollmentsTable)
          .where(and(eq(enrollmentsTable.courseId, courseId), eq(enrollmentsTable.userId, userId)))
          .limit(1);

        if (existingEnrollment.length === 0) {
          const enrollmentId = `enrollment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
          await db.insert(enrollmentsTable).values({
            id: enrollmentId,
            userId,
            courseId,
            completed: true,
            completedAt: new Date(),
          });

          await db
            .update(coursesTable)
            .set({ students: sql`${coursesTable.students} + 1` })
            .where(eq(coursesTable.id, courseId));
        } else if (!existingEnrollment[0].completed) {
          await db
            .update(enrollmentsTable)
            .set({ completed: true, completedAt: new Date() })
            .where(eq(enrollmentsTable.id, existingEnrollment[0].id));

          await db
            .update(coursesTable)
            .set({ students: sql`${coursesTable.students} + 1` })
            .where(eq(coursesTable.id, courseId));
        }

        return { courseId, completed: true };
      } catch (err: any) {
        if (err.message === "Course not found") throw err;
        console.warn("Database completeCourse failed, falling back to local store:", err);
      }
    }

    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    let enrollment = this.memoryStore.enrollments.find(
      (e) => e.courseId === courseId && e.userId === userId
    );

    if (!enrollment) {
      enrollment = {
        id: `enrollment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId,
        courseId,
        completed: true,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      this.memoryStore.enrollments.push(enrollment);
      course.students += 1;
    } else if (!enrollment.completed) {
      enrollment.completed = true;
      enrollment.completedAt = new Date().toISOString();
      course.students += 1;
    }

    this.persistStore(this.memoryStore);
    return { courseId, completed: true };
  }

  // --- Rating ---
  async rateCourse(courseId: string, userId: string, ratingValue: number): Promise<Course> {
    if (isDatabaseConfigured && db) {
      try {
        await this.ensureDatabaseSeeded();

        const course = await this.getCourseById(courseId);
        if (!course) {
          throw new Error("Course not found");
        }

        const enrollment = await db
          .select()
          .from(enrollmentsTable)
          .where(and(eq(enrollmentsTable.courseId, courseId), eq(enrollmentsTable.userId, userId)))
          .limit(1);

        if (enrollment.length === 0 || !enrollment[0].completed) {
          throw new Error("Complete the course before rating it");
        }

        // Ensure user exists
        await this.getOrCreateUser(userId);

        const existingRating = await db
          .select()
          .from(ratingsTable)
          .where(and(eq(ratingsTable.courseId, courseId), eq(ratingsTable.userId, userId)))
          .limit(1);

        if (existingRating.length > 0) {
          await db
            .update(ratingsTable)
            .set({ rating: ratingValue })
            .where(eq(ratingsTable.id, existingRating[0].id));
        } else {
          await db.insert(ratingsTable).values({
            id: `rating-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            userId,
            courseId,
            rating: ratingValue,
          });
        }

        // Recalculate true cumulative rating from all reviews for this course
        const ratingStats = await db
          .select({
            count: sql<number>`count(*)`,
            avg: sql<number>`avg(rating)`,
          })
          .from(ratingsTable)
          .where(eq(ratingsTable.courseId, courseId));

        const count = Number(ratingStats[0]?.count || 1);
        const avg = Number(Number(ratingStats[0]?.avg || ratingValue).toFixed(1));

        await db
          .update(coursesTable)
          .set({
            rating: avg.toFixed(2),
            ratingCount: count,
          })
          .where(eq(coursesTable.id, courseId));

        const updated = await this.getCourseById(courseId);
        if (updated) return updated;
      } catch (err: any) {
        if (
          err.message === "Course not found" ||
          err.message === "Complete the course before rating it"
        ) {
          throw err;
        }
        console.warn("Database rateCourse failed, falling back to local store:", err);
      }
    }

    const course = await this.getCourseById(courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    const enrollment = this.memoryStore.enrollments.find(
      (e) => e.courseId === courseId && e.userId === userId && e.completed
    );

    if (!enrollment) {
      throw new Error("Complete the course before rating it");
    }

    let existingRating = this.memoryStore.ratings.find(
      (r) => r.courseId === courseId && r.userId === userId
    );

    if (existingRating) {
      existingRating.rating = ratingValue;
    } else {
      this.memoryStore.ratings.push({
        id: `rating-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId,
        courseId,
        rating: ratingValue,
        createdAt: new Date().toISOString(),
      });
    }

    // Recalculate true cumulative rating from all reviews for this course
    const courseRatings = this.memoryStore.ratings.filter((r) => r.courseId === courseId);
    const sum = courseRatings.reduce((total, r) => total + r.rating, 0);
    course.ratingCount = courseRatings.length;
    course.rating = course.ratingCount > 0 ? Number((sum / course.ratingCount).toFixed(1)) : ratingValue;

    this.persistStore(this.memoryStore);
    return course;
  }

  // --- Quiz Verification ---
  async verifyQuiz(
    courseId: string,
    blockId: string,
    submittedAnswers: number[]
  ): Promise<{
    score: number;
    total: number;
    passed: boolean;
    percentage: number;
    results: Array<{ prompt: string; selected: number; correct: number; isCorrect: boolean }>;
  }> {
    const course = await this.getCourseById(courseId);
    if (!course) throw new Error("Course not found");

    const block = course.contents.find((b) => b.id === blockId);
    if (!block || block.type !== "quiz") throw new Error("Quiz block not found");

    let score = 0;
    const results = block.questions.map((q, idx) => {
      const selected = submittedAnswers[idx] ?? -1;
      const isCorrect = selected === q.answer;
      if (isCorrect) score += 1;
      return {
        prompt: q.prompt,
        selected,
        correct: q.answer,
        isCorrect,
      };
    });

    const total = block.questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 100;
    const passed = percentage >= 60;

    return { score, total, passed, percentage, results };
  }

  // --- Teacher Summary ---
  async getTeacherSummary(teacherId?: string): Promise<{
    publishedCount: number;
    totalLearners: number;
    averageRating: number;
    completionRate: number;
    recentCourses: Course[];
  }> {
    if (isDatabaseConfigured && db) {
      try {
        await this.ensureDatabaseSeeded();

        const allCourses = await this.listCourses();
        let teacherCourses = teacherId
          ? allCourses.filter((c) => c.teacherId === teacherId)
          : [];

        if (teacherCourses.length === 0) {
          teacherCourses = allCourses;
        }

        const totalLearners = teacherCourses.reduce((sum, c) => sum + c.students, 0);
        const ratedCourses = teacherCourses.filter((c) => c.ratingCount > 0);
        const averageRating =
          ratedCourses.length === 0
            ? 0
            : Number(
                (ratedCourses.reduce((sum, c) => sum + c.rating, 0) / ratedCourses.length).toFixed(1)
              );

        const teacherCourseIds = teacherCourses.map((c) => c.id);
        let completionRate = 78;

        if (teacherCourseIds.length > 0) {
          const enrollments = await db
            .select({
              total: sql<number>`count(*)`,
              completed: sql<number>`count(*) filter (where completed = true)`,
            })
            .from(enrollmentsTable)
            .where(inArray(enrollmentsTable.courseId, teacherCourseIds));

          const totalEnrollments = Number(enrollments[0]?.total || 0);
          const completedEnrollments = Number(enrollments[0]?.completed || 0);

          if (totalEnrollments > 0) {
            completionRate = Math.round((completedEnrollments / totalEnrollments) * 100);
          }
        }

        return {
          publishedCount: teacherCourses.length,
          totalLearners,
          averageRating,
          completionRate,
          recentCourses: teacherCourses.slice(0, 4),
        };
      } catch (err) {
        console.warn("Database getTeacherSummary failed, falling back to local store:", err);
      }
    }

    let teacherCourses = teacherId
      ? this.memoryStore.courses.filter((c) => c.teacherId === teacherId)
      : [];

    if (teacherCourses.length === 0) {
      teacherCourses = this.memoryStore.courses;
    }

    const totalLearners = teacherCourses.reduce((sum, c) => sum + c.students, 0);
    const ratedCourses = teacherCourses.filter((c) => c.ratingCount > 0);
    const averageRating =
      ratedCourses.length === 0
        ? 0
        : Number(
            (ratedCourses.reduce((sum, c) => sum + c.rating, 0) / ratedCourses.length).toFixed(1)
          );

    const teacherCourseIds = new Set(teacherCourses.map((c) => c.id));
    const relevantEnrollments = this.memoryStore.enrollments.filter((e) =>
      teacherCourseIds.has(e.courseId)
    );
    const completedCount = relevantEnrollments.filter((e) => e.completed).length;
    const completionRate =
      relevantEnrollments.length > 0
        ? Math.round((completedCount / relevantEnrollments.length) * 100)
        : 78;

    return {
      publishedCount: teacherCourses.length,
      totalLearners,
      averageRating,
      completionRate,
      recentCourses: teacherCourses.slice(0, 4),
    };
  }
}

export const storage = new StorageRepository();
