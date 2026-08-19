import { generateLiveCodeChallenge, reviewSubmittedCode, getPresetChallengeByDifficulty } from './services/ai.js';

async function testLiveCodeFeature() {
  console.log('Testing AI Live Technical Code Arena & Reviewer...');

  // 1. Test Preset Challenges
  const juniorPreset = getPresetChallengeByDifficulty('Junior');
  console.log('✓ Junior Preset Challenge:', juniorPreset.title);
  if (!juniorPreset.starter_code || !juniorPreset.test_cases?.length) {
    throw new Error('Junior preset missing starter code or test cases');
  }

  // 2. Test Live Challenge Generation
  console.log('Generating AI Challenge for Fullstack Developer...');
  const challenge = await generateLiveCodeChallenge({
    position: 'Fullstack JavaScript Engineer',
    companyName: 'Tech Unicorn Indonesia',
    techStack: 'JavaScript, React, Node.js',
    difficulty: 'Mid',
    topic: 'Array Manipulation & Async'
  });
  console.log('✓ AI Generated Challenge Title:', challenge.title);
  console.log('  Difficulty:', challenge.difficulty);
  console.log('  Test Cases Count:', challenge.test_cases?.length);

  // 3. Test AI Code Reviewer
  console.log('Testing AI Code Reviewer with candidate code...');
  const candidateSolution = `
function solution(nums, target) {
  // Hash map solution O(N) time and O(N) space
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}
`;

  const review = await reviewSubmittedCode({
    challengeTitle: challenge.title || 'Two Sum Algorithm',
    problemStatement: challenge.problem_statement || 'Cari indeks dua angka',
    candidateCode: candidateSolution,
    language: 'javascript',
    testResults: [
      { id: 1, isPassed: true, durationMs: 1.2 },
      { id: 2, isPassed: true, durationMs: 0.8 }
    ]
  });

  console.log('✓ AI Review Overall Score:', review.overall_score);
  console.log('✓ Logic Score:', review.logic_score);
  console.log('✓ Clean Code Score:', review.clean_code_score);
  console.log('✓ Big-O Time Complexity:', review.time_complexity);
  console.log('✓ Senior Feedback Snippet:', (review.senior_feedback || '').slice(0, 120) + '...');

  if (!review.overall_score || review.overall_score < 50) {
    throw new Error('AI Review score invalid');
  }

  console.log('🎉 ALL LIVE CODE ARENA TESTS PASSED PERFECTLY!');
}

testLiveCodeFeature().catch(err => {
  console.error('❌ LIVE CODE TEST FAILED:', err);
  process.exit(1);
});
