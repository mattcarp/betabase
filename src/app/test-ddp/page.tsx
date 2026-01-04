"use client";

/**
 * DDP Parser Demo Page
 *
 * Test page for the DDP file upload and parsing functionality.
 * Upload a DDP folder to see it parsed and displayed with MusicBrainz metadata.
 */

import { DDPUploader } from '@/components/ddp';

export default function DDPTestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">DDP Parser</h1>
          <p className="text-muted-foreground">
            Upload a DDP (Disc Description Protocol) master folder to parse and view its contents.
            The parser extracts track listings, CD-TEXT metadata, and looks up additional
            information from MusicBrainz.
          </p>
        </div>

        {/* Info Card */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <h3 className="font-medium text-foreground mb-2">What is DDP?</h3>
          <p className="text-sm text-muted-foreground">
            DDP (Disc Description Protocol) is an industry standard format for delivering CD masters
            to replication plants. A DDP folder contains several files including DDPMS (map stream),
            DDPID (disc identification), DDPPQ (subcode/timing), and optionally CD-TEXT metadata.
          </p>
        </div>

        {/* Uploader */}
        <DDPUploader
          onParsed={(result) => {
            console.log('DDP parsed:', result);
          }}
        />

        {/* Tips */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <h3 className="font-medium text-foreground">Tips:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Click &ldquo;Select Folder&rdquo; to upload an entire DDP directory</li>
            <li>Or use &ldquo;Select Files&rdquo; to pick individual DDP component files</li>
            <li>Audio files (&gt;20MB) are automatically skipped</li>
            <li>The parser detects DDP by looking for the DDPMS file</li>
            <li>MusicBrainz lookup uses UPC, ISRCs, and calculated Disc ID</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
