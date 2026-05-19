---
name: resume-builder
description: Build professional resumes and CVs using native Python libraries. Use when users ask to create a resume, CV, curriculum, professional document, or need to convert resume data into formatted output files (DOCX, PDF, HTML). Also use when users provide resume data/text and want it professionally formatted, or when they want resume templates, styles, or want to export/generate a resume from structured data. This skill does NOT use AI to write content — it focuses purely on formatting, layout, and generation using document libraries.
---

# Resume Builder

A skill for generating professional resumes and CVs using native Python document libraries — no AI content generation.

## Core Philosophy

This skill takes **structured resume data** (provided by the user or extracted from existing files) and transforms it into beautifully formatted professional documents. The skill handles:
- Layout and typography
- Section organization
- Output format conversion (DOCX, PDF, HTML)
- Template selection and styling

**What this skill does NOT do**: Write resume content, suggest job descriptions, or generate professional summaries. Those tasks require human input or a separate writing tool.

## Output Formats

| Format | Library | Best For |
|--------|---------|----------|
| DOCX | `python-docx` | Editable resumes, ATS systems |
| PDF | `reportlab` or `weasyprint` | Print-ready, sharing |
| HTML | Built-in templating | Web publishing |

## The Workflow

### Step 1: Gather Resume Data

Collect the user's resume information. Ask for:
1. **Personal Info**: Name, email, phone, location, LinkedIn, portfolio URL
2. **Professional Summary**: 2-3 sentence overview (user provides this)
3. **Work Experience**: Company, title, dates, bullet points (user provides)
4. **Education**: Institution, degree, dates, honors (optional)
5. **Skills**: Technical skills, languages, certifications
6. **Additional Sections**: Projects, publications, volunteer work, etc.

If the user has an existing resume (PDF, DOCX, or plain text), offer to parse it first to extract the data structure.

### Step 2: Choose Output Format

Ask the user which format they need:
- **DOCX**: Most compatible, ATS-friendly, editable
- **PDF**: Professional printout, can't be edited
- **HTML**: For web portfolios or email

### Step 3: Select Template/Style

Offer template categories:

**Classic/Traditional**: Clean serif fonts, simple layout, conservative spacing. Best for: corporate, legal, finance, academia.

**Modern/Sleek**: Sans-serif fonts, bold headers, creative whitespace. Best for: tech, startups, design, marketing.

**Minimalist**: Extreme simplicity, lots of white space, subtle typography. Best for: creative roles, portfolio careers.

**Two-Column**: Left sidebar with skills/education, main column for experience. Best for: career changers, mixed experience.

### Step 4: Generate the Document

Use the appropriate script based on format and template choice.

---

## Available Scripts

### `scripts/cli.ts`

Unified CLI for generating resumes in any format.

**Usage:**
```bash
npx ts-node scripts/cli.ts --data resume_data.json --format docx --template modern --output resume.docx
```

**Arguments:**
- `--data, -d`: Path to JSON file with resume data (required)
- `--format, -f`: Output format: `docx`, `html`, `pdf` (default: docx)
- `--template, -t`: Template style: `classic`, `modern`, `minimal`, `two-column` (default: modern)
- `--output, -o`: Output file path (default: auto-generated)

### `scripts/createDocx.ts`

Generates a formatted DOCX resume using the `docx` library.

**Usage:**
```typescript
import { generateDocxResume } from './createDocx';

await generateDocxResume(resumeData, 'modern', 'resume.docx');
```

### `scripts/createHtml.ts`

Generates a standalone HTML resume with embedded CSS.

**Usage:**
```typescript
import { generateHtmlResume } from './createHtml';

generateHtmlResume(resumeData, 'modern', 'resume.html');
```

### PDF Generation

For PDF output, generate HTML first then convert using browser print or tools like `puppeteer`, `weasyprint`, or `wkhtmltopdf`.

---

## Resume Data Schema

Save resume data as JSON with this structure:

```json
{
  "personal": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1 (555) 123-4567",
    "location": "San Francisco, CA",
    "linkedin": "linkedin.com/in/janesmith",
    "url": "janesmith.dev",
    "summary": "Senior software engineer with 8+ years of experience..."
  },
  "experience": [
    {
      "company": "Tech Corp",
      "title": "Senior Engineer",
      "location": "San Francisco, CA",
      "start_date": "2020-01",
      "end_date": "present",
      "highlights": [
        "Led team of 5 engineers building microservices architecture",
        "Reduced deployment time by 60% through CI/CD improvements",
        "Mentored junior developers and conducted code reviews"
      ]
    }
  ],
  "education": [
    {
      "institution": "Stanford University",
      "degree": "M.S. Computer Science",
      "start_date": "2012-09",
      "end_date": "2014-06",
      "gpa": "3.9",
      "honors": "Phi Beta Kappa"
    }
  ],
  "skills": {
    "languages": ["Python", "Go", "TypeScript"],
    "frameworks": ["React", "FastAPI", "Docker"],
    "tools": ["AWS", "Kubernetes", "PostgreSQL"],
    "soft_skills": ["Team leadership", "Agile/Scrum", "Technical writing"]
  },
  "projects": [
    {
      "name": "Open Source CLI Tool",
      "description": "A command-line tool for developer productivity",
      "technologies": ["Python", "Click", "Docker"],
      "url": "github.com/jane/tool"
    }
  ],
  "certifications": [
    {"name": "AWS Solutions Architect", "date": "2023"}
  ]
}
```

---

## Template Customization

### Classic Template

- Font: Times New Roman or Georgia
- Section headers: 14pt, bold, underline
- Body: 11pt, single-spaced
- Margins: 1 inch all sides
- Section spacing: 12pt before, 6pt after

### Modern Template

- Font: Calibri, Arial, or Helvetica
- Section headers: 13pt, bold, accent color (#2C5282)
- Body: 11pt
- Margins: 0.75 inch sides, 0.5 inch top/bottom
- Accent: thin colored line under name header
- Two-column skills layout option

### Minimal Template

- Font: Helvetica or Arial Light
- Section headers: 12pt, light weight, uppercase, letter-spacing
- Body: 10pt, generous line-height (1.5)
- Margins: 1.25 inches all sides
- No borders, dividers, or decorative elements

### Two-Column Template

- Left column (30% width): Skills, Education, Certifications
- Right column (70% width): Summary, Experience, Projects
- Colored sidebar with subtle background
- Matching accent color for headers

---

## Best Practices

1. **Keep it to 1-2 pages**: Ask the user to prioritize content. If experience exceeds page limit, suggest condensing bullet points or removing older roles.

2. **ATS Compatibility**: For DOCX output, use standard heading styles, avoid tables/columns in critical sections, and keep formatting simple. Offer ATS-specific tips.

3. **Consistent formatting**: Dates aligned right, company names bold, job titles italicized. All dates in same format (Month Year).

4. **Quantify when possible**: If the user provides metrics (%, $, time saved), ensure they're prominently displayed in bullet points.

5. **Handle gaps gracefully**: If employment dates are missing, leave as "Present" or omit end date rather than showing zeros.

---

## Dependencies

Required npm packages for TypeScript scripts:
```bash
npm install docx
npm install -D @types/node ts-node typescript
```

The `docx` library handles DOCX generation. HTML output requires no external dependencies. For PDF, use browser printing or external tools like `puppeteer`.

---

## Error Handling

If the user provides incomplete data:
- Prompt for missing required fields (name, at least one work experience or education)
- Offer to create a template with placeholders they can fill in
- Generate partial resume with warnings about missing sections

If parsing fails:
- Explain what went wrong
- Offer manual data entry as fallback
- Provide the JSON schema so user can fill it manually

---

## Examples

**Example 1: Complete flow with provided data**
```
User: "Create a professional resume for me"
Assistant: [Gathers data via questions, then generates DOCX]
```

**Example 2: From existing file**
```
User: "I have my resume as a PDF, make it look more modern"
Assistant: [Parses PDF, lets user review extracted data, generates HTML with modern template]
```

**Example 3: Template switch**
```
User: "I have resume_data.json, generate both a classic DOCX and modern HTML version"
Assistant: [Runs both generators, provides both files]
```

---

## Tips for Different Industries

**Tech/Software**: Modern template, skills section prominently displayed, GitHub/portfolio links, certifications.

**Finance/Law**: Classic template, education prominent, professional summary, conservative formatting.

**Creative/Design**: Minimal or custom template, visual hierarchy, portfolio links, projects section.

**Academia**: Extended CV format (multiple pages OK), publications, research experience, conference presentations.
