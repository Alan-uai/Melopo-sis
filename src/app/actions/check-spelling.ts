'use server';

import { checkText } from '@/lib/spell-checker';

export async function checkSpelling(text: string) {
  if (!text.trim()) return { errors: [] };
  return checkText(text);
}
