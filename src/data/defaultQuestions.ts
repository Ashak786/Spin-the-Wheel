import { Question } from '../types';

export const defaultQuestions: Question[] = [
  // --- FACTS ON EV CAR ---
  {
    id: "m1",
    category: "Facts on EV Car",
    question_text: "EV batteries cannot be recycled and always end up in landfills at the end of their useful lives.",
    answer: "Myth",
    options: ["Fact", "Myth"]
  },
  {
    id: "m2",
    category: "Facts on EV Car",
    question_text: "The first-ever mass-produced hybrid vehicle, the Toyota Prius, utilized NiMH (Nickel-Metal Hydride) rather than Lithium-ion batteries.",
    answer: "Fact",
    options: ["Fact", "Myth"]
  },
  {
    id: "m3",
    category: "Facts on EV Car",
    question_text: "Driving an EV in extremely freezing weather (-10°C / 14°F) can temporarily reduce its driving range by up to 30-40% due to battery chemistry and heating demands.",
    answer: "Fact",
    options: ["Fact", "Myth"]
  },
  {
    id: "m4",
    category: "Facts on EV Car",
    question_text: "Electric vehicles produce zero lifetime greenhouse gas emissions, even when accounting for manufacturing and electricity grid sources.",
    answer: "Myth",
    options: ["Fact", "Myth"]
  },
  {
    id: "m5",
    category: "Facts on EV Car",
    question_text: "Regenerative braking in EVs can recover up to 10-30% of energy that would otherwise be lost as heat during traditional braking.",
    answer: "Fact",
    options: ["Fact", "Myth"]
  },

  // --- CAR LEASE TRIVIA ---
  {
    id: "p1",
    category: "Car Lease Trivia",
    question_text: "In a standard car lease, what does the term 'Cap Reduction' (Capitalized Cost Reduction) refer to?",
    answer: "Down payment / trade-in",
    options: ["Down payment / trade-in", "Dealer profit margin", "Sales tax discount", "End of lease fee"]
  },
  {
    id: "p2",
    category: "Car Lease Trivia",
    question_text: "What percentage of a vehicle's original retail value is typically estimated as its 'Residual Value' after a common 36-month lease?",
    answer: "45-60%",
    options: ["30-40%", "45-60%", "70-80%", "85-95%"]
  },
  {
    id: "p3",
    category: "Car Lease Trivia",
    question_text: "What is the standard lease disposition fee or turn-in fee usually charged by finance companies for cleaning and reconditioning at lease-end?",
    answer: "$350 - $500",
    options: ["$0 - $100", "$350 - $500", "$800 - $1,000", "$1,500+"]
  },
  {
    id: "p4",
    category: "Car Lease Trivia",
    question_text: "Which type of car lease places the financial risk of the vehicle's actual end-of-term market value entirely on the lessee?",
    answer: "Open-End Lease",
    options: ["Closed-End Lease", "Open-End Lease", "Single-Payment Lease", "Subvented Lease"]
  },
  {
    id: "p5",
    category: "Car Lease Trivia",
    question_text: "If you exceed your lease's total mileage allowance, what is the most common per-mile excess charge applied by mainstream auto lenders?",
    answer: "15 - 25 cents",
    options: ["2 - 5 cents", "10 - 15 cents", "15 - 25 cents", "50 - 75 cents"]
  },

  // --- CAR QUIZ ---
  {
    id: "q1",
    category: "Car Quiz",
    question_text: "What does the iconic brand name acronym 'BMW' stand for in English?",
    answer: "Bavarian Motor Works",
    options: ["Bavarian Motor Works", "Berlin Motor Works", "British Motor Wheels", "Balkan Machinery Works"]
  },
  {
    id: "q2",
    category: "Car Quiz",
    question_text: "Which car brand features a raging bull logo, inspired by the founder's obsession with Spanish bullfighting?",
    answer: "Lamborghini",
    options: ["Ferrari", "Lamborghini", "Maserati", "Porsche"]
  },
  {
    id: "q3",
    category: "Car Quiz",
    question_text: "What speed did the Bugatti Veyron Super Sport top out at to claim its record-breaking production top-speed crown in 2010?",
    answer: "268 mph",
    options: ["253 mph", "258 mph", "268 mph", "273 mph"]
  },
  {
    id: "q4",
    category: "Car Quiz",
    question_text: "Which legendary rally-inspired car was produced by Subaru under the nameplate 'WRX STI'?",
    answer: "Impreza",
    options: ["Lancer", "Impreza", "Legacy", "Celica"]
  },
  {
    id: "q5",
    category: "Car Quiz",
    question_text: "What Japanese manufacturer launched the first-ever production hybrid passenger vehicle, the Prius, in 1997?",
    answer: "Toyota",
    options: ["Honda", "Toyota", "Nissan", "Mazda"]
  }
];
