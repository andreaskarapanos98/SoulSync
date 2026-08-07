import mongoose from "mongoose";
import { env } from "../config/env.js";
import { QuestionDefinitionModel } from "../models/QuestionDefinition.js";

type SeedQuestion = {
  key: string;
  category: string;
  type: string;
  label: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  required?: boolean;
  order: number;
};

function opts(...pairs: [string, string][]) {
  return pairs.map(([value, label]) => ({ value, label }));
}

// appliesTo: "about_me" for all of these — Phase 3 adds "preference" questions
// into this same collection, reusing this system without any schema change.
const questions: SeedQuestion[] = [
  // basics
  { key: "first_name", category: "basics", type: "text", label: "What's your first name?", required: true, order: 1 },
  { key: "date_of_birth", category: "basics", type: "date", label: "What's your date of birth?", required: true, order: 2 },
  {
    key: "gender", category: "basics", type: "single_select", label: "What's your gender?", required: true, order: 3,
    options: opts(["woman", "Woman"], ["man", "Man"], ["non_binary", "Non-binary"]),
  },
  { key: "nationality", category: "basics", type: "text", label: "What's your nationality?", required: true, order: 4 },
  { key: "country", category: "basics", type: "text", label: "What country do you live in?", required: true, order: 5 },
  { key: "city", category: "basics", type: "text", label: "What city do you live in?", required: true, order: 6 },
  { key: "languages", category: "basics", type: "multi_select", label: "Which languages do you speak?", order: 7,
    options: opts(["en", "English"], ["el", "Greek"], ["fr", "French"], ["de", "German"], ["es", "Spanish"], ["other", "Other"]) },
  { key: "height_cm", category: "basics", type: "number", label: "What's your height (cm)?", min: 120, max: 230, order: 8 },
  { key: "occupation", category: "basics", type: "text", label: "What's your occupation?", order: 9 },
  { key: "education", category: "basics", type: "single_select", label: "What's your highest level of education?", order: 10,
    options: opts(["high_school", "High school"], ["bachelors", "Bachelor's"], ["masters", "Master's"], ["phd", "PhD"], ["other", "Other"]) },

  // appearance
  { key: "hair_color", category: "appearance", type: "single_select", label: "What's your hair color?", order: 1,
    options: opts(["black", "Black"], ["brown", "Brown"], ["blonde", "Blonde"], ["red", "Red"], ["grey", "Grey"], ["other", "Other"]) },
  { key: "eye_color", category: "appearance", type: "single_select", label: "What's your eye color?", order: 2,
    options: opts(["brown", "Brown"], ["blue", "Blue"], ["green", "Green"], ["hazel", "Hazel"], ["other", "Other"]) },
  { key: "body_type", category: "appearance", type: "single_select", label: "How would you describe your body type?", order: 3,
    options: opts(["slim", "Slim"], ["athletic", "Athletic"], ["average", "Average"], ["curvy", "Curvy"], ["plus_size", "Plus size"]) },
  { key: "fitness_level", category: "appearance", type: "scale", label: "How would you rate your fitness level?", min: 1, max: 5, order: 4 },
  { key: "has_tattoos", category: "appearance", type: "single_select", label: "Do you have tattoos?", order: 5,
    options: opts(["none", "None"], ["some", "Some"], ["a_lot", "A lot"]) },
  { key: "has_piercings", category: "appearance", type: "single_select", label: "Do you have piercings?", order: 6,
    options: opts(["none", "None"], ["some", "Some"], ["a_lot", "A lot"]) },

  // lifestyle
  { key: "smoking", category: "lifestyle", type: "single_select", label: "Do you smoke?", order: 1,
    options: opts(["never", "Never"], ["socially", "Socially"], ["regularly", "Regularly"]) },
  { key: "alcohol", category: "lifestyle", type: "single_select", label: "Do you drink alcohol?", order: 2,
    options: opts(["never", "Never"], ["socially", "Socially"], ["regularly", "Regularly"]) },
  { key: "exercise", category: "lifestyle", type: "single_select", label: "How often do you exercise?", order: 3,
    options: opts(["never", "Never"], ["sometimes", "Sometimes"], ["often", "Often"], ["daily", "Daily"]) },
  { key: "diet", category: "lifestyle", type: "single_select", label: "What best describes your diet?", order: 4,
    options: opts(["omnivore", "Omnivore"], ["vegetarian", "Vegetarian"], ["vegan", "Vegan"], ["pescatarian", "Pescatarian"], ["other", "Other"]) },
  { key: "travel_frequency", category: "lifestyle", type: "single_select", label: "How often do you travel?", order: 5,
    options: opts(["rarely", "Rarely"], ["sometimes", "Sometimes"], ["often", "Often"]) },
  { key: "pets", category: "lifestyle", type: "single_select", label: "Do you have pets?", order: 6,
    options: opts(["none", "None"], ["dog", "Dog"], ["cat", "Cat"], ["other", "Other"], ["multiple", "Multiple"]) },
  { key: "social_lifestyle", category: "lifestyle", type: "scale", label: "How social would you say you are?", min: 1, max: 5, order: 7 },
  { key: "morning_or_night", category: "lifestyle", type: "single_select", label: "Are you a morning or night person?", order: 8,
    options: opts(["morning", "Morning person"], ["night", "Night person"], ["either", "Either"]) },

  // personality
  { key: "introvert_extrovert", category: "personality", type: "scale", label: "Introvert (1) to extrovert (5)?", min: 1, max: 5, order: 1 },
  { key: "calm_energetic", category: "personality", type: "scale", label: "Calm (1) to energetic (5)?", min: 1, max: 5, order: 2 },
  { key: "organized_spontaneous", category: "personality", type: "scale", label: "Organized (1) to spontaneous (5)?", min: 1, max: 5, order: 3 },
  { key: "romantic_practical", category: "personality", type: "scale", label: "Romantic (1) to practical (5)?", min: 1, max: 5, order: 4 },
  { key: "risk_taking", category: "personality", type: "scale", label: "Cautious (1) to risk-taking (5)?", min: 1, max: 5, order: 5 },
  { key: "communication_style", category: "personality", type: "single_select", label: "How would you describe your communication style?", order: 6,
    options: opts(["direct", "Direct"], ["diplomatic", "Diplomatic"], ["reserved", "Reserved"], ["expressive", "Expressive"]) },

  // values
  { key: "value_honesty", category: "values", type: "scale", label: "How important is honesty to you?", min: 1, max: 5, order: 1 },
  { key: "value_family", category: "values", type: "scale", label: "How important is family to you?", min: 1, max: 5, order: 2 },
  { key: "value_ambition", category: "values", type: "scale", label: "How important is ambition to you?", min: 1, max: 5, order: 3 },
  { key: "value_financial_responsibility", category: "values", type: "scale", label: "How important is financial responsibility to you?", min: 1, max: 5, order: 4 },
  { key: "religion", category: "values", type: "single_select", label: "What's your relationship with religion?", order: 5,
    options: opts(["not_religious", "Not religious"], ["spiritual", "Spiritual"], ["religious", "Religious"], ["prefer_not_to_say", "Prefer not to say"]) },

  // relationship_goals
  { key: "relationship_type", category: "relationship_goals", type: "single_select", label: "What are you looking for?", required: true, order: 1,
    options: opts(["casual", "Casual dating"], ["serious", "Serious relationship"], ["marriage", "Marriage"]) },
  { key: "wants_children", category: "relationship_goals", type: "single_select", label: "Do you want children?", required: true, order: 2,
    options: opts(["yes", "Yes"], ["no", "No"], ["unsure", "Unsure"], ["have_and_want_more", "Have children, want more"]) },

  // family
  { key: "has_children", category: "family", type: "single_select", label: "Do you already have children?", order: 1,
    options: opts(["no", "No"], ["yes_living_with_me", "Yes, living with me"], ["yes_not_living_with_me", "Yes, not living with me"]) },
  { key: "family_importance", category: "family", type: "scale", label: "How important is your relationship with your family?", min: 1, max: 5, order: 2 },

  // communication
  { key: "conflict_style", category: "communication", type: "single_select", label: "How do you typically handle conflict?", order: 1,
    options: opts(["talk_it_out", "Talk it out immediately"], ["need_space_first", "Need space first"], ["avoid", "Tend to avoid it"]) },
  { key: "emotional_openness", category: "communication", type: "scale", label: "How emotionally open are you with a partner?", min: 1, max: 5, order: 2 },
  { key: "need_for_personal_space", category: "communication", type: "scale", label: "How much personal space do you need?", min: 1, max: 5, order: 3 },
];

async function main() {
  await mongoose.connect(env.mongoUri);
  console.log(`Connected to ${mongoose.connection.name}, seeding ${questions.length} questions...`);

  for (const q of questions) {
    await QuestionDefinitionModel.updateOne(
      { key: q.key },
      { $set: { ...q, appliesTo: "about_me", active: true } },
      { upsert: true },
    );
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
