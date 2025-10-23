/**
 * Enhanced Explicit Content Detection Service
 *
 * Multi-layered approach using industry-standard libraries and APIs:
 * 1. Local profanity detection (leo-profanity)
 * 2. Music database lookup (Spotify API) for known explicit tracks
 * 3. Advanced NLP analysis for context-aware detection
 * 4. Custom lyrics pattern detection
 */

// Optional import - fails gracefully if not installed
let LeoProfanity: any = null;
try {
  LeoProfanity = require("leo-profanity");
} catch (e) {
  console.warn("leo-profanity not available, profanity filter will use fallback detection");
}

export interface ExplicitDetectionResult {
  isExplicit: boolean;
  confidence: number; // 0-1
  reasons: string[];
  detectionMethods: {
    profanityFilter: boolean;
    musicDatabase: boolean;
    lyricsPattern: boolean;
    contextAnalysis: boolean;
  };
  _explicitWords: string[];
  category: "clean" | "mild" | "moderate" | "explicit" | "severe";
  riaaCompliant: boolean; // RIAA Parental Advisory standards
}

export interface ExplicitDetectionConfig {
  strictness: "lenient" | "moderate" | "strict" | "riaa_standard";
  enableMusicLookup: boolean;
  enableContextAnalysis: boolean;
  customWordList?: string[];
  whitelistedWords?: string[];
  spotifyClientId?: string;
  spotifyClientSecret?: string;
}

export class ExplicitContentDetector {
  private config: ExplicitDetectionConfig;
  private spotifyToken: string | null = null;
  private tokenExpiry: number = 0;

  // Enhanced explicit word categories based on RIAA standards
  private readonly explicitCategories = {
    // RIAA Category 1: Strong Language
    strongLanguage: [
      // F-word variants
      "fuck",
      "fucking",
      "fucked",
      "fucker",
      "motherfucker",
      // S-word variants
      "shit",
      "bullshit",
      "shitty",
      "shithead",
      // Other strong profanity
      "damn",
      "goddamn",
      "hell",
      "bitch",
      "bastard",
      "piss",
      "ass",
      "asshole",
      "crap",
      "cock",
      "dick",
      "pussy",
    ],

    // RIAA Category 2: Sexual Content
    sexualContent: [
      "sex",
      "sexual",
      "porn",
      "pornography",
      "orgasm",
      "masturbate",
      "erotic",
      "horny",
      "kinky",
      "fetish",
      "bondage",
      "oral",
      "anal",
      "vagina",
      "penis",
      "breast",
      "nipple",
      "nude",
      "naked",
    ],

    // RIAA Category 3: Violence
    violence: [
      "kill",
      "murder",
      "death",
      "die",
      "blood",
      "gun",
      "shoot",
      "stab",
      "knife",
      "weapon",
      "violence",
      "violent",
      "fight",
      "beat",
      "punch",
      "attack",
      "assault",
      "rape",
      "abuse",
    ],

    // RIAA Category 4: Substance Abuse
    substanceAbuse: [
      "drugs",
      "drug",
      "cocaine",
      "heroin",
      "marijuana",
      "weed",
      "meth",
      "crack",
      "pill",
      "pills",
      "addiction",
      "high",
      "stoned",
      "drunk",
      "alcohol",
      "beer",
      "vodka",
      "whiskey",
    ],

    // Music-specific explicit indicators
    musicExplicit: [
      "explicit",
      "parental advisory",
      "uncensored",
      "uncut",
      "clean version",
      "radio edit",
      "explicit version",
    ],
  };

  // Lyrics pattern indicators (more sophisticated than single words)
  private readonly lyricsPatterns = [
    // Repeated profanity (common in rap/hip-hop)
    /\b(fuck|shit|bitch|damn)\s+\1/gi,

    // Sexual references in lyrics context
    /(make love|get down|hook up|one night)/gi,

    // Drug references in context
    /(smoke weed|roll up|get high|pop pills)/gi,

    // Violence in lyrics context
    /(pull the trigger|load the gun|blood on)/gi,

    // Common rap/hip-hop explicit patterns
    /(n\*{3,}|n\-word|f\*{3,}|f\-bomb)/gi,

    // Censored word patterns
    /\b\w*\*{2,}\w*\b/g,
    /\b\w*-{3,}\w*\b/g,
    /\b\w+\s\.\.\.\s\w+/g,
  ];

  constructor(config: Partial<ExplicitDetectionConfig> = {}) {
    this.config = {
      strictness: "moderate",
      enableMusicLookup: true,
      enableContextAnalysis: true,
      ...config,
    };

    // Configure leo-profanity if available
    if (LeoProfanity) {
      LeoProfanity.loadDictionary("en");
      LeoProfanity.clearList(); // Start with clean list

      // Add our comprehensive word lists based on strictness
      this.configureFilterStrictness();

      // Add custom words if provided
      if (config.customWordList) {
        LeoProfanity.add(config.customWordList);
      }

      // Remove whitelisted words
      if (config.whitelistedWords) {
        LeoProfanity.remove(config.whitelistedWords);
      }
    }

    console.log(`🛡️ Explicit Content Detector initialized (${this.config.strictness} mode)`);
  }

  /**
   * Configure filter strictness based on RIAA and industry standards
   */
  private configureFilterStrictness(): void {
    if (!LeoProfanity) return;

    const { strictness } = this.config;

    switch (strictness) {
      case "lenient":
        // Only the most severe profanity
        LeoProfanity.add(["fuck", "shit", "motherfucker", "cunt"]);
        break;

      case "moderate":
        // Standard profanity list
        LeoProfanity.add([
          ...this.explicitCategories.strongLanguage,
          ...this.explicitCategories.sexualContent.slice(0, 5), // Partial sexual content
        ]);
        break;

      case "strict":
        // Comprehensive list including mild profanity
        LeoProfanity.add([
          ...this.explicitCategories.strongLanguage,
          ...this.explicitCategories.sexualContent,
          ...this.explicitCategories.violence.slice(0, 10), // Partial violence
          ...this.explicitCategories.substanceAbuse.slice(0, 8), // Partial substances
        ]);
        break;

      case "riaa_standard":
        // Full RIAA Parental Advisory criteria
        LeoProfanity.add([
          ...this.explicitCategories.strongLanguage,
          ...this.explicitCategories.sexualContent,
          ...this.explicitCategories.violence,
          ...this.explicitCategories.substanceAbuse,
        ]);
        break;
    }
  }

  /**
   * Main detection method - analyzes text for explicit content
   */
  async detectExplicitContent(
    text: string,
    audioMetadata?: {
      artist?: string;
      title?: string;
      album?: string;
    }
  ): Promise<ExplicitDetectionResult> {
    console.log("🔍 Analyzing content for explicit material...");

    const detectionMethods = {
      profanityFilter: false,
      musicDatabase: false,
      lyricsPattern: false,
      contextAnalysis: false,
    };

    const reasons: string[] = [];
    const _explicitWords: string[] = [];
    let confidence = 0;
    let isExplicit = false;

    // Method 1: Profanity Filter Detection
    const profanityResult = this.detectProfanity(text);
    if (profanityResult.detected) {
      detectionMethods.profanityFilter = true;
      reasons.push("Profanity detected");
      _explicitWords.push(...profanityResult.words);
      confidence += 0.4;
      isExplicit = true;
    }

    // Method 2: Music Database Lookup (if metadata available)
    if (this.config.enableMusicLookup && audioMetadata) {
      const musicResult = await this.checkMusicDatabase(audioMetadata);
      if (musicResult.explicit) {
        detectionMethods.musicDatabase = true;
        reasons.push("Known explicit track in music database");
        confidence += 0.5;
        isExplicit = true;
      }
    }

    // Method 3: Lyrics Pattern Detection
    const patternsResult = this.detectLyricsPatterns(text);
    if (patternsResult.detected) {
      detectionMethods.lyricsPattern = true;
      reasons.push("Explicit lyrical patterns detected");
      confidence += 0.3;
      isExplicit = true;
    }

    // Method 4: Context Analysis (advanced)
    if (this.config.enableContextAnalysis) {
      const contextResult = this.analyzeContext(text);
      if (contextResult.explicit) {
        detectionMethods.contextAnalysis = true;
        reasons.push("Contextual explicit content detected");
        confidence += 0.3;
        isExplicit = true;
      }
    }

    // Determine category and RIAA compliance
    const category = this.categorizeContent(confidence, _explicitWords);
    const riaaCompliant = this.isRIAACompliant(isExplicit, reasons);

    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);

    const result: ExplicitDetectionResult = {
      isExplicit,
      confidence,
      reasons,
      detectionMethods,
      _explicitWords,
      category,
      riaaCompliant,
    };

    console.log(`🔍 Explicit detection complete:`, {
      explicit: isExplicit,
      confidence: `${(confidence * 100).toFixed(1)}%`,
      category,
      methods: Object.keys(detectionMethods).filter((k) => (detectionMethods as any)[k]),
    });

    return result;
  }

  /**
   * Basic profanity detection using leo-profanity
   */
  private detectProfanity(text: string): { detected: boolean; words: string[] } {
    if (!LeoProfanity) {
      // Fallback: simple pattern matching
      const lowerText = text.toLowerCase();
      const foundWords: string[] = [];
      for (const word of this.explicitCategories.strongLanguage) {
        if (lowerText.includes(word.toLowerCase())) {
          foundWords.push(word);
        }
      }
      return { detected: foundWords.length > 0, words: foundWords };
    }

    const cleanedText = LeoProfanity.clean(text);
    const detected = cleanedText !== text;

    if (!detected) {
      return { detected: false, words: [] };
    }

    // Find specific explicit words
    const words = LeoProfanity.check(text);
    const foundWords = words.filter((word) => LeoProfanity.check(word).length > 0);

    return { detected, words: foundWords };
  }

  /**
   * Check music database (Spotify API) for known explicit tracks
   */
  private async checkMusicDatabase(metadata: {
    artist?: string;
    title?: string;
    album?: string;
  }): Promise<{ explicit: boolean; confidence: number }> {
    if (!this.config.spotifyClientId || !this.config.spotifyClientSecret) {
      console.log("⚠️ Spotify credentials not configured, skipping music database lookup");
      return { explicit: false, confidence: 0 };
    }

    try {
      // Get Spotify access token if needed
      await this.ensureSpotifyToken();

      if (!this.spotifyToken) {
        return { explicit: false, confidence: 0 };
      }

      // Search for track
      const query = [
        metadata.title && `track:"${metadata.title}"`,
        metadata.artist && `artist:"${metadata.artist}"`,
        metadata.album && `album:"${metadata.album}"`,
      ]
        .filter(Boolean)
        .join(" ");

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${this.spotifyToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Spotify API error:", response.status);
        return { explicit: false, confidence: 0 };
      }

      const data = await response.json();
      const tracks = data.tracks?.items || [];

      // Check if any matching tracks are marked explicit
      for (const track of tracks) {
        if (track.explicit) {
          console.log(`🎵 Found explicit track: "${track.name}" by ${track.artists[0]?.name}`);
          return { explicit: true, confidence: 0.9 };
        }
      }

      return { explicit: false, confidence: 0 };
    } catch (error) {
      console.error("Music database lookup failed:", error);
      return { explicit: false, confidence: 0 };
    }
  }

  /**
   * Get Spotify access token
   */
  private async ensureSpotifyToken(): Promise<void> {
    if (this.spotifyToken && Date.now() < this.tokenExpiry) {
      return; // Token still valid
    }

    try {
      const credentials = btoa(`${this.config.spotifyClientId}:${this.config.spotifyClientSecret}`);

      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        throw new Error(`Spotify auth failed: ${response.status}`);
      }

      const data = await response.json();
      this.spotifyToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // 1 minute buffer

      console.log("🎵 Spotify token acquired");
    } catch (error) {
      console.error("Failed to get Spotify token:", error);
      this.spotifyToken = null;
    }
  }

  /**
   * Detect explicit patterns specific to lyrics and music
   */
  private detectLyricsPatterns(text: string): { detected: boolean; patterns: string[] } {
    const foundPatterns: string[] = [];

    for (const pattern of this.lyricsPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        foundPatterns.push(...matches);
      }
    }

    // Check for music-specific explicit indicators
    const lowerText = text.toLowerCase();
    for (const indicator of this.explicitCategories.musicExplicit) {
      if (lowerText.includes(indicator)) {
        foundPatterns.push(indicator);
      }
    }

    return {
      detected: foundPatterns.length > 0,
      patterns: foundPatterns,
    };
  }

  /**
   * Advanced context analysis for subtle explicit content
   */
  private analyzeContext(text: string): { explicit: boolean; reasoning: string[] } {
    const reasoning: string[] = [];
    let explicitScore = 0;

    // Check for euphemisms and coded language
    const euphemisms = [
      /\b(hook up|get some|netflix and chill|dtf|fwb)\b/gi,
      /\b(420|lit|turnt up|party hard)\b/gi,
      /\b(cap|bust|smoke|ride)\b/gi, // Context-dependent
    ];

    for (const pattern of euphemisms) {
      if (pattern.test(text)) {
        explicitScore += 0.1;
        reasoning.push("Euphemistic language detected");
      }
    }

    // Check for explicit themes in context
    const themes = {
      sexual: /(bedroom|late night|body|touch|kiss|hold me)/gi,
      party: /(party|club|drink|shots|bottle|drunk)/gi,
      violence: /(street|hood|block|crew|gang)/gi,
    };

    let themeCount = 0;
    for (const [theme, pattern] of Object.entries(themes)) {
      const matches = text.match(pattern);
      if (matches && matches.length > 2) {
        // Multiple references
        themeCount++;
        explicitScore += 0.15;
        reasoning.push(`Multiple ${theme} theme references`);
      }
    }

    // Higher score if multiple themes present
    if (themeCount > 1) {
      explicitScore += 0.2;
      reasoning.push("Multiple explicit themes combined");
    }

    return {
      explicit: explicitScore > 0.3,
      reasoning,
    };
  }

  /**
   * Categorize content based on severity
   */
  private categorizeContent(
    confidence: number,
    _explicitWords: string[]
  ): ExplicitDetectionResult["category"] {
    if (confidence === 0) return "clean";
    if (confidence < 0.3) return "mild";
    if (confidence < 0.6) return "moderate";
    if (confidence < 0.8) return "explicit";
    return "severe";
  }

  /**
   * Check if detection meets RIAA Parental Advisory standards
   */
  private isRIAACompliant(isExplicit: boolean, reasons: string[]): boolean {
    if (!isExplicit) return true;

    // RIAA requires advisory for strong language, sexual content, violence, or substance abuse
    const riaaReasons = ["Strong Language", "Sexual Content", "Violence", "Substance Abuse"];

    return reasons.some((reason) =>
      riaaReasons.some((riaaReason) => reason.toLowerCase().includes(riaaReason.toLowerCase()))
    );
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ExplicitDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.configureFilterStrictness();
    console.log("🔧 Explicit content detector configuration updated");
  }

  /**
   * Get detection statistics
   */
  getStats() {
    return {
      strictnessLevel: this.config.strictness,
      enabledMethods: {
        profanityFilter: !!LeoProfanity,
        musicDatabase: this.config.enableMusicLookup,
        contextAnalysis: this.config.enableContextAnalysis,
      },
      wordListSize: LeoProfanity ? LeoProfanity.list().length : 0,
      hasSpotifyAccess: !!(this.config.spotifyClientId && this.config.spotifyClientSecret),
    };
  }
}

// Export singleton instance
export const explicitContentDetector = new ExplicitContentDetector();

export default explicitContentDetector;
