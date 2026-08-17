const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { readFileSync } = require('fs');

async function main() {
  const projectId = `project-${Date.now()}`;
  const testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });

  // Setup: Add users for clinic A and clinic B
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.collection('users').doc('userA').set({ clinicId: 'clinicA', role: 'doctor' });
    await db.collection('users').doc('userB').set({ clinicId: 'clinicB', role: 'doctor' });
  });

  const dbA = testEnv.authenticatedContext('userA', { email: 'userA@example.com' }).firestore();
  const dbB = testEnv.authenticatedContext('userB', { email: 'userB@example.com' }).firestore();

  let failedTests = 0;
  
  async function runTest(name, promise, shouldSucceed) {
    try {
      if (shouldSucceed) {
        await assertSucceeds(promise);
      } else {
        await assertFails(promise);
      }
      console.log(`✅ PASS: ${name}`);
    } catch (e) {
      console.error(`❌ FAIL: ${name}`);
      console.error(e);
      failedTests++;
    }
  }

  // settings tests
  await runTest("userA can read clinicA settings", dbA.collection('settings').doc('clinicA').get(), true);
  await runTest("userA cannot read clinicB settings", dbA.collection('settings').doc('clinicB').get(), false);
  
  await runTest("userB can write clinicB settings", dbB.collection('settings').doc('clinicB').set({ theme: 'dark' }), true);
  await runTest("userB cannot write clinicA settings", dbB.collection('settings').doc('clinicA').set({ theme: 'dark' }), false);

  // doctors tests
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.collection('doctors').doc('docA').set({ clinicId: 'clinicA' });
    await db.collection('doctors').doc('docB').set({ clinicId: 'clinicB' });
  });

  await runTest("userA can read docA (clinicA)", dbA.collection('doctors').doc('docA').get(), true);
  await runTest("userA cannot read docB (clinicB)", dbA.collection('doctors').doc('docB').get(), false);

  // clinics tests
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.collection('clinics').doc('clinicA').set({ ownerEmail: 'other@example.com' });
    await db.collection('clinics').doc('clinicB').set({ ownerEmail: 'other@example.com' });
  });

  await runTest("userA can read clinicA document", dbA.collection('clinics').doc('clinicA').get(), true);
  await runTest("userA cannot read clinicB document", dbA.collection('clinics').doc('clinicB').get(), false);
  
  await runTest("userA can write clinicA document", dbA.collection('clinics').doc('clinicA').update({ name: 'Clinic A' }), true);
  await runTest("userA cannot write clinicB document", dbA.collection('clinics').doc('clinicB').update({ name: 'Clinic B' }), false);

  await testEnv.cleanup();

  if (failedTests > 0) {
    console.error(`\n${failedTests} tests failed.`);
    process.exit(1);
  } else {
    console.log("\nAll tests passed!");
    process.exit(0);
  }
}

main();