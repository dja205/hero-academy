import { seedSubjects } from './subjects';
import { seedTopics } from './topics';
import { seedAssessments, initAssessmentIds } from './assessments';
import { seedQuestions } from './questions';
import { seedAdmin } from './admin';

export function runSeed(): void {
  console.log('🌱 Seeding Hero Academy database...');
  const subjectId = seedSubjects();
  seedTopics(subjectId);
  const assessmentMap = seedAssessments();
  initAssessmentIds(assessmentMap);
  seedQuestions();
  seedAdmin();
  console.log('✅ Seed complete!');
}
