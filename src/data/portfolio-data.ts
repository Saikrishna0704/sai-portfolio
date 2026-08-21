// Structured portfolio content — single source of truth for the celestial scene.
// Per PROJECT.md §11: coordinates/scale/material are presentation config, decided
// separately in scene code. This file holds only semantic content.

export type ProjectType = "code" | "paper" | "writing";

export interface Project {
  id: string;
  title: string;
  type: ProjectType;
  summary: string;
  url: string;
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

export interface ExperienceEntry {
  role: string;
  institution: string;
  start: string; // YYYY-MM
  end: string | null; // null = ongoing
  summary: string;
}

export interface EducationEntry {
  degree: string;
  institution: string;
  // No dates: none were supplied, and a graduation year is not something to
  // guess at on someone's behalf. Add `start`/`end` here when they are known.
}

export interface ArchivedObject {
  id: string;
  title: string;
  summary: string;
  url: string;
  year: number;
  note: string; // why this is archived/corner rather than a main domain
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
  archived: ArchivedObject[];
}

export const skills: Skill[] = [
  { id: "python", name: "Python" },
  { id: "pytorch", name: "PyTorch" },
  { id: "triton", name: "Triton" },
  { id: "kernels", name: "GPU kernels" },
  { id: "sql", name: "SQL" },
  { id: "data-engineering", name: "Data engineering" },
  { id: "ml", name: "Machine learning" },
];

export const portfolioData: PortfolioData = {
  person: {
    name: "Sai Krishna Tammali",
    tagline: "LLMs | Inference | Kernels | Evals",
    bio: "I spend most of my time inside language models — writing them from scratch, speeding up how they run, and checking whether any of it actually worked.",
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
      name: "LLMs",
      description: "Building language models from the ground up to understand what's actually happening inside them.",
      relatedSkills: ["python", "pytorch"],
      projects: [
        {
          id: "llm-from-scratch",
          title: "llm-from-scratch",
          type: "code",
          summary: "A 128M-parameter language model built from scratch to understand the transformer layer and everything around it — attention, positional encoding, training loop, end to end.",
          url: "https://github.com/Saikrishna0704/llm-from-scratch",
          technologies: ["python", "pytorch"],
        },
      ],
    },
    {
      id: "inference",
      name: "Inference",
      description: "How LLMs actually run once they're trained — the systems side of serving them fast.",
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
      name: "Applied ML research",
      description: "Published research applying ML and multimodal models to real-world interpretation problems.",
      relatedSkills: ["python", "ml", "sql", "data-engineering"],
      projects: [
        {
          id: "synthetic-reflections",
          title: "Synthetic Reflections on Resource Extraction",
          type: "paper",
          summary: "Applies multimodal LLMs and retrieval-augmented generation to interpret Sentinel-2 satellite imagery of industrial mining sites, introducing a new landscape descriptor for assessing mining activity. Published at HCII 2026.",
          url: "https://doi.org/10.1007/978-3-032-30038-6_27",
          technologies: ["ml", "python"],
        },
      ],
    },
  ],

  skills,

  experience: [
    {
      role: "Graduate Research Assistant",
      institution: "University at Buffalo",
      start: "2025-03",
      end: "2026-01",
      summary: "Contributed to research on multimodal LLM and RAG pipelines for satellite imagery interpretation, published at HCII 2026.",
    },
  ],

  education: [
    {
      // Kept as supplied — "Masters in Data Science" rather than MS or MPS,
      // since Buffalo offers both and the exact credential was not specified.
      degree: "Masters in Data Science",
      institution: "University at Buffalo",
    },
  ],

  archived: [
    {
      id: "hazardous-asteroid-ml",
      title: "Predicting the Potentially Hazardous Asteroid to Earth Using Machine Learning",
      summary: "Undergraduate research comparing machine learning and ensemble methods to classify near-Earth asteroids as hazardous, using NASA JPL's small-body dataset.",
      url: "https://doi.org/10.1007/978-981-16-7389-4_34",
      year: 2022,
      note: "Early undergraduate work, unrelated to current LLM/inference focus — kept as a small, unlabeled corner object rather than a main domain.",
    },
  ],
};
