import { type NextPage } from "next";
import Head from "next/head";
import AdminDashboardLayout from "~/components/layouts/admin-dashboard-layout";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import { IconCheck, IconEdit, IconX } from "@tabler/icons-react";
import {
  Group,
  ActionIcon,
  TextInput,
  Title,
  Stack,
  FileInput,
  Button,
  Image,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { getImageUrl } from "~/utils/getImageUrl";

async function uploadFileToS3({
  getPresignedUrl,
  file,
}: {
  getPresignedUrl: () => Promise<{
    url: string;
    fields: Record<string, string>;
  }>;
  file: File;
}) {
  const { url, fields } = await getPresignedUrl();
  const data: Record<string, any> = {
    ...fields,
    "Content-Type": file.type,
    file,
  };
  const formData = new FormData();
  for (const name in data) {
    formData.append(name, data[name]);
  }
  await fetch(url, {
    method: "POST",
    body: formData,
  });
}

const Courses: NextPage = () => {
  const [isEditingTitle, { open: setEditTitle, close: unSetEditTitle }] =
    useDisclosure(false);

  //initial form values
  const updateTitleForm = useForm({
    initialValues: {
      title: "",
    },
  });

  // save courese id from url
  const courseId = useRouter().query.courseId as string;

  //request api for geting course and make courseID type safe to string
  const courseQuery = api.course.getCourseById.useQuery(
    {
      courseId,
    },
    {
      enabled: !!courseId,
      onSuccess(data) {
        updateTitleForm.setFieldValue("title", data?.title ?? "");
      },
    }
  );


  //updating course title
  const updateCourseMutation = api.course.updateCourse.useMutation();

  // creating presigned url for uploading file to s3
  const createPresignedUrlMutation =
    api.course.createPresignedUrl.useMutation();

  const [file, setFile] = useState<File | null>(null);

  //uploading file to s3
  const uploadImage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;
    await uploadFileToS3({
      getPresignedUrl: () =>
        createPresignedUrlMutation.mutateAsync({
          courseId,
        }),
      file,
    });
    setFile(null);
    await courseQuery.refetch();

    // if (fileRef.current) {
    //   fileRef.current.value = "";
    // }
  };

  return (
    <>
      <Head>
        <title>Manage Course</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <AdminDashboardLayout>
          <Stack spacing="xl">
            {isEditingTitle ? (
              <form
                onSubmit={updateTitleForm.onSubmit(async (values) => {
                  await updateCourseMutation.mutateAsync({
                    ...values,
                    courseId,
                  });
                  unSetEditTitle();
                  await courseQuery.refetch();
                })}
              >
                <Group spacing="md">
                  <TextInput
                    placeholder="Name your course here"
                    {...updateTitleForm.getInputProps("title")}
                    required
                  />
                  <ActionIcon
                    type="submit"
                    variant="light"
                    color="green"
                    size="lg"
                  >
                    <IconCheck size={"1rem"} />
                  </ActionIcon>
                  <ActionIcon
                    onClick={unSetEditTitle}
                    variant="light"
                    color="red"
                    size="lg"
                  >
                    <IconX size={"1rem"} />
                  </ActionIcon>
                </Group>
              </form>
            ) : (
              <Group spacing={"md"}>
                <Title>{courseQuery.data?.title}</Title>
                <ActionIcon onClick={setEditTitle} variant="light" size="lg">
                  <IconEdit size={"1rem"} />
                </ActionIcon>
              </Group>
            )}
            <Group>
              {courseQuery.data && (
                <Image
                  width="200"
                  alt="an image of the course"
                  src={getImageUrl(courseQuery.data.imageId)}
                  withPlaceholder 
                />
              )}
              <Stack sx={{ flex: 1 }}>
                <form onSubmit={uploadImage}>
                  <FileInput
                    label="Course Image"
                    onChange={setFile}
                    value={file}
                  />

                  <Button
                    disabled={!file}
                    type="submit"
                    variant="light"
                    color="blue"
                    mt="md"
                    radius="md"
                  >
                    Upload Image
                  </Button>
                </form>
              </Stack>
            </Group>
          </Stack>
        </AdminDashboardLayout>
      </main>
    </>
  );
};
export default Courses;
