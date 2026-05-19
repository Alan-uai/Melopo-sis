export interface PersonalInfo {
  name: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  url?: string;
  summary?: string;
}

export interface Experience {
  company: string;
  title: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  highlights: string[];
}

export interface Education {
  institution: string;
  degree: string;
  start_date?: string;
  end_date?: string;
  gpa?: string;
  honors?: string;
}

export interface Skills {
  languages?: string[];
  frameworks?: string[];
  tools?: string[];
  soft_skills?: string[];
}

export interface Project {
  name: string;
  description?: string;
  technologies?: string[];
  url?: string;
}

export interface Certification {
  name: string;
  date?: string;
}

export interface ResumeData {
  personal: PersonalInfo;
  experience?: Experience[];
  education?: Education[];
  skills?: Skills;
  projects?: Project[];
  certifications?: Certification[];
}

export type TemplateStyle = 'classic' | 'modern' | 'minimal' | 'two-column';

export interface TemplateConfig {
  font: string;
  headerColor: string;
  sectionColor: string;
  headerSize: number;
  sectionSize: number;
  bodySize: number;
  lineSpacing: number;
  margins: { top: number; right: number; bottom: number; left: number };
}

export const TEMPLATES: Record<TemplateStyle, TemplateConfig> = {
  classic: {
    font: 'Times New Roman',
    headerColor: '#000000',
    sectionColor: '#000000',
    headerSize: 16,
    sectionSize: 13,
    bodySize: 11,
    lineSpacing: 1.15,
    margins: { top: 72, right: 72, bottom: 72, left: 72 },
  },
  modern: {
    font: 'Calibri',
    headerColor: '#2C5282',
    sectionColor: '#2C5282',
    headerSize: 18,
    sectionSize: 12,
    bodySize: 10.5,
    lineSpacing: 1.15,
    margins: { top: 36, right: 54, bottom: 36, left: 54 },
  },
  minimal: {
    font: 'Arial',
    headerColor: '#3C3C3C',
    sectionColor: '#505050',
    headerSize: 14,
    sectionSize: 10,
    bodySize: 10,
    lineSpacing: 1.5,
    margins: { top: 72, right: 72, bottom: 72, left: 72 },
  },
  'two-column': {
    font: 'Arial',
    headerColor: '#2C5282',
    sectionColor: '#2C5282',
    headerSize: 16,
    sectionSize: 11,
    bodySize: 10,
    lineSpacing: 1.2,
    margins: { top: 36, right: 36, bottom: 36, left: 36 },
  },
};
