export type PlanName = "Trial" | "Starter" | "Growth" | "Scale";

export const planCatalog = [
  {
    name: "Trial" as const,
    price: 0,
    cycle: "7 days",
    description: "Try Relay with no credit card required.",
    badge: "No card",
    features: ["7-day free trial", "25 MB R2 storage", "500 AI calls", "5,000 searchable chunks", "1 account member"],
  },
  {
    name: "Starter" as const,
    price: 5,
    cycle: "month",
    description: "For one student, worker, or solo workspace.",
    badge: "Monthly",
    features: ["25 MB R2 storage", "1,000 AI calls / month", "10,000 searchable chunks", "1 account member"],
  },
  {
    name: "Growth" as const,
    price: 19,
    cycle: "month",
    description: "For small teams and bigger knowledge libraries.",
    badge: "Popular",
    features: ["25 assistants", "5 account members", "2 GB file storage", "100,000 searchable chunks", "20,000 AI calls / month"],
  },
  {
    name: "Scale" as const,
    price: 79,
    cycle: "month",
    description: "For larger teams, offices, and shared knowledge operations.",
    badge: "Scale",
    features: ["100 assistants", "25 account members", "20 GB file storage", "1M searchable chunks", "100,000 AI calls / month"],
  },
];

export const paidPlans = planCatalog.filter(plan => plan.name === "Starter" || plan.name === "Growth" || plan.name === "Scale");
