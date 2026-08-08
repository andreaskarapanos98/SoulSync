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
  // Preference-only fields (ignored for about_me questions).
  scoringMechanic?: string;
  canBeDealBreaker?: boolean;
};

function opts(...pairs: [string, string][]) {
  return pairs.map(([value, label]) => ({ value, label }));
}

// ============================================================================
// ABOUT ME — the vocabulary. Every preference question below (except age_range,
// which has no about_me equivalent) reuses these same keys and, where the
// mechanic calls for it, these same option sets.
// ============================================================================
const aboutMeQuestions: SeedQuestion[] = [
  // basics
  { key: "first_name", category: "basics", type: "text", label: "What's your first name?", required: true, order: 1 },
  { key: "date_of_birth", category: "basics", type: "date", label: "What's your date of birth?", required: true, order: 2 },
  { key: "gender", category: "basics", type: "single_select", label: "What's your gender?", required: true, order: 3,
    options: opts(["man", "Man"], ["woman", "Woman"], ["other", "Other"]) },
  { key: "nationality", category: "basics", type: "text", label: "What's your nationality?", required: true, order: 4 },
  { key: "country", category: "basics", type: "text", label: "What country do you live in?", required: true, order: 5 },
  { key: "city", category: "basics", type: "text", label: "What city do you live in?", required: true, order: 6 },
  { key: "languages", category: "basics", type: "multi_select", label: "Which languages do you speak?", order: 7,
    options: opts(["en", "English"], ["el", "Greek"], ["ru", "Russian"], ["fr", "French"], ["de", "German"], ["es", "Spanish"], ["it", "Italian"], ["other", "Other"]) },
  { key: "height_cm", category: "basics", type: "number", label: "What's your height (cm)?", min: 120, max: 230, order: 8 },
  { key: "occupation", category: "basics", type: "text", label: "What's your occupation?", order: 9 },
  { key: "education", category: "basics", type: "single_select", label: "What's your highest level of education?", order: 10,
    options: opts(["high_school", "High school"], ["bachelors", "Bachelor's"], ["masters", "Master's"], ["phd", "PhD"], ["other", "Other"]) },

  // appearance
  { key: "body_type", category: "appearance", type: "single_select", label: "How would you describe your body type?", order: 1,
    options: opts(["slim", "Slim"], ["athletic", "Athletic"], ["average", "Average"], ["muscular", "Muscular"], ["curvy", "Curvy"], ["plus_size", "Plus-size"], ["prefer_not_to_say", "Prefer not to say"]) },
  { key: "fitness_level", category: "appearance", type: "scale", label: "How would you describe your fitness level?", min: 1, max: 10, order: 2 },
  { key: "hair_color", category: "appearance", type: "single_select", label: "What's your natural hair color?", order: 3,
    options: opts(["black", "Black"], ["brown", "Brown"], ["blonde", "Blonde"], ["red", "Red"], ["grey_white", "Grey/White"], ["other", "Other"]) },
  { key: "eye_color", category: "appearance", type: "single_select", label: "What's your eye color?", order: 4,
    options: opts(["brown", "Brown"], ["blue", "Blue"], ["green", "Green"], ["hazel", "Hazel"], ["grey", "Grey"], ["other", "Other"]) },
  { key: "facial_hair", category: "appearance", type: "single_select", label: "What's your facial hair style?", order: 5,
    options: opts(["clean_shaven", "Clean-shaven"], ["stubble", "Stubble"], ["short_beard", "Short beard"], ["long_beard", "Long beard"], ["mustache", "Mustache"], ["other", "Other"], ["not_applicable", "Not applicable"]) },
  { key: "has_tattoos", category: "appearance", type: "single_select", label: "Do you have tattoos?", order: 6,
    options: opts(["none", "None"], ["minimal", "Small/minimal"], ["several", "Several"], ["heavily", "Heavily tattooed"]) },
  { key: "has_piercings", category: "appearance", type: "single_select", label: "Do you have piercings?", order: 7,
    options: opts(["none", "None"], ["minimal", "Minimal"], ["several", "Several"], ["many", "Many"]) },

  // lifestyle
  { key: "smoking", category: "lifestyle", type: "single_select", label: "How often do you smoke?", order: 1,
    options: opts(["never", "Never"], ["occasionally", "Occasionally"], ["regularly", "Regularly"], ["daily", "Daily"]) },
  { key: "alcohol", category: "lifestyle", type: "single_select", label: "How often do you drink alcohol?", order: 2,
    options: opts(["never", "Never"], ["rarely", "Rarely"], ["occasionally", "Occasionally"], ["regularly", "Regularly"], ["frequently", "Frequently"]) },
  { key: "exercise", category: "lifestyle", type: "single_select", label: "How often do you exercise?", order: 3,
    options: opts(["never", "Never"], ["rarely", "Rarely"], ["1_2_week", "1-2 times/week"], ["3_4_week", "3-4 times/week"], ["5plus_week", "5+ times/week"]) },
  { key: "diet", category: "lifestyle", type: "single_select", label: "How would you describe your diet?", order: 4,
    options: opts(["no_restrictions", "No restrictions"], ["vegetarian", "Vegetarian"], ["vegan", "Vegan"], ["pescatarian", "Pescatarian"], ["keto", "Keto"], ["halal", "Halal"], ["other", "Other"]) },
  { key: "travel_frequency", category: "lifestyle", type: "single_select", label: "How often do you travel?", order: 5,
    options: opts(["almost_never", "Almost never"], ["once_year", "Once a year"], ["2_3_year", "2-3 times/year"], ["4_6_year", "4-6 times/year"], ["very_frequently", "Very frequently"]) },
  { key: "pets", category: "lifestyle", type: "multi_select", label: "Do you have pets?", order: 6,
    options: opts(["no_pets", "No pets"], ["dog", "Dog"], ["cat", "Cat"], ["other", "Other"]) },
  { key: "social_lifestyle", category: "lifestyle", type: "single_select", label: "How would you describe your social life?", order: 7,
    options: opts(["almost_always_home", "Almost always at home"], ["mostly_home", "Mostly at home"], ["balanced", "Balanced"], ["very_social", "Very social"], ["extremely_social", "Extremely social"]) },
  { key: "morning_or_night", category: "lifestyle", type: "single_select", label: "When do you feel most energetic?", order: 8,
    options: opts(["morning", "Morning"], ["afternoon", "Afternoon"], ["evening_night", "Evening/night"], ["no_preference", "No preference"]) },

  // personality
  { key: "introvert_extrovert", category: "personality", type: "scale", label: "Introvert (1) to extrovert (10)?", min: 1, max: 10, order: 1 },
  { key: "calm_energetic", category: "personality", type: "scale", label: "Calm (1) to energetic (10)?", min: 1, max: 10, order: 2 },
  { key: "organized_spontaneous", category: "personality", type: "scale", label: "Organized (1) to spontaneous (10)?", min: 1, max: 10, order: 3 },
  { key: "romantic_practical", category: "personality", type: "scale", label: "Practical (1) to romantic (10)?", min: 1, max: 10, order: 4 },
  { key: "risk_taking", category: "personality", type: "scale", label: "How comfortable are you with taking risks?", min: 1, max: 10, order: 5 },
  { key: "communication_style", category: "personality", type: "single_select", label: "How would you describe your communication style?", order: 6,
    options: opts(["direct", "Direct"], ["diplomatic", "Diplomatic/gentle"], ["playful", "Playful"], ["analytical", "Analytical"], ["emotional", "Emotional"], ["reserved", "Reserved"]) },
  { key: "conflict_style", category: "personality", type: "single_select", label: "What do you usually do during an argument?", order: 7,
    options: opts(["talk_it_out", "Talk it out immediately"], ["need_space_first", "Take time to calm down first"], ["seek_compromise", "Look for compromise"], ["avoid", "Avoid confrontation"], ["get_emotional", "Become emotional"]) },
  { key: "need_for_personal_space", category: "personality", type: "scale", label: "How much personal space do you usually need?", min: 1, max: 10, order: 8 },

  // values
  { key: "value_honesty", category: "values", type: "scale", label: "How important is honesty in your relationships?", min: 1, max: 10, order: 1 },
  { key: "religion", category: "values", type: "single_select", label: "What's your religion?", order: 2,
    options: opts(["not_religious", "Not religious"], ["agnostic", "Agnostic"], ["spiritual", "Spiritual"], ["christian", "Christian"], ["muslim", "Muslim"], ["jewish", "Jewish"], ["hindu", "Hindu"], ["buddhist", "Buddhist"], ["other", "Other"], ["prefer_not_to_say", "Prefer not to say"]) },
  { key: "financial_approach", category: "values", type: "single_select", label: "How do you usually approach money?", order: 3,
    options: opts(["save_most", "Save most of it"], ["balanced", "Balanced saving/spending"], ["spend_freely", "Spend freely"], ["invest_regularly", "Invest regularly"], ["extremely_focused", "Extremely financially focused"], ["prefer_not_to_say", "Prefer not to say"]) },

  // relationship_goals
  { key: "relationship_type", category: "relationship_goals", type: "single_select", label: "What type of relationship are you looking for?", required: true, order: 1,
    options: opts(["casual", "Casual dating"], ["dating_with_potential", "Dating with potential for serious"], ["serious", "Serious relationship"], ["marriage", "Marriage"], ["open", "Open relationship"], ["not_sure", "Not sure"]) },
  { key: "wants_children", category: "relationship_goals", type: "single_select", label: "Do you want children?", required: true, order: 2,
    options: opts(["yes", "Yes"], ["no", "No"], ["maybe", "Maybe"], ["already_have", "Already have children"], ["prefer_not_to_say", "Prefer not to say"]) },

  // family
  { key: "has_children", category: "family", type: "single_select", label: "Do you currently have children?", order: 1,
    options: opts(["no", "No"], ["one", "Yes, one"], ["two", "Yes, two"], ["three_plus", "Yes, three or more"], ["prefer_not_to_say", "Prefer not to say"]) },
  { key: "family_importance", category: "family", type: "scale", label: "How important is family in your life?", min: 1, max: 10, order: 2 },
  { key: "living_with_family", category: "family", type: "single_select", label: "Do you currently live with family?", order: 3,
    options: opts(["no", "No"], ["temporarily", "Yes, temporarily"], ["long_term", "Yes, long-term"], ["other", "Other"]) },

  // communication (kept for the emotional_openness dimension carried over from the
  // original questionnaire; personality's conflict_style/communication_style cover the rest)
  { key: "emotional_openness", category: "communication", type: "scale", label: "How emotionally open are you with a partner?", min: 1, max: 10, order: 1 },

  // career
  { key: "career_importance", category: "career", type: "scale", label: "How important is your career to your life?", min: 1, max: 10, order: 1 },
  { key: "ambition", category: "career", type: "scale", label: "How ambitious are you, especially about your career?", min: 1, max: 10, order: 2 },
  { key: "relocation", category: "career", type: "single_select", label: "Would you move to another country for the right relationship?", order: 3,
    options: opts(["definitely", "Definitely"], ["probably", "Probably"], ["maybe", "Maybe"], ["probably_not", "Probably not"], ["definitely_not", "Definitely not"]) },

  // hobbies
  { key: "hobbies", category: "hobbies", type: "multi_select", label: "What do you enjoy doing?", order: 1,
    options: opts(["gym", "Gym"], ["hiking", "Hiking"], ["gaming", "Gaming"], ["cooking", "Cooking"], ["reading", "Reading"], ["movies", "Movies"], ["music", "Music"], ["dancing", "Dancing"], ["photography", "Photography"], ["art", "Art"], ["travelling", "Travelling"], ["sports", "Sports"], ["cars", "Cars"], ["technology", "Technology"], ["fashion", "Fashion"], ["business", "Business"], ["investing", "Investing"], ["nature", "Nature"], ["nightlife", "Nightlife"]) },

  // connection
  { key: "weekend_preference", category: "connection", type: "single_select", label: "What does your ideal weekend look like?", order: 1,
    options: opts(["staying_home", "Staying home"], ["out_with_friends", "Going out with friends"], ["dates", "Going on dates"], ["outdoor_activities", "Outdoor activities"], ["travelling", "Travelling"], ["nightlife", "Partying/nightlife"], ["family_time", "Family time"], ["combination", "A combination"]) },
  { key: "affection_level", category: "connection", type: "scale", label: "How affectionate are you physically?", min: 1, max: 10, order: 2 },
  { key: "quality_time_importance", category: "connection", type: "scale", label: "How important is spending quality time with your partner?", min: 1, max: 10, order: 3 },
  { key: "gifts_importance", category: "connection", type: "scale", label: "How important are gifts (giving/receiving) in a relationship to you?", min: 1, max: 10, order: 4 },
  { key: "humor_style", category: "connection", type: "single_select", label: "How would you describe your sense of humor?", order: 5,
    options: opts(["dry", "Dry"], ["sarcastic", "Sarcastic"], ["playful", "Playful"], ["dark", "Dark"], ["silly", "Silly"], ["intellectual", "Intellectual"], ["romantic", "Romantic"]) },
];

// A "don't care" option appended to mini_scale/relative_self single_select questions so
// the algorithm can treat it as "everyone gets full credit" without special-casing an
// empty value the way ranking/checklist questions do.
const DONT_CARE = { value: "no_preference", label: "I don't care" };

// ============================================================================
// PREFERENCE (Ideal Soulmate) — reuses about_me keys/options wherever a direct
// comparison makes sense. Every question here also needs a `scoringMechanic` telling
// the future compatibility engine how to score it. Ranking questions carry the SAME
// option set as their about_me sibling (rank order captured at answer time, not here).
// Questions with no about_me equivalent worth asking as a preference (name, dob, city,
// occupation) simply have no entry below.
// ============================================================================
const preferenceQuestions: SeedQuestion[] = [
  // basics
  { key: "gender", category: "basics", type: "multi_select", label: "Which genders are you interested in?", required: true, scoringMechanic: "hard_filter", order: 1,
    options: opts(["man", "Man"], ["woman", "Woman"], ["other", "Other"]) },
  { key: "age_range", category: "basics", type: "number_range", label: "What age range are you looking for?", required: true, scoringMechanic: "hard_filter", min: 16, max: 60, order: 2 },
  { key: "country", category: "basics", type: "single_select", label: "Would you like your soulmate to live in your country?", scoringMechanic: "relative_self", order: 3,
    options: opts(["same_country", "Same country as me"], ["anywhere", "Anywhere"]) },
  { key: "languages", category: "basics", type: "multi_select", label: "Which languages would you like your soulmate to speak?", scoringMechanic: "checklist", order: 4,
    options: opts(["en", "English"], ["el", "Greek"], ["ru", "Russian"], ["fr", "French"], ["de", "German"], ["es", "Spanish"], ["it", "Italian"], ["other", "Other"]) },
  { key: "height_cm", category: "basics", type: "single_select", label: "How tall would you prefer your soulmate to be?", scoringMechanic: "relative_self", order: 5,
    options: opts(["taller", "Taller than me"], ["shorter", "Shorter than me"], ["near", "Around my height (±10%)"], ["no_preference", "I don't care"]) },
  { key: "education", category: "basics", type: "single_select", label: "What level of education would you like your soulmate to have?", scoringMechanic: "mini_scale", order: 6,
    options: opts(["high_school", "High school"], ["bachelors", "Bachelor's"], ["masters", "Master's"], ["phd", "PhD"], ["other", "Other"], [DONT_CARE.value, DONT_CARE.label]) },

  // appearance
  { key: "body_type", category: "appearance", type: "single_select", label: "Rank your preferred body types.", scoringMechanic: "ranking", order: 1,
    options: opts(["slim", "Slim"], ["athletic", "Athletic"], ["average", "Average"], ["muscular", "Muscular"], ["curvy", "Curvy"], ["plus_size", "Plus-size"]) },
  { key: "fitness_level", category: "appearance", type: "scale", label: "What fitness level would you like your soulmate to have?", min: 1, max: 10, scoringMechanic: "mini_scale", order: 2 },
  { key: "hair_color", category: "appearance", type: "single_select", label: "Rank your preferred hair colors.", scoringMechanic: "ranking", order: 3,
    options: opts(["black", "Black"], ["brown", "Brown"], ["blonde", "Blonde"], ["red", "Red"], ["grey_white", "Grey/White"], ["other", "Other"]) },
  { key: "eye_color", category: "appearance", type: "single_select", label: "Rank your preferred eye colors.", scoringMechanic: "ranking", order: 4,
    options: opts(["brown", "Brown"], ["blue", "Blue"], ["green", "Green"], ["hazel", "Hazel"], ["grey", "Grey"], ["other", "Other"]) },
  { key: "facial_hair", category: "appearance", type: "single_select", label: "Rank your preferred facial hair styles.", scoringMechanic: "ranking", order: 5,
    options: opts(["clean_shaven", "Clean-shaven"], ["stubble", "Stubble"], ["short_beard", "Short beard"], ["long_beard", "Long beard"], ["mustache", "Mustache"], ["other", "Other"]) },
  { key: "has_tattoos", category: "appearance", type: "single_select", label: "How do you feel about your soulmate having tattoos?", scoringMechanic: "mini_scale", order: 6,
    options: opts(["none", "Prefer none"], ["minimal", "Small/minimal is okay"], ["several", "Several are okay"], ["heavily", "Heavily tattooed is okay"], [DONT_CARE.value, DONT_CARE.label]) },
  { key: "has_piercings", category: "appearance", type: "single_select", label: "How do you feel about your soulmate having piercings?", scoringMechanic: "mini_scale", order: 7,
    options: opts(["none", "Prefer none"], ["minimal", "Minimal is okay"], ["several", "Several are okay"], ["many", "Many are okay"], [DONT_CARE.value, DONT_CARE.label]) },

  // lifestyle
  { key: "smoking", category: "lifestyle", type: "single_select", label: "What smoking habits are acceptable in your soulmate?", scoringMechanic: "mini_scale", canBeDealBreaker: true, order: 1,
    options: opts(["never", "Never"], ["occasionally", "Occasionally"], ["regularly", "Regularly"], ["daily", "Daily"], [DONT_CARE.value, DONT_CARE.label]) },
  { key: "alcohol", category: "lifestyle", type: "single_select", label: "How often would you be comfortable with your soulmate drinking?", scoringMechanic: "mini_scale", order: 2,
    options: opts(["never", "Never"], ["rarely", "Rarely"], ["occasionally", "Occasionally"], ["regularly", "Regularly"], ["frequently", "Frequently"], [DONT_CARE.value, DONT_CARE.label]) },
  { key: "exercise", category: "lifestyle", type: "single_select", label: "What exercise frequency do you prefer in your soulmate?", scoringMechanic: "mini_scale", order: 3,
    options: opts(["never", "Never"], ["rarely", "Rarely"], ["1_2_week", "1-2 times/week"], ["3_4_week", "3-4 times/week"], ["5plus_week", "5+ times/week"], [DONT_CARE.value, DONT_CARE.label]) },
  { key: "diet", category: "lifestyle", type: "single_select", label: "What diet would you prefer your soulmate to follow?", scoringMechanic: "ranking", order: 4,
    options: opts(["no_restrictions", "No restrictions"], ["vegetarian", "Vegetarian"], ["vegan", "Vegan"], ["pescatarian", "Pescatarian"], ["keto", "Keto"], ["halal", "Halal"], ["other", "Other"]) },
  { key: "travel_frequency", category: "lifestyle", type: "single_select", label: "How often would you like your soulmate to travel?", scoringMechanic: "mini_scale", order: 5,
    options: opts(["almost_never", "Almost never"], ["once_year", "Once a year"], ["2_3_year", "2-3 times/year"], ["4_6_year", "4-6 times/year"], ["very_frequently", "Very frequently"], [DONT_CARE.value, DONT_CARE.label]) },
  { key: "pets", category: "lifestyle", type: "multi_select", label: "Which pets are you comfortable with your soulmate having?", scoringMechanic: "checklist", order: 6,
    options: opts(["no_pets", "No pets"], ["dog", "Dog"], ["cat", "Cat"], ["other", "Other"]) },
  { key: "social_lifestyle", category: "lifestyle", type: "single_select", label: "What kind of social lifestyle do you prefer in your soulmate?", scoringMechanic: "mini_scale", order: 7,
    options: opts(["almost_always_home", "Almost always at home"], ["mostly_home", "Mostly at home"], ["balanced", "Balanced"], ["very_social", "Very social"], ["extremely_social", "Extremely social"], [DONT_CARE.value, DONT_CARE.label]) },
  { key: "morning_or_night", category: "lifestyle", type: "single_select", label: "What would you prefer your soulmate to be?", scoringMechanic: "mini_scale", order: 8,
    options: opts(["morning", "Morning person"], ["night", "Night person"], ["either", "Either"]) },

  // personality
  { key: "introvert_extrovert", category: "personality", type: "scale", label: "Introvert (1) to extrovert (10) — what's your preference?", min: 1, max: 10, scoringMechanic: "mini_scale", order: 1 },
  { key: "calm_energetic", category: "personality", type: "scale", label: "Calm (1) to energetic (10) — what's your preference?", min: 1, max: 10, scoringMechanic: "mini_scale", order: 2 },
  { key: "organized_spontaneous", category: "personality", type: "scale", label: "Organized (1) to spontaneous (10) — what's your preference?", min: 1, max: 10, scoringMechanic: "mini_scale", order: 3 },
  { key: "romantic_practical", category: "personality", type: "scale", label: "Practical (1) to romantic (10) — what's your preference?", min: 1, max: 10, scoringMechanic: "mini_scale", order: 4 },
  { key: "risk_taking", category: "personality", type: "scale", label: "How would you prefer your soulmate to approach risk?", min: 1, max: 10, scoringMechanic: "mini_scale", order: 5 },
  { key: "communication_style", category: "personality", type: "single_select", label: "Rank the communication styles you prefer.", scoringMechanic: "ranking", order: 6,
    options: opts(["direct", "Direct"], ["diplomatic", "Diplomatic/gentle"], ["playful", "Playful"], ["analytical", "Analytical"], ["emotional", "Emotional"], ["reserved", "Reserved"]) },
  { key: "conflict_style", category: "personality", type: "single_select", label: "Rank how you'd prefer your soulmate to handle conflict.", scoringMechanic: "ranking", order: 7,
    options: opts(["talk_it_out", "Talk it out immediately"], ["need_space_first", "Take time to calm down first"], ["seek_compromise", "Look for compromise"], ["avoid", "Avoid confrontation"], ["get_emotional", "Become emotional"]) },
  { key: "need_for_personal_space", category: "personality", type: "scale", label: "How much personal space would you prefer your soulmate to need?", min: 1, max: 10, scoringMechanic: "mini_scale", order: 8 },

  // values
  { key: "value_honesty", category: "values", type: "single_select", label: "How important is honesty in your soulmate?", scoringMechanic: "filler", order: 1,
    options: opts(["not_important", "Not important"], ["somewhat_important", "Somewhat important"], ["important", "Important"], ["very_important", "Very important"], ["non_negotiable", "Non-negotiable"]) },
  { key: "religion", category: "values", type: "single_select", label: "Rank your preference on your soulmate's religion.", scoringMechanic: "ranking", canBeDealBreaker: true, order: 2,
    options: opts(["not_religious", "Not religious"], ["agnostic", "Agnostic"], ["spiritual", "Spiritual"], ["christian", "Christian"], ["muslim", "Muslim"], ["jewish", "Jewish"], ["hindu", "Hindu"], ["buddhist", "Buddhist"], ["other", "Other"]) },
  { key: "financial_approach", category: "values", type: "single_select", label: "Rank how you'd prefer your soulmate to approach money.", scoringMechanic: "ranking", order: 3,
    options: opts(["save_most", "Save most of it"], ["balanced", "Balanced saving/spending"], ["spend_freely", "Spend freely"], ["invest_regularly", "Invest regularly"], ["extremely_focused", "Extremely financially focused"]) },

  // relationship_goals
  { key: "relationship_type", category: "relationship_goals", type: "single_select", label: "Rank the relationship types you're looking for.", required: true, scoringMechanic: "ranking", canBeDealBreaker: true, order: 1,
    options: opts(["casual", "Casual dating"], ["dating_with_potential", "Dating with potential for serious"], ["serious", "Serious relationship"], ["marriage", "Marriage"], ["open", "Open relationship"]) },
  { key: "wants_children", category: "relationship_goals", type: "single_select", label: "What would you prefer regarding children?", required: true, scoringMechanic: "mini_scale", canBeDealBreaker: true, order: 2,
    options: opts(["must_not_want", "Must not want children"], ["prefer_not_want", "Prefer doesn't want children"], ["doesnt_matter", "Doesn't matter"], ["prefer_want", "Prefer wants children"], ["must_want", "Must want children"]) },

  // family
  { key: "has_children", category: "family", type: "single_select", label: "Rank your preference on your soulmate already having children.", scoringMechanic: "ranking", canBeDealBreaker: true, order: 1,
    options: opts(["no", "No children"], ["one", "One is okay"], ["two", "Two is okay"], ["three_plus", "Three or more is okay"], ["doesnt_matter", "Doesn't matter"]) },
  { key: "family_importance", category: "family", type: "scale", label: "How important would you like family to be to your soulmate?", min: 1, max: 10, scoringMechanic: "mini_scale", order: 2 },
  { key: "living_with_family", category: "family", type: "single_select", label: "How would you feel about your soulmate living with family?", scoringMechanic: "filler", order: 3,
    options: opts(["prefer_not", "Prefer they don't"], ["temporarily_ok", "Temporarily is okay"], ["long_term_ok", "Long-term is okay"], ["doesnt_matter", "Doesn't matter"]) },

  // communication
  { key: "emotional_openness", category: "communication", type: "scale", label: "How emotionally open would you like your soulmate to be?", min: 1, max: 10, scoringMechanic: "mini_scale", order: 1 },

  // career
  { key: "career_importance", category: "career", type: "scale", label: "How important would you prefer your soulmate's career to be to them?", min: 1, max: 10, scoringMechanic: "mini_scale", order: 1 },
  { key: "ambition", category: "career", type: "scale", label: "How ambitious would you prefer your soulmate to be?", min: 1, max: 10, scoringMechanic: "mini_scale", order: 2 },
  { key: "relocation", category: "career", type: "single_select", label: "How important is it that your soulmate is willing to relocate?", scoringMechanic: "mini_scale", order: 3,
    options: opts(["definitely", "Definitely willing"], ["probably", "Probably willing"], ["maybe", "Maybe willing"], ["probably_not", "Probably not willing"], ["definitely_not", "Definitely not willing"]) },

  // hobbies — low-signal by design; kept out of any future high-weight category.
  { key: "hobbies", category: "hobbies", type: "multi_select", label: "Which interests would you like your soulmate to share?", scoringMechanic: "checklist", order: 1,
    options: opts(["gym", "Gym"], ["hiking", "Hiking"], ["gaming", "Gaming"], ["cooking", "Cooking"], ["reading", "Reading"], ["movies", "Movies"], ["music", "Music"], ["dancing", "Dancing"], ["photography", "Photography"], ["art", "Art"], ["travelling", "Travelling"], ["sports", "Sports"], ["cars", "Cars"], ["technology", "Technology"], ["fashion", "Fashion"], ["business", "Business"], ["investing", "Investing"], ["nature", "Nature"], ["nightlife", "Nightlife"]) },

  // connection
  { key: "weekend_preference", category: "connection", type: "single_select", label: "Rank your preferred soulmate's ideal weekend.", scoringMechanic: "ranking", order: 1,
    options: opts(["staying_home", "Staying home"], ["out_with_friends", "Going out with friends"], ["dates", "Going on dates"], ["outdoor_activities", "Outdoor activities"], ["travelling", "Travelling"], ["nightlife", "Partying/nightlife"], ["family_time", "Family time"], ["combination", "A combination"]) },
  { key: "affection_level", category: "connection", type: "scale", label: "How physically affectionate would you prefer your soulmate to be?", min: 1, max: 10, scoringMechanic: "mini_scale", order: 2 },
  { key: "quality_time_importance", category: "connection", type: "scale", label: "How important should quality time be to your soulmate?", min: 1, max: 10, scoringMechanic: "mini_scale", order: 3 },
  { key: "gifts_importance", category: "connection", type: "scale", label: "How important should gifts be to your soulmate?", min: 1, max: 10, scoringMechanic: "mini_scale", order: 4 },
  { key: "humor_style", category: "connection", type: "single_select", label: "Rank your preferred sense of humor in a soulmate.", scoringMechanic: "ranking", order: 5,
    options: opts(["dry", "Dry"], ["sarcastic", "Sarcastic"], ["playful", "Playful"], ["dark", "Dark"], ["silly", "Silly"], ["intellectual", "Intellectual"], ["romantic", "Romantic"]) },
];

async function main() {
  await mongoose.connect(env.mongoUri);

  const total = aboutMeQuestions.length + preferenceQuestions.length;
  console.log(`Connected to ${mongoose.connection.name}, seeding ${total} questions...`);

  const aboutMeKeys = aboutMeQuestions.map((q) => q.key);
  const preferenceKeys = preferenceQuestions.map((q) => q.key);

  // Deactivate anything from a previous seed run that's no longer in this list (e.g.
  // value_family, value_ambition — merged into family_importance/ambition; questions we
  // dropped like value_financial_responsibility, occupation preference, city preference).
  await QuestionDefinitionModel.updateMany(
    { appliesTo: "about_me", key: { $nin: aboutMeKeys } },
    { $set: { active: false } },
  );
  await QuestionDefinitionModel.updateMany(
    { appliesTo: "preference", key: { $nin: preferenceKeys } },
    { $set: { active: false } },
  );

  for (const q of aboutMeQuestions) {
    await QuestionDefinitionModel.updateOne(
      { key: q.key, appliesTo: "about_me" },
      { $set: { ...q, appliesTo: "about_me", active: true } },
      { upsert: true },
    );
  }

  for (const q of preferenceQuestions) {
    await QuestionDefinitionModel.updateOne(
      { key: q.key, appliesTo: "preference" },
      { $set: { ...q, appliesTo: "preference", active: true } },
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
