/**
 * Music Label Compliance Reporter
 * 
 * For major music labels to identify and report explicit content
 * for retailer compliance and RIAA Parental Advisory labeling.
 * 
 * This is NOT a content blocker - it's a classification and reporting system
 * to help labels meet their disclosure obligations to retailers.
 */

import { ExplicitDetectionResult } from './explicitContentDetector';

export interface TrackAnalysisReport {
  // Track identification
  trackId: string;
  artist: string;
  title: string;
  album?: string;
  duration?: number;
  
  // Explicit content analysis
  explicitAnalysis: ExplicitDetectionResult;
  
  // Compliance flags
  requiresParentalAdvisory: boolean;
  retailerClassification: 'clean' | 'explicit' | 'edited';
  
  // Recommended actions
  recommendations: {
    riaaLabel: boolean;
    retailerFlag: boolean;
    editedVersionNeeded: boolean;
    regionalRestrictions: string[];
  };
  
  // Timestamps
  analyzedAt: string;
  analystId?: string;
}

export interface BatchAnalysisReport {
  // Batch info
  batchId: string;
  labelName: string;
  releaseDate: string;
  totalTracks: number;
  
  // Analysis summary
  summary: {
    cleanTracks: number;
    explicitTracks: number;
    requiresAdvisory: number;
    needsEditedVersions: number;
  };
  
  // Track reports
  tracks: TrackAnalysisReport[];
  
  // Compliance checklist
  compliance: {
    riaaCompliant: boolean;
    spotifyCompliant: boolean;
    appleMusicCompliant: boolean;
    amazonMusicCompliant: boolean;
    physicalMediaCompliant: boolean;
  };
  
  // Export formats
  exports: {
    csvReport?: string;
    jsonReport?: string;
    xmlReport?: string; // For some retailers
  };
  
  generatedAt: string;
}

export class LabelComplianceReporter {
  private labelName: string;
  private analystId?: string;

  constructor(labelName: string, analystId?: string) {
    this.labelName = labelName;
    this.analystId = analystId;
    
    console.log(`🏷️ Label Compliance Reporter initialized for: ${labelName}`);
  }

  /**
   * Generate compliance report for a single track
   */
  async generateTrackReport(
    trackInfo: {
      trackId: string;
      artist: string;
      title: string;
      album?: string;
      duration?: number;
    },
    explicitAnalysis: ExplicitDetectionResult
  ): Promise<TrackAnalysisReport> {
    
    const requiresParentalAdvisory = this.determineParentalAdvisory(explicitAnalysis);
    const retailerClassification = this.classifyForRetailers(explicitAnalysis);
    const recommendations = this.generateRecommendations(explicitAnalysis);
    
    const report: TrackAnalysisReport = {
      ...trackInfo,
      explicitAnalysis,
      requiresParentalAdvisory,
      retailerClassification,
      recommendations,
      analyzedAt: new Date().toISOString(),
      analystId: this.analystId,
    };

    // Log compliance status
    console.log(`📊 Track Analysis: "${trackInfo.title}" by ${trackInfo.artist}`);
    console.log(`   Classification: ${retailerClassification.toUpperCase()}`);
    console.log(`   RIAA Advisory: ${requiresParentalAdvisory ? 'REQUIRED' : 'Not Required'}`);
    console.log(`   Confidence: ${(explicitAnalysis.confidence * 100).toFixed(1)}%`);
    
    if (explicitAnalysis.reasons.length > 0) {
      console.log(`   Reasons: ${explicitAnalysis.reasons.join(', ')}`);
    }

    return report;
  }

  /**
   * Generate batch compliance report for album/release
   */
  async generateBatchReport(
    tracks: TrackAnalysisReport[],
    releaseInfo: {
      batchId: string;
      releaseDate: string;
    }
  ): Promise<BatchAnalysisReport> {
    
    const summary = this.calculateSummary(tracks);
    const compliance = this.checkRetailerCompliance(tracks);
    const exports = await this.generateExportFormats(tracks, releaseInfo);

    const report: BatchAnalysisReport = {
      batchId: releaseInfo.batchId,
      labelName: this.labelName,
      releaseDate: releaseInfo.releaseDate,
      totalTracks: tracks.length,
      summary,
      tracks,
      compliance,
      exports,
      generatedAt: new Date().toISOString(),
    };

    // Print executive summary
    this.printExecutiveSummary(report);
    
    return report;
  }

  /**
   * Determine if RIAA Parental Advisory label is required
   */
  private determineParentalAdvisory(analysis: ExplicitDetectionResult): boolean {
    // RIAA requires advisory for:
    // 1. Strong language
    // 2. Sexual content
    // 3. Violence
    // 4. Substance abuse
    
    if (!analysis.isExplicit) return false;
    
    // Check if detection reasons align with RIAA criteria
    const riaaReasons = [
      'strong language',
      'sexual content',
      'violence', 
      'substance abuse',
      'profanity detected',
      'explicit lyrical patterns'
    ];
    
    const hasRIAAViolation = analysis.reasons.some(reason =>
      riaaReasons.some(riaaReason => 
        reason.toLowerCase().includes(riaaReason.toLowerCase())
      )
    );
    
    // High confidence explicit content typically requires advisory
    return hasRIAAViolation || (analysis.confidence > 0.7 && analysis.category !== 'mild');
  }

  /**
   * Classify content for major music retailers
   */
  private classifyForRetailers(analysis: ExplicitDetectionResult): 'clean' | 'explicit' | 'edited' {
    if (!analysis.isExplicit || analysis.category === 'clean') {
      return 'clean';
    }
    
    // Check if this appears to be an edited version
    const editedIndicators = [
      'edited',
      'clean version',
      'radio edit',
      'censored',
      'clean',
      'family friendly'
    ];
    
    // This would need to be determined from track metadata or title
    // For now, classify based on explicit level
    if (analysis.category === 'severe' || analysis.category === 'explicit') {
      return 'explicit';
    }
    
    return 'explicit'; // Conservative approach for retailers
  }

  /**
   * Generate actionable recommendations for the label
   */
  private generateRecommendations(analysis: ExplicitDetectionResult) {
    const recommendations = {
      riaaLabel: false,
      retailerFlag: false,
      editedVersionNeeded: false,
      regionalRestrictions: [] as string[],
    };

    if (analysis.isExplicit) {
      recommendations.retailerFlag = true;
      
      if (analysis.confidence > 0.6 || analysis.category === 'explicit' || analysis.category === 'severe') {
        recommendations.riaaLabel = true;
        
        // Suggest edited version for severe content
        if (analysis.category === 'severe' || analysis.confidence > 0.8) {
          recommendations.editedVersionNeeded = true;
        }
        
        // Regional restrictions for very explicit content
        if (analysis.category === 'severe') {
          recommendations.regionalRestrictions.push('EU Digital Services Act compliance review');
          recommendations.regionalRestrictions.push('Australia ACMA review required');
          recommendations.regionalRestrictions.push('UK BBFC age rating consideration');
        }
      }
    }

    return recommendations;
  }

  /**
   * Calculate summary statistics for batch
   */
  private calculateSummary(tracks: TrackAnalysisReport[]) {
    return {
      cleanTracks: tracks.filter(t => t.retailerClassification === 'clean').length,
      explicitTracks: tracks.filter(t => t.retailerClassification === 'explicit').length,
      requiresAdvisory: tracks.filter(t => t.requiresParentalAdvisory).length,
      needsEditedVersions: tracks.filter(t => t.recommendations.editedVersionNeeded).length,
    };
  }

  /**
   * Check compliance with major retailer requirements
   */
  private checkRetailerCompliance(tracks: TrackAnalysisReport[]) {
    const explicitTracks = tracks.filter(t => t.explicitAnalysis.isExplicit);
    
    return {
      // RIAA: Proper advisory labeling
      riaaCompliant: tracks.every(t => 
        !t.requiresParentalAdvisory || t.explicitAnalysis.riaaCompliant
      ),
      
      // Spotify: Explicit flag accuracy  
      spotifyCompliant: tracks.every(t => 
        t.retailerClassification !== 'explicit' || t.explicitAnalysis.confidence > 0.5
      ),
      
      // Apple Music: Conservative explicit flagging
      appleMusicCompliant: tracks.every(t =>
        t.explicitAnalysis.confidence < 0.3 || t.retailerClassification === 'explicit'
      ),
      
      // Amazon Music: Similar to Spotify
      amazonMusicCompliant: tracks.every(t =>
        t.retailerClassification !== 'explicit' || t.explicitAnalysis.confidence > 0.4
      ),
      
      // Physical media: RIAA compliance
      physicalMediaCompliant: explicitTracks.length === 0 || 
        explicitTracks.every(t => t.requiresParentalAdvisory),
    };
  }

  /**
   * Generate export formats for retailers and distributors
   */
  private async generateExportFormats(
    tracks: TrackAnalysisReport[], 
    releaseInfo: { batchId: string; releaseDate: string }
  ) {
    return {
      csvReport: this.generateCSVReport(tracks),
      jsonReport: JSON.stringify({
        release: releaseInfo,
        label: this.labelName,
        tracks: tracks.map(t => ({
          trackId: t.trackId,
          artist: t.artist,
          title: t.title,
          explicit: t.retailerClassification === 'explicit',
          parentalAdvisory: t.requiresParentalAdvisory,
          confidence: t.explicitAnalysis.confidence,
          category: t.explicitAnalysis.category,
        }))
      }, null, 2),
      xmlReport: this.generateXMLReport(tracks, releaseInfo),
    };
  }

  /**
   * Generate CSV report for spreadsheet analysis
   */
  private generateCSVReport(tracks: TrackAnalysisReport[]): string {
    const headers = [
      'Track ID',
      'Artist', 
      'Title',
      'Album',
      'Classification',
      'Parental Advisory Required',
      'Confidence %',
      'Category',
      'Detection Methods',
      'RIAA Compliant',
      'Edited Version Needed'
    ].join(',');

    const rows = tracks.map(track => [
      `"${track.trackId}"`,
      `"${track.artist}"`,
      `"${track.title}"`,
      `"${track.album || ''}"`,
      track.retailerClassification.toUpperCase(),
      track.requiresParentalAdvisory ? 'YES' : 'NO',
      `${(track.explicitAnalysis.confidence * 100).toFixed(1)}%`,
      track.explicitAnalysis.category.toUpperCase(),
      `"${Object.entries(track.explicitAnalysis.detectionMethods)
        .filter(([_, used]) => used)
        .map(([method, _]) => method)
        .join('; ')}"`,
      track.explicitAnalysis.riaaCompliant ? 'YES' : 'NO',
      track.recommendations.editedVersionNeeded ? 'RECOMMENDED' : 'NO'
    ].join(','));

    return [headers, ...rows].join('\n');
  }

  /**
   * Generate XML report for certain distributors
   */
  private generateXMLReport(
    tracks: TrackAnalysisReport[], 
    releaseInfo: { batchId: string; releaseDate: string }
  ): string {
    const tracksXml = tracks.map(track => `
    <track>
      <id>${track.trackId}</id>
      <artist><![CDATA[${track.artist}]]></artist>
      <title><![CDATA[${track.title}]]></title>
      <explicit>${track.retailerClassification === 'explicit'}</explicit>
      <parentalAdvisory>${track.requiresParentalAdvisory}</parentalAdvisory>
      <confidence>${track.explicitAnalysis.confidence}</confidence>
      <category>${track.explicitAnalysis.category}</category>
    </track>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<labelComplianceReport>
  <metadata>
    <batchId>${releaseInfo.batchId}</batchId>
    <label><![CDATA[${this.labelName}]]></label>
    <releaseDate>${releaseInfo.releaseDate}</releaseDate>
    <generatedAt>${new Date().toISOString()}</generatedAt>
  </metadata>
  <tracks>${tracksXml}
  </tracks>
</labelComplianceReport>`;
  }

  /**
   * Print executive summary to console
   */
  private printExecutiveSummary(report: BatchAnalysisReport): void {
    console.log('\n🎵 =============== LABEL COMPLIANCE REPORT ===============');
    console.log(`📅 Release: ${report.batchId} (${report.releaseDate})`);
    console.log(`🏷️ Label: ${report.labelName}`);
    console.log(`📊 Total Tracks: ${report.totalTracks}`);
    console.log('');
    
    console.log('📈 CONTENT CLASSIFICATION SUMMARY:');
    console.log(`   Clean Tracks: ${report.summary.cleanTracks} (${((report.summary.cleanTracks / report.totalTracks) * 100).toFixed(1)}%)`);
    console.log(`   Explicit Tracks: ${report.summary.explicitTracks} (${((report.summary.explicitTracks / report.totalTracks) * 100).toFixed(1)}%)`);
    console.log(`   RIAA Advisory Required: ${report.summary.requiresAdvisory}`);
    console.log(`   Edited Versions Recommended: ${report.summary.needsEditedVersions}`);
    console.log('');
    
    console.log('✅ RETAILER COMPLIANCE STATUS:');
    console.log(`   RIAA Compliant: ${report.compliance.riaaCompliant ? '✅ YES' : '❌ NO'}`);
    console.log(`   Spotify Ready: ${report.compliance.spotifyCompliant ? '✅ YES' : '❌ NO'}`);
    console.log(`   Apple Music Ready: ${report.compliance.appleMusicCompliant ? '✅ YES' : '❌ NO'}`);
    console.log(`   Amazon Music Ready: ${report.compliance.amazonMusicCompliant ? '✅ YES' : '❌ NO'}`);
    console.log(`   Physical Media Ready: ${report.compliance.physicalMediaCompliant ? '✅ YES' : '❌ NO'}`);
    console.log('');
    
    if (report.summary.explicitTracks > 0) {
      console.log('⚠️ EXPLICIT TRACKS REQUIRING ACTION:');
      report.tracks
        .filter(t => t.retailerClassification === 'explicit')
        .forEach(track => {
          console.log(`   • "${track.title}" by ${track.artist}`);
          console.log(`     Classification: EXPLICIT (${(track.explicitAnalysis.confidence * 100).toFixed(1)}% confidence)`);
          console.log(`     RIAA Label: ${track.requiresParentalAdvisory ? 'REQUIRED' : 'Not Required'}`);
          console.log(`     Edited Version: ${track.recommendations.editedVersionNeeded ? 'RECOMMENDED' : 'Optional'}`);
          if (track.recommendations.regionalRestrictions.length > 0) {
            console.log(`     Regional Notes: ${track.recommendations.regionalRestrictions.join(', ')}`);
          }
          console.log('');
        });
    }
    
    console.log('📋 NEXT STEPS FOR LABEL:');
    if (report.summary.requiresAdvisory > 0) {
      console.log('   1. Apply RIAA Parental Advisory labels to flagged tracks');
    }
    if (report.summary.needsEditedVersions > 0) {
      console.log('   2. Consider creating edited versions for severe content');
    }
    console.log('   3. Update retailer metadata with explicit flags');
    console.log('   4. Review regional distribution restrictions');
    console.log('   5. Archive this compliance report for legal records');
    console.log('');
    console.log('💾 Export formats available: CSV, JSON, XML');
    console.log('===============================================\n');
  }
}

export default LabelComplianceReporter;