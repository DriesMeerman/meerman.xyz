import { skills as skillData } from '$lib/data/skillData.js';

export const skills = Object.fromEntries(
  Object.entries(skillData).map(([category, items]) => [category, [...items]])
);
