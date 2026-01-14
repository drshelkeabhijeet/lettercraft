import AsyncStorage from "@react-native-async-storage/async-storage";

export interface StyleProfile {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  sampleCount: number;
}

export interface Letterhead {
  id: string;
  name: string;
  imageUri: string;
  createdAt: string;
}

export interface GeneratedLetter {
  id: string;
  content: string;
  profileId: string;
  instructions: string;
  createdAt: string;
}

const PROFILES_KEY = "@lettercraft:profiles";
const LETTERHEADS_KEY = "@lettercraft:letterheads";
const LETTERS_KEY = "@lettercraft:letters";
const SELECTED_PROFILE_KEY = "@lettercraft:selectedProfile";
const SELECTED_LETTERHEAD_KEY = "@lettercraft:selectedLetterhead";

export async function getProfiles(): Promise<StyleProfile[]> {
  try {
    const data = await AsyncStorage.getItem(PROFILES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get profiles:", error);
    return [];
  }
}

export async function saveProfile(profile: StyleProfile): Promise<void> {
  const profiles = await getProfiles();
  profiles.push(profile);
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export async function deleteProfile(id: string): Promise<void> {
  const profiles = await getProfiles();
  const filtered = profiles.filter((p) => p.id !== id);
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(filtered));
}

export async function getSelectedProfile(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SELECTED_PROFILE_KEY);
  } catch {
    return null;
  }
}

export async function setSelectedProfile(id: string): Promise<void> {
  await AsyncStorage.setItem(SELECTED_PROFILE_KEY, id);
}

export async function getLetterheads(): Promise<Letterhead[]> {
  try {
    const data = await AsyncStorage.getItem(LETTERHEADS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get letterheads:", error);
    return [];
  }
}

export async function saveLetterhead(letterhead: Letterhead): Promise<void> {
  const letterheads = await getLetterheads();
  letterheads.push(letterhead);
  await AsyncStorage.setItem(LETTERHEADS_KEY, JSON.stringify(letterheads));
}

export async function deleteLetterhead(id: string): Promise<void> {
  const letterheads = await getLetterheads();
  const filtered = letterheads.filter((l) => l.id !== id);
  await AsyncStorage.setItem(LETTERHEADS_KEY, JSON.stringify(filtered));
}

export async function getSelectedLetterhead(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(SELECTED_LETTERHEAD_KEY);
  } catch {
    return null;
  }
}

export async function setSelectedLetterhead(id: string | null): Promise<void> {
  if (id) {
    await AsyncStorage.setItem(SELECTED_LETTERHEAD_KEY, id);
  } else {
    await AsyncStorage.removeItem(SELECTED_LETTERHEAD_KEY);
  }
}

export async function getLetters(): Promise<GeneratedLetter[]> {
  try {
    const data = await AsyncStorage.getItem(LETTERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get letters:", error);
    return [];
  }
}

export async function saveLetter(letter: GeneratedLetter): Promise<void> {
  const letters = await getLetters();
  letters.unshift(letter);
  await AsyncStorage.setItem(LETTERS_KEY, JSON.stringify(letters));
}

export function generateMockLetter(instructions: string, profileName: string): string {
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const templates = [
    `${date}

To Whom It May Concern,

${instructions}

We write to formally address the matter described above. In accordance with standard protocol and established procedures, we wish to convey our position clearly and comprehensively.

After careful consideration of all relevant factors, we have determined that the appropriate course of action aligns with organizational guidelines and best practices.

We remain committed to maintaining the highest standards of professionalism and look forward to a favorable resolution of this matter.

Should you require any additional information or clarification, please do not hesitate to contact our office at your earliest convenience.

Respectfully,

[Your Name]
[Title/Position]`,

    `${date}

Dear Sir/Madam,

Subject: ${instructions}

I am writing to bring to your attention the matter referenced above. This correspondence serves as an official communication regarding the stated subject.

Upon thorough review of the circumstances, it has become evident that certain actions must be undertaken to ensure proper resolution. We have evaluated all available options and selected the most appropriate path forward.

Your prompt attention to this matter would be greatly appreciated. We trust that you will give this communication the consideration it deserves.

Thank you for your cooperation and understanding.

Yours faithfully,

[Your Name]
[Department]`,

    `${date}

RE: ${instructions}

Dear Concerned Party,

This letter serves as formal documentation regarding the subject matter indicated above. We acknowledge the importance of this communication and have given it our full attention.

Based on our assessment of the current situation, we have formulated a comprehensive response that addresses all pertinent aspects. Our approach has been guided by established protocols and a commitment to excellence.

We appreciate your patience as we work to resolve this matter. Please be assured that we are fully dedicated to achieving a satisfactory outcome for all parties involved.

For any questions or concerns, please contact the undersigned.

With regards,

[Your Name]
[Contact Information]`,
  ];

  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  return randomTemplate;
}
