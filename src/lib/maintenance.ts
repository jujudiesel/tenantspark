export const URGENCY: Record<string, { label: string; tone: "navy" | "amber" | "gray" }> = {
  emergency: { label: "Emergency", tone: "navy" },
  urgent: { label: "Urgent", tone: "amber" },
  routine: { label: "Routine", tone: "gray" },
};

export const STATUS: Record<string, { label: string; tone: "amber" | "blue" | "gray" | "green" }> = {
  new: { label: "New", tone: "amber" },
  scheduled: { label: "Scheduled", tone: "blue" },
  in_progress: { label: "In progress", tone: "gray" },
  done: { label: "Done", tone: "green" },
  closed: { label: "Closed", tone: "gray" },
};

export const LOCATIONS = ["Kitchen", "Bathroom", "Bedroom", "Living room", "Basement", "Outside", "Shared area", "Somewhere else"];

export function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "photo";
}

export function isImage(file: File) {
  return /^image\/(jpeg|png|webp|heic|heif)$/.test(file.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
}
