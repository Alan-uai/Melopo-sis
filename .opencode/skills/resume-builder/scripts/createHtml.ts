import fs from 'fs';
import {
  ResumeData,
  TemplateStyle,
  TEMPLATES,
} from './types';

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  if (dateStr === 'present') return 'Present';
  
  const [year, month] = dateStr.split('-');
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  
  const monthIndex = parseInt(month, 10) - 1;
  if (month && monthIndex >= 0 && monthIndex <= 11) {
    return `${months[monthIndex]} ${year}`;
  }
  return dateStr;
}

function generateCSS(style: TemplateStyle): string {
  const config = TEMPLATES[style];
  
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: '${config.font}', Arial, sans-serif;
      font-size: ${config.bodySize}px;
      line-height: ${config.lineSpacing};
      color: #333;
      max-width: 850px;
      margin: 0 auto;
      padding: ${config.margins.top / 4}px ${config.margins.right / 4}px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .name {
      font-size: ${config.headerSize}px;
      font-weight: bold;
      color: ${config.headerColor};
      margin-bottom: 8px;
    }
    
    .contact-info {
      font-size: ${config.bodySize - 1}px;
      color: ${config.headerColor};
      margin-bottom: 4px;
    }
    
    .contact-info span {
      margin: 0 8px;
    }
    
    .section {
      margin-bottom: 16px;
    }
    
    .section-title {
      font-size: ${config.sectionSize}px;
      font-weight: bold;
      color: ${config.sectionColor};
      border-bottom: 2px solid ${config.sectionColor};
      padding-bottom: 4px;
      margin-bottom: 10px;
      text-transform: uppercase;
    }
    
    .summary {
      text-align: justify;
      margin-bottom: 16px;
    }
    
    .experience-item, .education-item {
      margin-bottom: 12px;
    }
    
    .job-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }
    
    .job-title {
      font-weight: bold;
      font-size: ${config.bodySize}px;
    }
    
    .company {
      font-style: italic;
      font-size: ${config.bodySize}px;
    }
    
    .location {
      font-size: ${config.bodySize - 1}px;
      color: #666;
    }
    
    .date-range {
      font-size: ${config.bodySize - 1}px;
      color: #666;
    }
    
    .highlights {
      margin-left: 16px;
      margin-top: 4px;
    }
    
    .highlights li {
      margin-bottom: 2px;
    }
    
    .skills-category {
      margin-bottom: 4px;
    }
    
    .skills-category strong {
      color: ${config.sectionColor};
    }
    
    .project-item {
      margin-bottom: 8px;
    }
    
    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    
    .project-name {
      font-weight: bold;
    }
    
    .project-url {
      font-size: ${config.bodySize - 1}px;
      color: ${config.headerColor};
    }
    
    .certification-item {
      margin-bottom: 4px;
    }
  `;
}

function generateHTML(data: ResumeData, template: TemplateStyle): string {
  const style = TEMPLATES[template];
  const { personal } = data;

  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${personal.name} - Resume</title>
  <style>
    ${generateCSS(template)}
  </style>
</head>
<body>
  <header class="header">
    <h1 class="name">${personal.name}</h1>
`;

  const contactParts: string[] = [];
  if (personal.email) contactParts.push(personal.email);
  if (personal.phone) contactParts.push(personal.phone);
  if (personal.location) contactParts.push(personal.location);

  if (contactParts.length > 0) {
    html += `    <div class="contact-info">${contactParts.join(' <span>|</span> ')}</div>\n`;
  }

  const linksParts: string[] = [];
  if (personal.linkedin) linksParts.push(`LinkedIn: ${personal.linkedin}`);
  if (personal.url) linksParts.push(`Portfolio: ${personal.url}`);

  if (linksParts.length > 0) {
    html += `    <div class="contact-info">${linksParts.join(' <span>|</span> ')}</div>\n`;
  }

  html += `  </header>\n`;

  if (personal.summary) {
    html += `
  <section class="section">
    <div class="summary">${personal.summary}</div>
  </section>
`;
  }

  if (data.experience && data.experience.length > 0) {
    html += `
  <section class="section">
    <h2 class="section-title">Professional Experience</h2>
`;
    for (const exp of data.experience) {
      const start = formatDate(exp.start_date);
      const end = formatDate(exp.end_date);
      const dateRange = start && end ? `${start} - ${end}` : start || end || '';

      html += `
    <div class="experience-item">
      <div class="job-header">
        <span>
          <span class="job-title">${exp.title}</span>
          <span class="company">| ${exp.company}</span>
          ${exp.location ? `<span class="location">(${exp.location})</span>` : ''}
        </span>
        <span class="date-range">${dateRange}</span>
      </div>
`;
      if (exp.highlights.length > 0) {
        html += `      <ul class="highlights">\n`;
        for (const highlight of exp.highlights) {
          html += `        <li>${highlight}</li>\n`;
        }
        html += `      </ul>\n`;
      }
      html += `    </div>\n`;
    }
    html += `  </section>\n`;
  }

  if (data.education && data.education.length > 0) {
    html += `
  <section class="section">
    <h2 class="section-title">Education</h2>
`;
    for (const edu of data.education) {
      const start = formatDate(edu.start_date);
      const end = formatDate(edu.end_date);
      const dateRange = start && end ? `${start} - ${end}` : start || end || '';

      html += `
    <div class="education-item">
      <div class="job-header">
        <span>
          <span class="job-title">${edu.degree}</span>
          <span class="company">| ${edu.institution}</span>
        </span>
        <span class="date-range">${dateRange}</span>
      </div>
`;
      const details: string[] = [];
      if (edu.gpa) details.push(`GPA: ${edu.gpa}`);
      if (edu.honors) details.push(`Honors: ${edu.honors}`);
      if (details.length > 0) {
        html += `      <div style="margin-top: 4px;">${details.join(' | ')}</div>\n`;
      }
      html += `    </div>\n`;
    }
    html += `  </section>\n`;
  }

  if (data.skills) {
    const skillCategories = [
      { key: 'languages', label: 'Programming Languages' },
      { key: 'frameworks', label: 'Frameworks & Libraries' },
      { key: 'tools', label: 'Tools & Technologies' },
      { key: 'soft_skills', label: 'Soft Skills' },
    ];

    const hasSkills = skillCategories.some(
      cat => data.skills && (data.skills as any)[cat.key]?.length
    );

    if (hasSkills) {
      html += `
  <section class="section">
    <h2 class="section-title">Skills</h2>
`;
      for (const cat of skillCategories) {
        const items = (data.skills as any)?.[cat.key];
        if (items && items.length > 0) {
          html += `    <div class="skills-category"><strong>${cat.label}:</strong> ${items.join(', ')}</div>\n`;
        }
      }
      html += `  </section>\n`;
    }
  }

  if (data.projects && data.projects.length > 0) {
    html += `
  <section class="section">
    <h2 class="section-title">Projects</h2>
`;
    for (const proj of data.projects) {
      html += `
    <div class="project-item">
      <div class="project-header">
        <span class="project-name">${proj.name}</span>
        ${proj.url ? `<span class="project-url">${proj.url}</span>` : ''}
      </div>
      ${proj.description ? `<div>${proj.description}</div>` : ''}
      ${proj.technologies && proj.technologies.length > 0 ? `<div><em>Technologies: ${proj.technologies.join(', ')}</em></div>` : ''}
    </div>
`;
    }
    html += `  </section>\n`;
  }

  if (data.certifications && data.certifications.length > 0) {
    html += `
  <section class="section">
    <h2 class="section-title">Certifications</h2>
`;
    for (const cert of data.certifications) {
      html += `    <div class="certification-item">${cert.name}${cert.date ? ` | ${cert.date}` : ''}</div>\n`;
    }
    html += `  </section>\n`;
  }

  html += `
</body>
</html>
`;

  return html;
}

export function generateHtmlResume(
  data: ResumeData,
  template: TemplateStyle,
  outputPath: string
): void {
  const html = generateHTML(data, template);
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`Resume saved to: ${outputPath}`);
}
