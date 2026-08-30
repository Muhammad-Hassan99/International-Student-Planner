import { z } from "zod";

export const getUniversityInfoSchema = z.object({
    country: z.string().trim().min(1),
    university: z.string().trim().min(1),
});

export type UniversityInfoInput = z.infer<typeof getUniversityInfoSchema>;

export type UniversityInfo = {
    university: string;
    country: string;
    location: string;
    programs: string[];
    estimatedTuition: string;
};

const UNIVERSITY_INFO: Record<string, UniversityInfo> = {
    "University of Toronto": {
        university: "University of Toronto",
        country: "Canada",
        location: "Toronto, Ontario",
        programs: ["Computer Science", "Business", "Engineering", "Life Sciences"],
        estimatedTuition: "CAD 35,000-65,000 per year",
    },
    "University of Oxford": {
        university: "University of Oxford",
        country: "United Kingdom",
        location: "Oxford, England",
        programs: ["Computer Science", "Law", "Medicine", "Business"],
        estimatedTuition: "GBP 30,000-50,000 per year",
    },
    "Technical University of Munich": {
        university: "Technical University of Munich",
        country: "Germany",
        location: "Munich, Bavaria",
        programs: ["Computer Science", "Engineering", "Natural Sciences", "Management"],
        estimatedTuition: "EUR 0-6,000 per year, depending on program and student status",
    },
};

export function getUniversityInfo(input: UniversityInfoInput): UniversityInfo {
    const knownUniversity = UNIVERSITY_INFO[input.university];
    if (knownUniversity) return knownUniversity;

    return {
        university: input.university,
        country: input.country,
        location: "Location varies by campus; check the university's official website",
        programs: ["Program availability varies; check the official course catalogue"],
        estimatedTuition: "Tuition varies by program and student status; check the official fee schedule",
    };
}

export const getUniversityInfoTool = {
    name: "getUniversityInfo",
    description: "Get structured information about a university, including its location, programs, and estimated tuition.",
    parametersJsonSchema: z.toJSONSchema(getUniversityInfoSchema),
};
