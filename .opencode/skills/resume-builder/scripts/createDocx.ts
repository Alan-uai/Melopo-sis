import fs from 'fs';
import path from 'path';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  convertInchesToTwip,
} from 'docx';
import {
  ResumeData,
  TemplateStyle,
  TEMPLATES,
  TemplateConfig,
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

function createParagraph(
  text: string,
  style: TemplateConfig,
  options: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    color?: string;
    alignment?: AlignmentType;
  } = {}
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        font: style.font,
        size: (options.size || style.bodySize) * 2,
        bold: options.bold,
        italics: options.italic,
        color: options.color || '000000',
      }),
    ],
    alignment: options.alignment || AlignmentType.LEFT,
    spacing: {
      line: style.lineSpacing * 240,
    },
  });
}

function createBullet(text: string, style: TemplateConfig): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `• ${text}`,
        font: style.font,
        size: style.bodySize * 2,
      }),
    ],
    indent: {
      left: convertInchesToTwip(0.25),
    },
    spacing: {
      line: style.lineSpacing * 240,
    },
  });
}

function buildResumeDocument(data: ResumeData, template: TemplateStyle): Document {
  const style = TEMPLATES[template];

  const children: Paragraph[] = [];

  const { personal } = data;

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: personal.name,
          font: style.font,
          size: style.headerSize * 2,
          bold: true,
          color: style.headerColor,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  const contactParts: string[] = [];
  if (personal.email) contactParts.push(personal.email);
  if (personal.phone) contactParts.push(personal.phone);
  if (personal.location) contactParts.push(personal.location);

  if (contactParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: contactParts.join('  |  '),
            font: style.font,
            size: (style.bodySize - 1) * 2,
            color: style.headerColor,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 50 },
      })
    );
  }

  const linksParts: string[] = [];
  if (personal.linkedin) linksParts.push(`LinkedIn: ${personal.linkedin}`);
  if (personal.url) linksParts.push(`Portfolio: ${personal.url}`);

  if (linksParts.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: linksParts.join('  |  '),
            font: style.font,
            size: (style.bodySize - 1) * 2,
            color: style.headerColor,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  if (personal.summary) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: personal.summary,
            font: style.font,
            size: style.bodySize * 2,
          }),
        ],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
      })
    );
  }

  if (data.experience && data.experience.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'PROFESSIONAL EXPERIENCE',
            font: style.font,
            size: style.sectionSize * 2,
            bold: true,
            color: style.sectionColor,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    for (const exp of data.experience) {
      const start = formatDate(exp.start_date);
      const end = formatDate(exp.end_date);
      const dateRange = start && end ? `${start} - ${end}` : start || end || '';

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: exp.title,
              font: style.font,
              size: style.bodySize * 2,
              bold: true,
            }),
            new TextRun({
              text: `  |  ${exp.company}`,
              font: style.font,
              size: style.bodySize * 2,
              italics: true,
            }),
            ...(exp.location ? [
              new TextRun({
                text: `  (${exp.location})`,
                font: style.font,
                size: style.bodySize * 2,
              }),
            ] : []),
          ],
          spacing: { after: 50 },
        })
      );

      if (dateRange) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: dateRange,
                font: style.font,
                size: (style.bodySize - 1) * 2,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }

      for (const highlight of exp.highlights) {
        children.push(createBullet(highlight, style));
      }
    }
  }

  if (data.education && data.education.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'EDUCATION',
            font: style.font,
            size: style.sectionSize * 2,
            bold: true,
            color: style.sectionColor,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    for (const edu of data.education) {
      const start = formatDate(edu.start_date);
      const end = formatDate(edu.end_date);
      const dateRange = start && end ? `${start} - ${end}` : start || end || '';

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: edu.degree,
              font: style.font,
              size: style.bodySize * 2,
              bold: true,
            }),
            new TextRun({
              text: `  |  ${edu.institution}`,
              font: style.font,
              size: style.bodySize * 2,
            }),
          ],
          spacing: { after: 50 },
        })
      );

      const details: string[] = [];
      if (edu.gpa) details.push(`GPA: ${edu.gpa}`);
      if (edu.honors) details.push(`Honors: ${edu.honors}`);
      if (dateRange) details.push(dateRange);

      if (details.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: details.join('  |  '),
                font: style.font,
                size: (style.bodySize - 1) * 2,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
    }
  }

  if (data.skills) {
    const skillCategories = [
      { key: 'languages', label: 'Programming Languages' },
      { key: 'frameworks', label: 'Frameworks & Libraries' },
      { key: 'tools', label: 'Tools & Technologies' },
      { key: 'soft_skills', label: 'Soft Skills' },
    ];

    const hasSkills = skillCategories.some(
      cat => data.skills && data.skills[cat.key as keyof typeof data.skills]?.length
    );

    if (hasSkills) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'SKILLS',
              font: style.font,
              size: style.sectionSize * 2,
              bold: true,
              color: style.sectionColor,
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );

      for (const cat of skillCategories) {
        const items = data.skills?.[cat.key as keyof typeof data.skills];
        if (items && items.length > 0) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${cat.label}: `,
                  font: style.font,
                  size: style.bodySize * 2,
                  bold: true,
                }),
                new TextRun({
                  text: items.join(', '),
                  font: style.font,
                  size: style.bodySize * 2,
                }),
              ],
              spacing: { after: 50 },
            })
          );
        }
      }
    }
  }

  if (data.projects && data.projects.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'PROJECTS',
            font: style.font,
            size: style.sectionSize * 2,
            bold: true,
            color: style.sectionColor,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    for (const proj of data.projects) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: proj.name,
              font: style.font,
              size: style.bodySize * 2,
              bold: true,
            }),
            ...(proj.url ? [
              new TextRun({
                text: `  |  ${proj.url}`,
                font: style.font,
                size: (style.bodySize - 1) * 2,
              }),
            ] : []),
          ],
          spacing: { after: 50 },
        })
      );

      if (proj.description) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: proj.description,
                font: style.font,
                size: style.bodySize * 2,
              }),
            ],
            spacing: { after: 50 },
          })
        );
      }

      if (proj.technologies && proj.technologies.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Technologies: ${proj.technologies.join(', ')}`,
                font: style.font,
                size: (style.bodySize - 1) * 2,
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
    }
  }

  if (data.certifications && data.certifications.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'CERTIFICATIONS',
            font: style.font,
            size: style.sectionSize * 2,
            bold: true,
            color: style.sectionColor,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    for (const cert of data.certifications) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: cert.name,
              font: style.font,
              size: style.bodySize * 2,
            }),
            ...(cert.date ? [
              new TextRun({
                text: `  |  ${cert.date}`,
                font: style.font,
                size: (style.bodySize - 1) * 2,
              }),
            ] : []),
          ],
          spacing: { after: 50 },
        })
      );
    }
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: style.margins.top,
              right: style.margins.right,
              bottom: style.margins.bottom,
              left: style.margins.left,
            },
          },
        },
        children,
      },
    ],
  });
}

export async function generateDocxResume(
  data: ResumeData,
  template: TemplateStyle,
  outputPath: string
): Promise<void> {
  const doc = buildResumeDocument(data, template);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Resume saved to: ${outputPath}`);
}

export function generateDocxResumeSync(
  data: ResumeData,
  template: TemplateStyle,
  outputPath: string
): void {
  const doc = buildResumeDocument(data, template);
  const buffer = Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer as Buffer);
  console.log(`Resume saved to: ${outputPath}`);
}
