/**
 * Connections between skills, projects, domains and experience.
 *
 * PROJECT.md §6: relationships must come from structured data. Nothing here is
 * hand listed. Every edge is derived by reading `portfolio-data.ts`, so a new
 * project or a new skill on an existing one shows up in the highlighting
 * without touching this file.
 */

import {
  portfolioData,
  type ExperienceEntry,
  type Project,
  type Skill,
} from "./portfolio-data";

/** A project plus the domain it belongs to, if any. */
export interface IndexedProject {
  project: Project;
  /** null for fun projects, which sit outside the domain structure. */
  domainId: string | null;
}

/** Everything a single skill touches. */
export interface SkillRelations {
  domainIds: string[];
  projectIds: string[];
  /** True when nothing references this skill yet. */
  isOrphan: boolean;
}

function buildProjectIndex(): IndexedProject[] {
  const indexed: IndexedProject[] = [];

  for (const domain of portfolioData.domains) {
    for (const project of domain.projects) {
      indexed.push({ project, domainId: domain.id });
    }
  }
  for (const project of portfolioData.funProjects) {
    indexed.push({ project, domainId: null });
  }

  return indexed;
}

export const indexedProjects: IndexedProject[] = buildProjectIndex();

const projectsById = new Map(
  indexedProjects.map((entry) => [entry.project.id, entry]),
);

const skillsById = new Map(
  portfolioData.skills.map((skill) => [skill.id, skill]),
);

function buildSkillRelations(): Map<string, SkillRelations> {
  const relations = new Map<string, SkillRelations>();

  for (const skill of portfolioData.skills) {
    relations.set(skill.id, {
      domainIds: [],
      projectIds: [],
      isOrphan: true,
    });
  }

  // A domain claims a skill directly.
  for (const domain of portfolioData.domains) {
    for (const skillId of domain.relatedSkills) {
      const entry = relations.get(skillId);
      if (entry && !entry.domainIds.includes(domain.id)) {
        entry.domainIds.push(domain.id);
      }
    }
  }

  // A project claims a skill, and in doing so implies its domain does too.
  for (const { project, domainId } of indexedProjects) {
    for (const skillId of project.technologies) {
      const entry = relations.get(skillId);
      if (!entry) continue;

      if (!entry.projectIds.includes(project.id)) {
        entry.projectIds.push(project.id);
      }
      if (domainId && !entry.domainIds.includes(domainId)) {
        entry.domainIds.push(domainId);
      }
    }
  }

  for (const entry of relations.values()) {
    entry.isOrphan = entry.domainIds.length === 0 && entry.projectIds.length === 0;
  }

  return relations;
}

const skillRelations = buildSkillRelations();

export function relationsForSkill(skillId: string): SkillRelations {
  return (
    skillRelations.get(skillId) ?? {
      domainIds: [],
      projectIds: [],
      isOrphan: true,
    }
  );
}

/** The skills a project declares, resolved to full skill records. */
export function skillsForProject(projectId: string): Skill[] {
  const entry = projectsById.get(projectId);
  if (!entry) return [];

  return entry.project.technologies
    .map((skillId) => skillsById.get(skillId))
    .filter((skill): skill is Skill => skill !== undefined);
}

/** Roles that produced a given project. */
export function experienceForProject(projectId: string): ExperienceEntry[] {
  return portfolioData.experience.filter((entry) =>
    entry.relatedProjects.includes(projectId),
  );
}

/** Projects a role produced, resolved to full project records. */
export function projectsForExperience(entry: ExperienceEntry): Project[] {
  return entry.relatedProjects
    .map((projectId) => projectsById.get(projectId)?.project)
    .filter((project): project is Project => project !== undefined);
}
