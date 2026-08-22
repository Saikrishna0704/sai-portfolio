// Structured portfolio content — single source of truth for the celestial scene.
// Per PROJECT.md §11: coordinates/scale/material are presentation config, decided
// separately in scene code. This file holds only semantic content.

export type ProjectType = "code" | "paper" | "writing";

export interface Project {
  id: string;
  title: string;
  type: ProjectType;
  summary: string;
  /** Omitted while a project has nowhere public to point at yet. */
  url?: string;
  technologies: string[]; // skill ids, see `skills` below
}

export interface Domain {
  id: string;
  name: string;
  description: string; // why this is a real domain, not filler
  projects: Project[];
  relatedSkills: string[]; // skill ids
}

export interface Skill {
  id: string;
  name: string;
}

/**
 * Where something happened.
 *
 * Content, not presentation: the city is a fact about the role or the degree.
 * Optional because not every entry has a meaningful place, and because an
 * unknown location must stay absent rather than be guessed at.
 */
export interface Location {
  city: string;
  region: string;
  country: string;
}

export interface ExperienceEntry {
  id: string;
  role: string;
  institution: string;
  location?: Location;
  start: string; // YYYY-MM
  end: string | null; // null = ongoing
  /** One line, for the overview. The detail lives in `highlights`. */
  summary: string;
  /** What was actually built, in the role's own terms. */
  highlights?: string[];
  /** Project ids this role produced or contributed to. */
  relatedProjects: string[];
}

export interface EducationEntry {
  degree: string;
  institution: string;
  location?: Location;
  /** YYYY-MM, or bare YYYY when only the year is known. */
  start: string;
  /** YYYY-MM or YYYY; null = ongoing. */
  end: string | null;
}

export interface ArchivedObject {
  id: string;
  title: string;
  summary: string;
  url: string;
  year: number;
  note: string; // why this is archived/corner rather than a main domain
}

/**
 * Deliberately minor. Kept because they are real and verifiable, shown in a
 * corner rather than given weight the work itself has earned.
 */
export interface Certification {
  name: string;
  url: string;
}

export interface Person {
  name: string;
  tagline: string;
  bio: string;
  links: {
    linkedin: string;
    github: string;
    email: string;
    orcid: string;
    x: string;
  };
  // Resume intentionally omitted for now — not silently dropped, explicitly deferred.
  resumeUrl: null;
}

export interface PortfolioData {
  person: Person;
  domains: Domain[];
  skills: Skill[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  /**
   * Side projects built for their own sake. Deliberately outside `domains`:
   * they are not areas of professional focus, so they do not get a planet.
   */
  funProjects: Project[];
  archived: ArchivedObject[];
  certifications: Certification[];
}

export const skills: Skill[] = [
  { id: "python", name: "Python" },
  { id: "pytorch", name: "PyTorch" },
  { id: "ml", name: "Machine learning" },
  { id: "multimodal", name: "Multimodal AI" },
  { id: "rag", name: "RAG" },
  { id: "fine-tuning", name: "Fine-tuning" },
  { id: "llm-evaluation", name: "LLM evaluation" },
  { id: "triton", name: "Triton" },
  { id: "kernels", name: "GPU kernels" },
  { id: "sql", name: "SQL" },
];

export const portfolioData: PortfolioData = {
  person: {
    name: "Sai Krishna Tammali",
    tagline: "LLMs | Inference | Kernels | Evals",
    bio: "I spend most of my time inside language models, writing them from scratch, speeding up how they run, and checking whether any of it actually worked.",
    links: {
      linkedin: "https://www.linkedin.com/in/saikrishna-tammali/",
      github: "https://github.com/Saikrishna0704",
      email: "saikrishna.tammali04@gmail.com",
      orcid: "https://orcid.org/0009-0009-4034-8195",
      x: "https://x.com/exergyofsai",
    },
    resumeUrl: null,
  },

  domains: [
    {
      id: "llms",
      name: "AI/LLMs",
      description: "Language models end to end: building them from scratch, adapting them to a task, and measuring whether any of it worked.",
      relatedSkills: ["python", "pytorch", "fine-tuning", "llm-evaluation"],
      projects: [
        {
          id: "llm-from-scratch",
          title: "llm-from-scratch",
          type: "code",
          summary: "A 124M-parameter language model built from scratch to understand the transformer layer and everything around it: token and positional embeddings, multi-head attention, KV cache, training loop, end to end.",
          url: "https://github.com/Saikrishna0704/llm-from-scratch",
          technologies: ["python", "pytorch"],
        },
        {
          id: "qlora-finetuning",
          title: "LLM fine-tuning with QLoRA",
          type: "code",
          summary: "Fine-tuned Llama 3.2 3B with 4-bit QLoRA and rank-16 adapters, about 1% of parameters trainable, raising intent-classification macro-F1 from 0.71 to 0.89 on a held-out support-ticket set while cutting GPU memory by about 60% to fit a single T4.",
          technologies: ["python", "pytorch", "fine-tuning"],
        },
        {
          id: "genai-eval-harness",
          title: "GenAI evaluation and guardrails harness",
          type: "code",
          summary: "A reusable harness scoring groundedness, relevance, and hallucination across 4 models and 3 prompt variants, logging p95 latency and cost per query, with PII redaction at 96% recall and prompt-injection detection at 89%.",
          technologies: ["python", "llm-evaluation"],
        },
        {
          id: "telugu-tokenizer",
          title: "Telugu subword tokenizer",
          type: "code",
          summary: "A byte pair encoding tokenizer for Telugu with its own encoder and decoder, reaching a compression ratio of 6.",
          technologies: ["python"],
        },
      ],
    },
    {
      id: "inference",
      name: "Inference",
      description: "How LLMs actually run once they're trained: the systems side of serving them fast.",
      relatedSkills: ["python", "triton", "kernels"],
      projects: [
        {
          id: "prefill-vs-decode",
          title: "Prefill vs decode",
          type: "writing",
          summary: "A breakdown of the prefill and decode phases in LLM inference and why they behave so differently in practice.",
          url: "https://saikrishna0704.github.io/posts/prefill-vs-decode/",
          technologies: ["python"],
        },
      ],
    },
    {
      id: "applied-ml-research",
      name: "Research",
      description: "Published research applying ML and multimodal models to real-world interpretation problems.",
      relatedSkills: ["python", "ml", "multimodal", "rag", "sql"],
      projects: [
        {
          id: "synthetic-reflections",
          title: "Synthetic Reflections on Resource Extraction",
          type: "paper",
          summary: "Applies multimodal LLMs and retrieval-augmented generation to interpret Sentinel-2 satellite imagery of industrial mining sites, introducing a new landscape descriptor for assessing mining activity. Published at HCII 2026.",
          url: "https://doi.org/10.1007/978-3-032-30038-6_27",
          technologies: ["python", "ml", "multimodal", "rag"],
        },
      ],
    },
  ],

  skills,

  experience: [
    {
      id: "ub-gra",
      role: "Graduate Research Assistant, Generative AI",
      // Kept as "University at Buffalo" to match the education entry. The
      // formal name is State University of New York at Buffalo; using both
      // across two adjacent sections reads as an inconsistency rather than
      // as precision.
      institution: "University at Buffalo",
      location: { city: "Buffalo", region: "New York", country: "United States" },
      start: "2025-03",
      end: "2026-01",
      summary: "First-authored an end to end multimodal GenAI pipeline interpreting surface mining environmental impact from Sentinel-2 satellite imagery, published at HCI International 2026.",
      highlights: [
        "First-authored “Synthetic Reflections on Resource Extraction”, published at HCI International 2026: an end to end multimodal GenAI pipeline interpreting surface mining environmental impact from Sentinel-2 satellite imagery.",
        "Developed a multimodal LLM inference workflow in Python, applying prompt engineering and few-shot prompting to control and optimize outputs from Llama 4, evaluating caption quality using custom domain metrics.",
        "Built an automated evaluation pipeline for multimodal outputs using LLM-as-judge (Gemini), RAGAS, and synthetic test prompts, enforcing schema-validated structured JSON responses to validate scoring logic and evaluation consistency.",
        "Engineered a multi-source agentic RAG system with multi-step reasoning and coarse-to-fine retrieval, integrating satellite image caption embeddings with mine impact reports to enable grounded Q&A across visual and document evidence.",
      ],
      // The role and the paper are the same piece of work: both describe the
      // multimodal LLM and RAG pipeline published at HCII 2026.
      relatedProjects: ["synthetic-reflections"],
    },
    {
      id: "merilytics-mle-intern",
      role: "Machine Learning Engineer Intern",
      institution: "Merilytics",
      location: { city: "Hyderabad", region: "Telangana", country: "India" },
      start: "2022-03",
      end: "2022-07",
      summary: "Built and productionized ranking, recommendation, and churn models, along with the evaluation frameworks used to decide which of them shipped.",
      highlights: [
        "Designed and productionized a personalized ranking and recommendation system using LambdaMART and contextual multi-armed bandits on user-item interactions, improving precision@k by 12% and retention by 7%.",
        "Built an evaluation framework for recommendation and search models using NDCG@10, MRR, hit-rate@k, A/B tests, and user feedback loops to prioritize algorithm updates, raising NDCG@10 by 19%.",
        "Built an ML pipeline with classification, regression, and clustering models to predict user churn risk and lifetime value from behavioral and transactional data, driving 14% upsell conversions in targeted retention campaigns.",
        "Built a semantic search assistant over the product catalog using sentence-embedding retrieval, cutting query resolution time by 32% while lifting self-service containment by 18%.",
      ],
      relatedProjects: [],
    },
  ],

  // Most recent first, matching how `experience` reads.
  education: [
    {
      degree: "Master of Science in Data Science",
      institution: "University at Buffalo",
      location: { city: "Buffalo", region: "New York", country: "United States" },
      start: "2023-08",
      end: "2025-01",
    },
    {
      // Institution kept as the acronym supplied rather than expanded, and the
      // AI track kept in the degree title because it is part of the credential.
      degree: "Bachelors in Mechanical Engineering with Artificial Intelligence Track",
      institution: "VNR VJIET",
      location: { city: "Hyderabad", region: "Telangana", country: "India" },
      // Years only: the months were not supplied, and a start month is not
      // something to infer from a typical academic calendar.
      start: "2018",
      end: "2022",
    },
  ],

  // Summaries taken from each repository's own README, since neither repo has
  // a GitHub description set.
  funProjects: [
    {
      id: "nye-trip-tracker",
      title: "NYE Trip Tracker",
      type: "code",
      summary:
        "Hour by hour trip itinerary with budget tracking split across three people. Logs spend per hour, totals it per person, and exports the plan as CSV or JSON.",
      url: "https://github.com/Saikrishna0704/NYETripTracker",
      technologies: ["python"],
    },
    {
      id: "chat-stalker-ai",
      title: "chatStalkerAI",
      type: "code",
      summary:
        "A fun app for analyzing WhatsApp group chat exports, with an AI assistant for asking questions about the conversation and a word counter that breaks message volume down by participant.",
      url: "https://github.com/Saikrishna0704/chatStalkerAI",
      technologies: ["python"],
    },
  ],

  archived: [
    {
      id: "hazardous-asteroid-ml",
      title: "Predicting the Potentially Hazardous Asteroid to Earth Using Machine Learning",
      summary: "Undergraduate research comparing machine learning and ensemble methods to classify near-Earth asteroids as hazardous, using NASA JPL's small-body dataset.",
      url: "https://doi.org/10.1007/978-981-16-7389-4_34",
      year: 2022,
      note: "Early undergraduate work, unrelated to current LLM/inference focus. Kept as a small, unlabeled corner object rather than a main domain.",
    },
  ],

  certifications: [
    {
      name: "ML in Production",
      url: "https://www.coursera.org/account/accomplishments/verify/OZGXPAW5Y1TL",
    },
    {
      name: "Python for Data Structures",
      url: "https://www.coursera.org/account/accomplishments/certificate/WQRBAPGTP99H",
    },
  ],
};
