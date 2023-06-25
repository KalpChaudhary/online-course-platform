import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

//amazon s3
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { env } from "~/env.mjs";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_MAX_FILE_SIZE = 1000000;

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: "http://localhost:9000",
  forcePathStyle: true,
  credentials: {
    accessKeyId: "S3RVER",
    secretAccessKey: "S3RVER",
  },
});

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
  createPresignedUrl: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // const userId = ctx.session.user.id;

      const course = await ctx.prisma.course.findUnique({
        where: {
          id: input.courseId,
        },
      });
      // console.log("course", course);

      if (!course) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Course does not exist",
        });
      }

      const imageId = uuidv4();
      await ctx.prisma.course.update({
        where: {
          id: course.id,
        },
        data: {
          imageId,
        },
      });

      return createPresignedPost(s3Client, {
        Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME,
        Key: imageId,
        Fields: {
          key: imageId,
        },
        Conditions: [
          ["starts-with", "$Content-Type", "image/"],
          ["content-length-range", 0, UPLOAD_MAX_FILE_SIZE],
        ],
      });
    }),

  //define updateCourse Route and update value which is passed in the input else return original value
});

// async resolve({ ctx }) {
//   const userId = ctx.session.user.id;

//   const image = await prisma.image.create({
//     data: {
//       userId,
//     },
//   });

//   return new Promise((resolve, reject) => {
//     s3.createPresignedPost(
//       {
//         Fields: {
//           key: `${userId}/${image.id}`,
//         },
//         Conditions: [
//           ["starts-with", "$Content-Type", "image/"],
//           ["content-length-range", 0, UPLOAD_MAX_FILE_SIZE],
//         ],
//         Expires: UPLOADING_TIME_LIMIT,
//         Bucket: BUCKET_NAME,
//       },
//       (err, signed) => {
//         if (err) return reject(err);
//         resolve(signed);
//       }
//     );
//   });
// },
