#!/usr/bin/env ts-node

/**
 * Master Crawler Orchestrator
 *
 * Runs all crawlers in sequence with:
 * - Unified deduplication
 * - Standardized embeddings
 * - Comprehensive error handling
 * - Progress tracking
 */

import { config } from 'dotenv';
import { aomaFirecrawl } from '@/services/aomaFirecrawlService';
import confluenceCrawler from '@/services/confluenceCrawler';
import sonyMusicJiraCrawler from '@/services/sonyMusicJiraCrawler';
import { getDeduplicationService } from '@/services/deduplicationService';
import { validateSonyMusicContent } from '@/lib/supabase';

// Load environment variables
config({ path: '.env.local' });

interface CrawlResult {
  source: string;
  success: boolean;
  itemsCrawled: number;
  vectorsUpserted: number;
  skipped: number;
  errors: string[];
  duration: number;
}

interface MasterCrawlSummary {
  startTime: string;
  endTime: string;
  duration: number;
  results: CrawlResult[];
  totalItems: number;
  totalVectors: number;
  totalSkipped: number;
  totalErrors: number;
}

class MasterCrawler {
  private summary: MasterCrawlSummary;
  private dedupService = getDeduplicationService();

  constructor() {
    this.summary = {
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0,
      results: [],
      totalItems: 0,
      totalVectors: 0,
      totalSkipped: 0,
      totalErrors: 0,
    };
  }

  /**
   * Run all crawlers
   */
  async runAll(options: {
    sources?: ('aoma' | 'confluence' | 'jira')[];
    deduplicate?: boolean;
    cleanFirst?: boolean;
  } = {}) {
    const {
      sources = ['aoma', 'confluence', 'jira'],
      deduplicate = true,
      cleanFirst = false,
    } = options;

    console.log('🚀 MASTER CRAWLER STARTING\n');
    console.log('═'.repeat(70));
    console.log(`\nOptions:`);
    console.log(`  Sources: ${sources.join(', ')}`);
    console.log(`  Deduplication: ${deduplicate ? 'ON' : 'OFF'}`);
    console.log(`  Clean first: ${cleanFirst ? 'YES' : 'NO'}`);
    console.log('\n' + '═'.repeat(70) + '\n');

    // Optional: Clean duplicates first
    if (cleanFirst) {
      await this.cleanExistingDuplicates();
    }

    // Run each crawler
    if (sources.includes('aoma')) {
      await this.crawlAOMA();
    }

    if (sources.includes('confluence')) {
      await this.crawlConfluence();
    }

    if (sources.includes('jira')) {
      await this.crawlJira();
    }

    // Finalize summary
    this.summary.endTime = new Date().toISOString();
    this.summary.duration =
      new Date(this.summary.endTime).getTime() -
      new Date(this.summary.startTime).getTime();

    // Calculate totals
    this.summary.totalItems = this.summary.results.reduce(
      (sum, r) => sum + r.itemsCrawled,
      0
    );
    this.summary.totalVectors = this.summary.results.reduce(
      (sum, r) => sum + r.vectorsUpserted,
      0
    );
    this.summary.totalSkipped = this.summary.results.reduce(
      (sum, r) => sum + r.skipped,
      0
    );
    this.summary.totalErrors = this.summary.results.reduce(
      (sum, r) => sum + r.errors.length,
      0
    );

    // Print summary
    this.printSummary();

    // Optional: Final deduplication pass
    if (deduplicate) {
      await this.finalDeduplicationPass();
    }

    // Validate final state
    await this.validateFinalState();

    return this.summary;
  }

  /**
   * Crawl AOMA with Firecrawl
   */
  private async crawlAOMA() {
    console.log('\n📱 CRAWLING AOMA (Firecrawl)\n');
    const startTime = Date.now();

    try {
      const result = await aomaFirecrawl.crawlAomaContent({
        maxPages: 10,
        includePaths: [
          '/aoma-ui/my-aoma-files',
          '/aoma-ui/simple-upload',
          '/aoma-ui/direct-upload',
          '/aoma-ui/product-metadata-viewer',
          '/aoma-ui/unified-submission-tool',
        ],
      });

      const duration = Date.now() - startTime;

      this.summary.results.push({
        source: 'aoma',
        success: result.success,
        itemsCrawled: result.pagesProcessed,
        vectorsUpserted: result.pagesProcessed - result.errors.length,
        skipped: 0,
        errors: result.errors,
        duration,
      });

      console.log(`✅ AOMA crawl completed in ${(duration / 1000).toFixed(1)}s`);
      console.log(`   Pages: ${result.pagesProcessed}`);
      console.log(`   Errors: ${result.errors.length}`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ AOMA crawl failed: ${error.message}`);

      this.summary.results.push({
        source: 'aoma',
        success: false,
        itemsCrawled: 0,
        vectorsUpserted: 0,
        skipped: 0,
        errors: [error.message],
        duration,
      });
    }
  }

  /**
   * Crawl Confluence
   */
  private async crawlConfluence() {
    console.log('\n📚 CRAWLING CONFLUENCE\n');
    const startTime = Date.now();

    try {
      const result = await confluenceCrawler.crawlSpaces({
        spaces: ['AOMA', 'USM', 'TECH', 'API'],
        maxPagesPerSpace: 50,
      });

      const duration = Date.now() - startTime;

      this.summary.results.push({
        source: 'confluence',
        success: true,
        itemsCrawled: result.pagesCrawled,
        vectorsUpserted: result.vectorsUpserted,
        skipped: 0,
        errors: [],
        duration,
      });

      console.log(`✅ Confluence crawl completed in ${(duration / 1000).toFixed(1)}s`);
      console.log(`   Pages: ${result.pagesCrawled}`);
      console.log(`   Vectors: ${result.vectorsUpserted}`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Confluence crawl failed: ${error.message}`);

      this.summary.results.push({
        source: 'confluence',
        success: false,
        itemsCrawled: 0,
        vectorsUpserted: 0,
        skipped: 0,
        errors: [error.message],
        duration,
      });
    }
  }

  /**
   * Crawl Jira
   */
  private async crawlJira() {
    console.log('\n🎫 CRAWLING JIRA (Sony Music)\n');
    const startTime = Date.now();

    try {
      const result = await sonyMusicJiraCrawler.crawlProjects({
        projects: ['AOMA', 'USM', 'TECH', 'API'],
        sinceDays: 30, // Last 30 days
      });

      const duration = Date.now() - startTime;

      this.summary.results.push({
        source: 'jira',
        success: true,
        itemsCrawled: result.issuesCrawled,
        vectorsUpserted: result.vectorsUpserted,
        skipped: 0,
        errors: [],
        duration,
      });

      console.log(`✅ Jira crawl completed in ${(duration / 1000).toFixed(1)}s`);
      console.log(`   Issues: ${result.issuesCrawled}`);
      console.log(`   Vectors: ${result.vectorsUpserted}`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`❌ Jira crawl failed: ${error.message}`);

      this.summary.results.push({
        source: 'jira',
        success: false,
        itemsCrawled: 0,
        vectorsUpserted: 0,
        skipped: 0,
        errors: [error.message],
        duration,
      });
    }
  }

  /**
   * Clean existing duplicates before crawling
   */
  private async cleanExistingDuplicates() {
    console.log('\n🧹 CLEANING EXISTING DUPLICATES\n');

    try {
      const { duplicates, totalDuplicates } =
        await this.dedupService.findDuplicatesInDatabase({
          keepNewest: true,
        });

      if (totalDuplicates === 0) {
        console.log('   ✅ No duplicates found');
        return;
      }

      console.log(`   Found ${totalDuplicates} duplicates in ${duplicates.length} groups`);

      // Remove duplicates
      const removeIds = duplicates.flatMap((dup) => dup.removeIds);
      const { removed, errors } = await this.dedupService.removeDuplicates(removeIds);

      console.log(`   ✅ Removed ${removed} duplicates`);
      if (errors > 0) {
        console.log(`   ⚠️  ${errors} errors during removal`);
      }
    } catch (error: any) {
      console.error(`   ❌ Deduplication failed: ${error.message}`);
    }
  }

  /**
   * Final deduplication pass after all crawls
   */
  private async finalDeduplicationPass() {
    console.log('\n🔍 FINAL DEDUPLICATION PASS\n');

    try {
      const { duplicates, totalDuplicates } =
        await this.dedupService.findDuplicatesInDatabase({
          keepNewest: true,
        });

      if (totalDuplicates === 0) {
        console.log('   ✅ No duplicates found');
        return;
      }

      console.log(`   Found ${totalDuplicates} new duplicates`);

      // Remove duplicates
      const removeIds = duplicates.flatMap((dup) => dup.removeIds);
      const { removed, errors } = await this.dedupService.removeDuplicates(removeIds);

      console.log(`   ✅ Removed ${removed} duplicates`);
      this.summary.totalSkipped += removed;

      if (errors > 0) {
        console.log(`   ⚠️  ${errors} errors during removal`);
      }
    } catch (error: any) {
      console.error(`   ❌ Final deduplication failed: ${error.message}`);
    }
  }

  /**
   * Validate final database state
   */
  private async validateFinalState() {
    console.log('\n✅ VALIDATING FINAL STATE\n');

    try {
      const counts = await validateSonyMusicContent();

      console.log('   Final vector counts:');
      Object.entries(counts).forEach(([source, count]) => {
        console.log(`   📦 ${source}: ${count} vectors`);
      });

      const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
      console.log(`\n   Total: ${total} vectors`);
    } catch (error: any) {
      console.error(`   ❌ Validation failed: ${error.message}`);
    }
  }

  /**
   * Print final summary
   */
  private printSummary() {
    console.log('\n' + '═'.repeat(70));
    console.log('\n📊 CRAWL SUMMARY\n');
    console.log('═'.repeat(70));

    this.summary.results.forEach((result) => {
      const icon = result.success ? '✅' : '❌';
      console.log(`\n${icon} ${result.source.toUpperCase()}`);
      console.log(`   Duration: ${(result.duration / 1000).toFixed(1)}s`);
      console.log(`   Items Crawled: ${result.itemsCrawled}`);
      console.log(`   Vectors Upserted: ${result.vectorsUpserted}`);
      console.log(`   Skipped: ${result.skipped}`);
      console.log(`   Errors: ${result.errors.length}`);

      if (result.errors.length > 0) {
        console.log(`   Error Details:`);
        result.errors.slice(0, 3).forEach((err) => {
          console.log(`     - ${err.substring(0, 100)}`);
        });
        if (result.errors.length > 3) {
          console.log(`     ... and ${result.errors.length - 3} more`);
        }
      }
    });

    console.log('\n' + '═'.repeat(70));
    console.log('\n📈 TOTALS:\n');
    console.log(`   Total Items: ${this.summary.totalItems}`);
    console.log(`   Total Vectors: ${this.summary.totalVectors}`);
    console.log(`   Total Skipped: ${this.summary.totalSkipped}`);
    console.log(`   Total Errors: ${this.summary.totalErrors}`);
    console.log(
      `   Total Duration: ${(this.summary.duration / 1000 / 60).toFixed(1)} minutes`
    );
    console.log('\n' + '═'.repeat(70) + '\n');
  }
}

// Run if called directly
if (require.main === module) {
  const crawler = new MasterCrawler();

  const args = process.argv.slice(2);
  const options: any = {
    sources: ['aoma', 'confluence', 'jira'],
    deduplicate: true,
    cleanFirst: args.includes('--clean'),
  };

  // Parse source flags
  if (args.includes('--aoma-only')) {
    options.sources = ['aoma'];
  } else if (args.includes('--confluence-only')) {
    options.sources = ['confluence'];
  } else if (args.includes('--jira-only')) {
    options.sources = ['jira'];
  }

  crawler
    .runAll(options)
    .then(() => {
      console.log('✨ Master crawl complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Master crawl failed:', error);
      process.exit(1);
    });
}

export default MasterCrawler;
