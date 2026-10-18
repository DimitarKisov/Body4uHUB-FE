// Static sample content for the home page previews (design: ui_kits/home/Home.jsx).
// TODO: replace with the Services API (GET /api/trainer-profiles) and Content API (GET /api/articles) once their
// DTOs carry what the cards need — trainers have no name/photo (only UserId), articles no category/reading time/cover.
export interface SampleTrainer {
  id: number;
  name: string;
  spec: string;
}

export interface SampleArticle {
  id: number;
  category: string;
  title: string;
  minutes: number;
}

export const SAMPLE_TRAINERS: SampleTrainer[] = [
  { id: 1, name: "Мария Иванова", spec: "Силови тренировки" },
  { id: 2, name: "Георги Петров", spec: "Функционален фитнес" },
  { id: 3, name: "Елена Димитрова", spec: "Йога и мобилност" },
  { id: 4, name: "Никола Стоянов", spec: "Бягане и издръжливост" },
];

export const SAMPLE_ARTICLES: SampleArticle[] = [
  { id: 1, category: "Тренировки", title: "Как да започнеш със силови тренировки без травми", minutes: 6 },
  { id: 2, category: "Хранене", title: "Протеин: колко ти трябва наистина", minutes: 4 },
  { id: 3, category: "Възстановяване", title: "Сънят е част от тренировъчния ти план", minutes: 5 },
];
