export type SDG = { number: number; title: string; shortTitle: string; color: string; iconPath: string };

export const sdgs: SDG[] = [
  [1, "No Poverty", "No Poverty", "#e5243b"], [2, "Zero Hunger", "Zero Hunger", "#dda63a"],
  [3, "Good Health and Well-Being", "Good Health", "#4c9f38"], [4, "Quality Education", "Education", "#c5192d"],
  [5, "Gender Equality", "Gender", "#ff3a21"], [6, "Clean Water and Sanitation", "Clean Water", "#26bde2"],
  [7, "Affordable and Clean Energy", "Clean Energy", "#fcc30b"], [8, "Decent Work and Economic Growth", "Decent Work", "#a21942"],
  [9, "Industry, Innovation and Infrastructure", "Innovation", "#fd6925"], [10, "Reduced Inequalities", "Inequalities", "#dd1367"],
  [11, "Sustainable Cities and Communities", "Cities", "#fd9d24"], [12, "Responsible Consumption and Production", "Consumption", "#bf8b2e"],
  [13, "Climate Action", "Climate", "#3f7e44"], [14, "Life Below Water", "Life Below Water", "#0a97d9"],
  [15, "Life on Land", "Life on Land", "#56c02b"], [16, "Peace, Justice and Strong Institutions", "Peace & Justice", "#00689d"],
  [17, "Partnerships for the Goals", "Partnerships", "#19486a"],
].map(([number, title, shortTitle, color]) => ({ number: number as number, title: title as string, shortTitle: shortTitle as string, color: color as string, iconPath: `/assets/sdg/goal-${String(number).padStart(2, "0")}.png` }));

export const getSDG = (number: number) => sdgs.find((sdg) => sdg.number === number)!;
