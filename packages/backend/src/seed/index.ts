import { seedSubjects } from './subjects';
import { seedTopics } from './topics';
import { seedAssessments, initAssessmentIds } from './assessments';
import { seedQuestions } from './questions';
import { seedAdmin, seedDebugTestAccount } from './admin';

export function runSeed(): void {
  console.log('🌱 Seeding Hero Academy database...');
  const subjectId = seedSubjects();
  seedTopics(subjectId);
  const assessmentMap = seedAssessments();
  initAssessmentIds(assessmentMap);
  seedQuestions();
  seedAdmin();
  if (process.env.DEBUG_UNLOCK_ALL === 'true') {
    seedDebugTestAccount();
    console.log('  ⚠️  Debug accounts seeded (test@test.com / password, child PIN: 1111)');
  }
  console.log('✅ Seed complete!');
}
