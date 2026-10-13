export function validateWaitlist(form: FormData) {
  const fields = { name: "", email: "", city: "", country: "", instagram: "", submissionId: "" };
  const errors: Record<string, string> = {};
  const limits = { name: 120, email: 254, city: 120, country: 120, instagram: 80, submissionId: 128 };
  for (const key of Object.keys(fields) as (keyof typeof fields)[]) {
    const value = form.get(key);
    fields[key] = typeof value === "string" ? value.trim() : "";
    if (!fields[key] || fields[key].length > limits[key] || /[\r\n]/.test(fields[key])) errors[key] = `please enter a valid ${key === "submissionId" ? "submission" : key}.`;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errors.email = "please enter a valid email.";
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(fields.submissionId)) errors.submissionId = "please try submitting again.";
  if (form.get("is18") !== "true") errors.is18 = "you must be 18 or older to join.";
  if (form.get("consent") !== "true") errors.consent = "please agree to be contacted about visits to your city.";
  for (const value of form.values()) if (typeof value !== "string") errors.form = "this form does not accept attachments.";
  return { fields, errors, ok: Object.keys(errors).length === 0 };
}
