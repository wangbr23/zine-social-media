"use server";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { createDraftZine } from "@/lib/zines/create";
import {
  findAspectRatio,
  findTemplate,
  type ZineAspectRatioKey,
  type ZineTemplateKey,
} from "@/lib/zines/options";

export type CreateZineState = {
  errors?: {
    title?: string;
    aspectRatio?: string;
    template?: string;
    form?: string;
  };
  values?: {
    title: string;
    aspectRatio: ZineAspectRatioKey;
    template: ZineTemplateKey;
  };
};

export async function createZine(
  _previousState: CreateZineState,
  formData: FormData,
): Promise<CreateZineState> {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    return { errors: { form: "You must be signed in to create a draft." } };
  }

  const title = String(formData.get("title") ?? "").trim();
  const aspectRatioValue = String(formData.get("aspectRatio") ?? "");
  const templateValue = String(formData.get("template") ?? "");
  const aspectRatio = findAspectRatio(aspectRatioValue);
  const template = findTemplate(templateValue);
  const errors: NonNullable<CreateZineState["errors"]> = {};

  if (title.length < 1 || title.length > 120) {
    errors.title = "Title must be between 1 and 120 characters.";
  }

  if (!aspectRatio) {
    errors.aspectRatio = "Choose a page shape.";
  }

  if (!template) {
    errors.template = "Choose a starting point.";
  }

  if (Object.keys(errors).length > 0 || !aspectRatio || !template) {
    return {
      errors,
      values: {
        title,
        aspectRatio: (aspectRatio?.key ?? "portrait") as ZineAspectRatioKey,
        template: (template?.key ?? "blank") as ZineTemplateKey,
      },
    };
  }

  let created: Awaited<ReturnType<typeof createDraftZine>>;

  try {
    created = await createDraftZine({
      clerkUserId: userId,
      title,
      aspectRatio,
      templateKey: template.key,
    });
  } catch (error) {
    const errorId = crypto.randomUUID();

    console.error("Draft creation failed", { errorId, error });

    return {
      errors: {
        form: `We could not create your draft. Please try again. Reference: ${errorId}`,
      },
      values: { title, aspectRatio: aspectRatio.key, template: template.key },
    };
  }

  redirect(`/create/${created.id}`);
}
