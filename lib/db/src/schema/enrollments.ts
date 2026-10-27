import { boolean, pgTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { coursesTable } from "./courses";

export const enrollmentsTable = pgTable(
  "enrollments",
  {
    id: varchar("id", { length: 128 }).primaryKey(),
    userId: varchar("user_id", { length: 128 })
      .references(() => usersTable.id, { onDelete: "cascade" })
      .notNull(),
    courseId: varchar("course_id", { length: 128 })
      .references(() => coursesTable.id, { onDelete: "cascade" })
      .notNull(),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("user_course_enrollment_idx").on(table.userId, table.courseId),
  ]
);

export type EnrollmentRecord = typeof enrollmentsTable.$inferSelect;
export type NewEnrollmentRecord = typeof enrollmentsTable.$inferInsert;
