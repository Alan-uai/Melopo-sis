#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { ResumeData, TemplateStyle } from './types';
import { generateDocxResume } from './createDocx';
import { generateHtmlResume } from './createHtml';

interface CliArgs {
  data: string;
  format: 'docx' | 'html' | 'pdf';
  template: TemplateStyle;
  output: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  
  const result: CliArgs = {
    data: '',
    format: 'docx',
    template: 'modern',
    output: '',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--data' || arg === '-d') {
      result.data = args[++i];
    } else if (arg === '--format' || arg === '-f') {
      const format = args[++i].toLowerCase();
      if (['docx', 'html', 'pdf'].includes(format)) {
        result.format = format as 'docx' | 'html' | 'pdf';
      } else {
        console.error(`Invalid format: ${format}. Valid options: docx, html, pdf`);
        process.exit(1);
      }
    } else if (arg === '--template' || arg === '-t') {
      const template = args[++i].toLowerCase();
      if (['classic', 'modern', 'minimal', 'two-column'].includes(template)) {
        result.template = template as TemplateStyle;
      } else {
        console.error(`Invalid template: ${template}. Valid options: classic, modern, minimal, two-column`);
        process.exit(1);
      }
    } else if (arg === '--output' || arg === '-o') {
      result.output = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (!result.data) {
    console.error('Error: --data is required');
    printHelp();
    process.exit(1);
  }

  if (!result.output) {
    const ext = result.format === 'pdf' ? '.pdf' : result.format === 'html' ? '.html' : '.docx';
    const baseName = path.basename(result.data, path.extname(result.data));
    result.output = `${baseName}_resume${ext}`;
  }

  return result;
}

function printHelp(): void {
  console.log(`
Resume Builder CLI

Usage:
  npx ts-node scripts/cli.ts --data <file> [options]

Options:
  --data, -d <file>       Path to JSON resume data (required)
  --format, -f <format>   Output format: docx, html, pdf (default: docx)
  --template, -t <style>   Template style: classic, modern, minimal, two-column (default: modern)
  --output, -o <file>     Output file path (default: <basename>_resume.<ext>)
  --help, -h              Show this help message

Examples:
  npx ts-node scripts/cli.ts --data resume.json --format docx
  npx ts-node scripts/cli.ts --data resume.json --format html --template minimal
  npx ts-node scripts/cli.ts -d resume.json -f docx -t modern -o my_resume.docx
`);
}

async function main(): Promise<void> {
  const args = parseArgs();

  let data: ResumeData;
  try {
    const rawData = fs.readFileSync(args.data, 'utf-8');
    data = JSON.parse(rawData);
  } catch (error) {
    console.error(`Error reading or parsing JSON file: ${args.data}`);
    process.exit(1);
  }

  if (!data.personal || !data.personal.name) {
    console.error('Error: Resume data must include personal.name');
    process.exit(1);
  }

  switch (args.format) {
    case 'docx':
      await generateDocxResume(data, args.template, args.output);
      break;
    case 'html':
      generateHtmlResume(data, args.template, args.output);
      break;
    case 'pdf':
      console.log('PDF generation requires puppeteer/jspdf - generating HTML instead');
      const htmlOutput = args.output.replace('.pdf', '.html');
      generateHtmlResume(data, args.template, htmlOutput);
      console.log('To create PDF: Open the HTML file in a browser and print to PDF');
      break;
  }
}

main().catch(console.error);
