// src/infrastructure/reporters/AllureReporter.js

export class AllureReporter {
  constructor(config) {
    this.config = config;
  }

  getName() { return 'Allure Reporter'; }

  async generate(results) {
    const { createAllureAttachment } = await import('./allureUtils.js');

    console.log(`🎯 Allure Reporter: Processing ${results.length} results...`);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.aiResponse && result.testError) {
        console.log(`\n📋 Processing result ${i + 1}/${results.length}:`);
        console.log(`   Test error file: ${result.testError.filePath}`);
        console.log(`   Test error content length: ${result.testError.content?.length || 0} chars`);
        console.log(`   AI response length: ${result.aiResponse.content?.length || 0} chars`);

        await createAllureAttachment(
          result.aiResponse.content,
          result.testError.content,
          this.config,
          i,
          result.testError.filePath
        );
      } else {
        console.log(`⚠️  Skipping result ${i + 1}: missing aiResponse or testError`);
        if (!result.aiResponse) console.log(`     Missing aiResponse`);
        if (!result.testError) console.log(`     Missing testError`);
      }
    }

    console.log(`\n✅ Allure Reporter: Completed processing ${results.length} results`);
  }
}
