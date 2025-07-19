import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Демонстрация единого отчета покрытия UI элементов
 * Показывает агрегированные данные по всем тестам в одном отчете
 */
async function runUnifiedCoverageDemo() {
  console.log('\n🎯 === ДЕМОНСТРАЦИЯ ЕДИНОГО ОТЧЕТА ПОКРЫТИЯ ===\n');
  
  console.log('📝 Что будет продемонстрировано:');
  console.log('   • Выполнение 5 тестов с разным уровнем покрытия');
  console.log('   • Агрегация данных всех тестов в единый отчет');
  console.log('   • Статистика по тестам, страницам и типам элементов');
  console.log('   • Рекомендации по улучшению покрытия');
  console.log('   • Интерактивный HTML отчет с вкладками\n');

  // Очистка предыдущих отчетов
  const unifiedDir = 'unified-coverage';
  if (fs.existsSync(unifiedDir)) {
    fs.rmSync(unifiedDir, { recursive: true, force: true });
  }
  
  console.log('🧹 Очищены предыдущие отчеты\n');
  
  try {
    console.log('🚀 Запуск тестов с единым трекингом покрытия...\n');
    
    // Запуск тестов с единым покрытием
    const testCommand = 'npx playwright test tests/unified-coverage.spec.js --reporter=list';
    
    console.log(`Выполняется команда: ${testCommand}\n`);
    
    const output = execSync(testCommand, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('📊 Результаты выполнения тестов:');
    console.log(output);
    
  } catch (error) {
    console.log('⚠️ Тесты завершены с ошибками (это ожидаемо для демонстрации):');
    console.log(error.stdout || error.message);
  }
  
  // Проверка созданных отчетов
  console.log('\n📁 Проверка созданных отчетов...');
  
  if (fs.existsSync(unifiedDir)) {
    const files = fs.readdirSync(unifiedDir);
    console.log(`✅ Создано файлов в ${unifiedDir}/:`, files.length);
    
    files.forEach(file => {
      const filePath = path.join(unifiedDir, file);
      const stats = fs.statSync(filePath);
      console.log(`   📄 ${file} (${Math.round(stats.size / 1024)}KB)`);
    });
    
    // Поиск HTML отчета
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    if (htmlFiles.length > 0) {
      const htmlPath = path.join(unifiedDir, htmlFiles[0]);
      const fullPath = path.resolve(htmlPath);
      console.log(`\n🌐 HTML отчет доступен по адресу:`);
      console.log(`   file://${fullPath}`);
    }
    
    // Поиск JSON отчета для анализа
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    if (jsonFiles.length > 0) {
      const jsonPath = path.join(unifiedDir, jsonFiles[0]);
      try {
        const reportData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        console.log('\n📊 === КРАТКАЯ СТАТИСТИКА ЕДИНОГО ОТЧЕТА ===');
        console.log(`🎯 Сессия: ${reportData.globalSession?.sessionName || 'N/A'}`);
        console.log(`🧪 Тестов: ${reportData.globalSession?.totalTests || 0} (✅${reportData.globalSession?.testsPassed || 0} ❌${reportData.globalSession?.testsFailed || 0})`);
        console.log(`📊 Элементов: ${reportData.summary?.totalElements || 0} (✅${reportData.summary?.coveredElements || 0} ❌${reportData.summary?.uncoveredElements || 0})`);
        console.log(`📈 Покрытие: ${reportData.summary?.coveragePercentage || 0}%`);
        console.log(`🎯 Взаимодействий: ${reportData.aggregatedStats?.totalInteractions || 0}`);
        
        if (reportData.testsDetails && reportData.testsDetails.length > 0) {
          console.log('\n🏆 Результаты по тестам:');
          reportData.testsDetails
            .sort((a, b) => b.coveragePercentage - a.coveragePercentage)
            .forEach(test => {
              const status = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏳';
              console.log(`   ${status} ${test.name}: ${test.coveragePercentage}% (${test.elementsCovered}/${test.elementsFound})`);
            });
        }
        
        if (reportData.topUncoveredElements?.byType) {
          console.log('\n⚠️ Топ непокрытых элементов:');
          reportData.topUncoveredElements.byType.slice(0, 3).forEach(item => {
            console.log(`   📋 ${item.type}: ${item.count} элементов`);
          });
        }
        
        if (reportData.unifiedRecommendations && reportData.unifiedRecommendations.length > 0) {
          console.log('\n💡 Главные рекомендации:');
          reportData.unifiedRecommendations.slice(0, 3).forEach(rec => {
            const priority = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
            console.log(`   ${priority} [${rec.priority}] ${rec.category}: ${rec.message}`);
          });
        }
        
      } catch (error) {
        console.log('⚠️ Не удалось прочитать JSON отчет:', error.message);
      }
    }
    
  } else {
    console.log('❌ Директория с отчетами не найдена');
  }
  
  console.log('\n🎯 === ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА ===');
  console.log('\n📋 Ключевые особенности единого отчета:');
  console.log('   ✅ Агрегация данных всех тестов');
  console.log('   ✅ Статистика по каждому тесту');
  console.log('   ✅ Покрытие по типам элементов и страницам');
  console.log('   ✅ Рейтинг тестов по эффективности');
  console.log('   ✅ Топ непокрытых элементов');
  console.log('   ✅ Рекомендации по улучшению');
  console.log('   ✅ Интерактивный HTML интерфейс');
  console.log('\n💡 Преимущества единого отчета:');
  console.log('   • Полная картина покрытия проекта');
  console.log('   • Сравнение эффективности тестов');
  console.log('   • Выявление общих проблем');
  console.log('   • Централизованные рекомендации');
}

// Запуск демонстрации
if (import.meta.url === `file://${process.argv[1]}`) {
  runUnifiedCoverageDemo().catch(console.error);
} 