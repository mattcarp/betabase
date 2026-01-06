# AOMA (Asset & Offering Management Application) - Overview

**Application Code:** `AOMA`
**Division:** Global Digital Operations (GDO)
**Organization:** Sony Music Entertainment

## Executive Summary
AOMA (Asset & Offering Management Application) is the central system of record for Sony Music's digital supply chain. It manages the lifecycle of digital assets (audio, video, artwork) and commercial offerings (albums, singles, bundles) for distribution to DSPs (Digital Service Providers) like Spotify, Apple Music, and YouTube.

## Key Capabilities
*   **Asset Ingestion:** High-volume ingestion of WAV, FLAC, and ProRes files.
*   **Metadata Management:** DDEX-compliant metadata tagging for all repertoire.
*   **Rights Management:** Validation of territorial rights and release dates.
*   **Distribution:** Automated delivery to over 200 global endpoints.

## Technology Stack
AOMA is built on a microservices architecture using:
*   **Frontend:** React (Next.js)
*   **Backend:** Node.js (Express) and Java (Spring Boot)
*   **Database:** PostgreSQL (Metadata) and Snowflake (Analytics)
*   **Infrastructure:** AWS (ECS, Lambda, S3)

## Strategic Importance
AOMA processes over 50,000 new assets weekly and is critical for revenue recognition. Any downtime impacts "Time to Market" for priority releases.
