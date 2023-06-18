import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const courseRouter = createTRPCRouter({
  createCourse: protectedProcedure
    .input(z.object({ title: z.string(), description: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      // const user = ctx.session.user;

      const newCourse = await ctx.prisma.course.create({
        data: {
          title: input.title,
          description: input.description,
          userId: userId,
        },
      });

      // console.log("newCourse", newCourse);

      // return true;
      return newCourse;
    }),
  getCourses: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    // const user = ctx.session.user;

    const courses = await ctx.prisma.course.findMany({
      where: {
        userId: userId,
      },
    });

    // console.log("newCourse", newCourse);

    // return true;
    return courses;
  }),
  getCourseById: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const course = await ctx.prisma.course.findUnique({
        where: {
          id: input.courseId,
        },
      });

      console.log("newCourse", course);

      // return true;
      return course;
    }),
  updateCourse: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        title: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      await ctx.prisma.course.updateMany({
        where: {
          id: input.courseId,
          userId: userId,
        },
        data: {
          title: input.title,
        },
      });

      // return true;
      return {
        success: true,
      };
    }),

  //define updateCourse Route and update value which is passed in the input else return original value
});
