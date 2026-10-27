import { index, integer, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const coursesTable = pgTable(
  "courses",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    teacherId: varchar("teacher_id", { length: 128 }).references(() => usersTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    level: varchar("level", { length: 50 }).default("beginner").notNull(), // 'beginner' | 'intermediate' | 'advanced'
    instructor: varchar("instructor", { length: 255 }).notNull(),
    instructorInitials: varchar("instructor_initials", { length: 10 }).notNull(),
    rating: numeric("rating", { precision: 3, scale: 2 }).default("0.00").notNull(),
    ratingCount: integer("rating_count").default(0).notNull(),
    duration: integer("duration").default(0).notNull(), // in minutes
    students: integer("students").default(0).notNull(),
    accent: varchar("accent", { length: 50 }).default("coral").notNull(),
    status: varchar("status", { length: 50 }).default("published").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("courses_rating_idx").on(table.rating),
    index("courses_created_at_idx").on(table.createdAt),
    index("courses_category_idx").on(table.category),
    index("courses_teacher_id_idx").on(table.teacherId),
  ]
);

export type CourseRecord = typeof coursesTable.$inferSelect;
export type NewCourseRecord = typeof coursesTable.$inferInsert;
