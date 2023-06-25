import { env } from "~/env.mjs";

export function getImageUrl(id: string) {
  // console.log("Bucket name", env.NEXT_PUBLIC_S3_BUCKET_NAME);

  return `http://localhost:9000/${env.NEXT_PUBLIC_S3_BUCKET_NAME}/${id}`;
}
