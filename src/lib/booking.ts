export const WORK_TYPES = ["tattoo", "touch up", "cover up"] as const;
export const DESIGN_TYPES = ["custom", "flash"] as const;

export type WorkType = (typeof WORK_TYPES)[number];
export type DesignType = (typeof DESIGN_TYPES)[number];

export const MAX_BOOKING_IMAGES = 10;
export const MAX_BOOKING_IMAGE_BYTES = 2.5 * 1024 * 1024;
export const MAX_BOOKING_TOTAL_BYTES = 3.5 * 1024 * 1024;

export const BOOKING_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type BookingInquiry = {
  submissionId: string;
  name: string;
  email: string;
  instagram: string;
  workType: WorkType;
  placement: string;
  size: string;
  designType: DesignType;
  design: string;
  budget: string;
  availability: string;
};

type BookingValidationResult =
  | { ok: true; inquiry: BookingInquiry; images: File[] }
  | { ok: false; fieldErrors: Record<string, string> };

const FIELD_LIMITS = {
  submissionId: 128,
  name: 120,
  email: 254,
  instagram: 80,
  placement: 500,
  size: 120,
  design: 3_000,
  budget: 120,
  availability: 500,
} as const;

function text(formData: FormData, key: keyof typeof FIELD_LIMITS) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, FIELD_LIMITS[key] + 1) : "";
}

function isOneOf<const T extends readonly string[]>(value: string, choices: T): value is T[number] {
  return choices.includes(value as T[number]);
}

export function validateBookingForm(formData: FormData): BookingValidationResult {
  const fieldErrors: Record<string, string> = {};
  const submissionId = text(formData, "submissionId");
  const name = text(formData, "name");
  const email = text(formData, "email");
  const instagram = text(formData, "instagram");
  const placement = text(formData, "placement");
  const size = text(formData, "size");
  const design = text(formData, "design");
  const budget = text(formData, "budget");
  const availability = text(formData, "availability");
  const workType = String(formData.get("workType") ?? "");
  const designType = String(formData.get("designType") ?? "");

  if (!submissionId || !/^[a-zA-Z0-9_-]{16,128}$/.test(submissionId)) fieldErrors.form = "please try submitting again.";
  if (!name) fieldErrors.name = "please enter your name.";
  if (name.length > FIELD_LIMITS.name) fieldErrors.name = "name is too long.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.email = "please enter a valid email.";
  if (email.length > FIELD_LIMITS.email) fieldErrors.email = "email is too long.";
  if (instagram.length > FIELD_LIMITS.instagram) fieldErrors.instagram = "instagram handle is too long.";
  if (!isOneOf(workType, WORK_TYPES)) fieldErrors.workType = "please choose a work type.";
  if (!placement) fieldErrors.placement = "please describe the placement.";
  if (placement.length > FIELD_LIMITS.placement) fieldErrors.placement = "placement description is too long.";
  if (!size) fieldErrors.size = "please enter an approximate size.";
  if (size.length > FIELD_LIMITS.size) fieldErrors.size = "size description is too long.";
  if (!isOneOf(designType, DESIGN_TYPES)) fieldErrors.designType = "please choose a design type.";
  if (!design) fieldErrors.design = "please describe your design.";
  if (design.length > FIELD_LIMITS.design) fieldErrors.design = "design description is too long.";
  if (!budget) fieldErrors.budget = "please enter your budget.";
  if (budget.length > FIELD_LIMITS.budget) fieldErrors.budget = "budget is too long.";
  if (!availability) fieldErrors.availability = "please share your availability.";
  if (availability.length > FIELD_LIMITS.availability) fieldErrors.availability = "availability is too long.";
  if (formData.get("is18") !== "true") fieldErrors.is18 = "you must be 18 or older to book.";

  const images = formData
    .getAll("images")
    .filter((value): value is File => typeof value !== "string" && value.size > 0);
  const totalImageBytes = images.reduce((total, image) => total + image.size, 0);

  if (images.length > MAX_BOOKING_IMAGES) fieldErrors.images = `please attach no more than ${MAX_BOOKING_IMAGES} images.`;
  if (images.some((image) => !BOOKING_IMAGE_TYPES.includes(image.type as (typeof BOOKING_IMAGE_TYPES)[number]))) {
    fieldErrors.images = "images must be JPG, PNG, or WebP files.";
  }
  if (images.some((image) => image.size > MAX_BOOKING_IMAGE_BYTES)) {
    fieldErrors.images = "each image must be 2.5 MB or smaller.";
  }
  if (totalImageBytes > MAX_BOOKING_TOTAL_BYTES) fieldErrors.images = "images must be 3.5 MB or smaller combined.";

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  return {
    ok: true,
    inquiry: {
      submissionId,
      name,
      email,
      instagram,
      workType: workType as WorkType,
      placement,
      size,
      designType: designType as DesignType,
      design,
      budget,
      availability,
    },
    images,
  };
}

export function formatBookingInquiry(inquiry: BookingInquiry, imageNames: string[]) {
  return [
    "NEW TATTOO BOOKING INQUIRY",
    "",
    `name: ${inquiry.name}`,
    `email: ${inquiry.email}`,
    `instagram: ${inquiry.instagram || "—"}`,
    `work type: ${inquiry.workType}`,
    `placement: ${inquiry.placement}`,
    `size: ${inquiry.size}`,
    `design type: ${inquiry.designType}`,
    `design: ${inquiry.design}`,
    `budget: ${inquiry.budget}`,
    `availability: ${inquiry.availability}`,
    `attachments: ${imageNames.length ? imageNames.join(", ") : "none"}`,
  ].join("\n");
}
