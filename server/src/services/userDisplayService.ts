import { AboutMeAnswerModel } from "../models/AboutMeAnswer.js";
import { ProfileModel } from "../models/Profile.js";

export function nameAndPhotoFrom(
  answers: Record<string, unknown>,
  profile: { photos: { url: string; isPrimary: boolean }[] } | null,
) {
  const photo = profile?.photos.find((p) => p.isPrimary) ?? profile?.photos[0];
  return {
    firstName: (answers.first_name as string) ?? "",
    photoUrl: photo?.url as string | undefined,
  };
}

export async function firstNameAndPhoto(clerkId: string) {
  // Not .lean() on the about_me doc — `answers` is a Mongoose Map, and Object.fromEntries
  // needs the real Map (lean() strips it down to a plain object with no entries() iterator).
  const [aboutMe, profile] = await Promise.all([
    AboutMeAnswerModel.findOne({ clerkId }),
    ProfileModel.findOne({ clerkId }).lean(),
  ]);
  const answers = aboutMe ? Object.fromEntries(aboutMe.answers) : {};
  return nameAndPhotoFrom(answers, profile);
}
