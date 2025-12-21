/**
 * Seed RLHF Demo Data with Retrieved Contexts
 *
 * Creates high-quality demo feedback records that showcase
 * the full RLHF curation workflow including document relevance marking.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const demoFeedbackRecords = [
  {
    session_id: "demo-rlhf-001",
    query: "How do I configure asset metadata in AOMA?",
    response: `To configure asset metadata in AOMA, navigate to the Asset Management module and select your asset. Click the "Metadata" tab to access configuration options. You can set required fields like title, artist, release date, and ISRC codes. Custom metadata fields can be added through the Settings > Metadata Schema page.`,
    feedback_type: "thumbs_up",
    feedback_value: { thumbs_up: true },
    retrieved_contexts: [
      {
        content: "Asset metadata configuration is handled through the Asset Management module. Navigate to Assets > Select Asset > Metadata tab to view and edit metadata fields.",
        source_type: "wiki",
        source: "AOMA User Guide - Asset Management",
        score: 0.92,
        similarity: 0.92
      },
      {
        content: "Custom metadata schemas can be defined in Settings > Metadata Schema. This allows organizations to add industry-specific fields beyond the default DDEX standards.",
        source_type: "wiki",
        source: "AOMA Admin Guide - Custom Fields",
        score: 0.87,
        similarity: 0.87
      },
      {
        content: "ISRC codes are automatically validated against the IFPI database when entered. Invalid codes will trigger a warning but can still be saved with curator approval.",
        source_type: "knowledge",
        source: "AOMA Technical Reference",
        score: 0.78,
        similarity: 0.78
      }
    ],
    organization: "sony-music",
    division: "digital-operations",
    app_under_test: "aoma",
    status: "pending"
  },
  {
    session_id: "demo-rlhf-002",
    query: "What's the difference between a product and an offering in AOMA?",
    response: `In AOMA, a Product represents the creative work (album, single, EP) while an Offering represents a specific commercial release of that product. One product can have multiple offerings - for example, a standard album product might have offerings for Spotify, Apple Music, and Amazon Music, each with different territories and pricing.`,
    feedback_type: "rating",
    feedback_value: { rating: 5 },
    retrieved_contexts: [
      {
        content: "Products are the core creative assets in AOMA representing albums, singles, EPs, or compilations. Each product has a unique identifier and contains tracks, artwork, and metadata.",
        source_type: "wiki",
        source: "AOMA Concepts - Products",
        score: 0.95,
        similarity: 0.95
      },
      {
        content: "Offerings represent the commercial distribution of products to specific DSPs. An offering includes territory restrictions, pricing tier, release date, and platform-specific metadata requirements.",
        source_type: "wiki",
        source: "AOMA Concepts - Offerings",
        score: 0.93,
        similarity: 0.93
      },
      {
        content: "The Product-Offering relationship follows a one-to-many pattern. This allows a single creative work to be distributed with different configurations across multiple platforms.",
        source_type: "knowledge",
        source: "AOMA Architecture Overview",
        score: 0.88,
        similarity: 0.88
      },
      {
        content: "Territory restrictions on offerings are managed through the Rights module. Each offering inherits rights from the product but can have additional platform-specific restrictions.",
        source_type: "wiki",
        source: "AOMA Rights Management",
        score: 0.72,
        similarity: 0.72
      }
    ],
    organization: "sony-music",
    division: "digital-operations",
    app_under_test: "aoma",
    status: "pending"
  },
  {
    session_id: "demo-rlhf-003",
    query: "How do I troubleshoot failed deliveries to Spotify?",
    response: `For failed Spotify deliveries, check the Delivery Status page for specific error codes. Common issues include: missing ISRC codes (error 4001), invalid artwork dimensions (error 4002), or territory conflicts (error 4003). You can retry failed deliveries from the Actions menu after resolving the underlying issue.`,
    feedback_type: "thumbs_down",
    feedback_value: {
      thumbs_up: false,
      feedbackText: "Missing information about how to access delivery logs and the retry cooldown period"
    },
    retrieved_contexts: [
      {
        content: "Spotify delivery errors are logged in the Delivery module under Status > Failed. Each error includes a code, message, and suggested resolution steps.",
        source_type: "wiki",
        source: "AOMA Delivery Troubleshooting",
        score: 0.89,
        similarity: 0.89
      },
      {
        content: "Common Spotify error codes: 4001 (Missing ISRC), 4002 (Invalid Artwork), 4003 (Territory Conflict), 4004 (Duplicate Content), 4005 (Metadata Validation Failed).",
        source_type: "knowledge",
        source: "Spotify Error Code Reference",
        score: 0.91,
        similarity: 0.91
      },
      {
        content: "Failed deliveries can be retried after a 15-minute cooldown period. Access the retry function from Deliveries > Failed > Actions > Retry Delivery.",
        source_type: "wiki",
        source: "AOMA Delivery Operations",
        score: 0.84,
        similarity: 0.84
      }
    ],
    organization: "sony-music",
    division: "digital-operations",
    app_under_test: "aoma",
    status: "pending"
  },
  {
    session_id: "demo-rlhf-004",
    query: "Can I bulk update release dates for multiple offerings?",
    response: `Yes, AOMA supports bulk operations for release date updates. Go to Offerings > Bulk Actions > Update Release Dates. Select the offerings you want to modify, choose the new release date, and confirm the change. Note that offerings already in "Delivered" status cannot have their release dates changed without a takedown and re-delivery.`,
    feedback_type: "correction",
    feedback_value: {
      rating: 3,
      suggestedCorrection: "The response should also mention that bulk updates require curator approval for offerings within 48 hours of release, and that some DSPs like Apple Music have specific advance notice requirements.",
      feedbackText: "Mostly accurate but missing important approval workflow details"
    },
    retrieved_contexts: [
      {
        content: "Bulk operations in AOMA allow administrators to modify multiple records simultaneously. Available bulk actions include: Update Release Date, Update Pricing, Apply Rights Template, and Trigger Delivery.",
        source_type: "wiki",
        source: "AOMA Bulk Operations Guide",
        score: 0.94,
        similarity: 0.94
      },
      {
        content: "Release date changes within 48 hours of the scheduled release require curator approval. This safeguard prevents accidental premature releases or last-minute changes that could affect marketing campaigns.",
        source_type: "knowledge",
        source: "AOMA Approval Workflows",
        score: 0.86,
        similarity: 0.86
      }
    ],
    organization: "sony-music",
    division: "digital-operations",
    app_under_test: "aoma",
    status: "pending"
  },
  {
    session_id: "demo-rlhf-005",
    query: "What reports are available in the Analytics module?",
    response: `The Analytics module provides several report types: Delivery Performance (success rates by DSP), Revenue Analytics (streaming income by territory), Catalog Health (metadata completeness scores), and Rights Expiration (upcoming rights expirations). Reports can be scheduled for automatic delivery or generated on-demand with custom date ranges.`,
    feedback_type: "rating",
    feedback_value: { rating: 4 },
    retrieved_contexts: [
      {
        content: "AOMA Analytics provides comprehensive reporting across four categories: Delivery Performance, Revenue Analytics, Catalog Health, and Rights Management.",
        source_type: "wiki",
        source: "AOMA Analytics Overview",
        score: 0.96,
        similarity: 0.96
      },
      {
        content: "Reports can be scheduled for daily, weekly, or monthly delivery. Recipients are configured per report and can include both internal users and external stakeholders via secure links.",
        source_type: "wiki",
        source: "AOMA Report Scheduling",
        score: 0.82,
        similarity: 0.82
      },
      {
        content: "Custom report templates can be created by combining metrics from different modules. Templates are saved per-user and can be shared with team members.",
        source_type: "knowledge",
        source: "AOMA Reporting Best Practices",
        score: 0.75,
        similarity: 0.75
      }
    ],
    organization: "sony-music",
    division: "digital-operations",
    app_under_test: "aoma",
    status: "pending"
  }
];

async function seedDemoData() {
  console.log("Seeding RLHF demo data with retrieved contexts...\n");

  for (const record of demoFeedbackRecords) {
    const { data, error } = await supabase
      .from("rlhf_feedback")
      .insert(record)
      .select()
      .single();

    if (error) {
      console.error(`Failed to insert ${record.session_id}:`, error.message);
    } else {
      console.log(`Inserted: ${record.session_id} - "${record.query.slice(0, 50)}..."`);
    }
  }

  console.log("\nDone! Seeded", demoFeedbackRecords.length, "demo records.");
}

seedDemoData().catch(console.error);
