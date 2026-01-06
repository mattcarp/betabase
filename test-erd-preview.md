# Multi-Tenant ERD Preview

## Mermaid Diagram
```mermaid
erDiagram
    ORGANIZATION ||--o{ DIVISION : "has many"
    DIVISION ||--o{ APPLICATION : "has many"

    ORGANIZATION {
        string name PK "sony-music, smej, sony-pictures"
        string description
    }

    DIVISION {
        string name PK "digital-operations"
        string organization FK "sony-music"
        string description
    }

    APPLICATION {
        string name PK "aoma, media-conversion, promo"
        string organization FK "sony-music"
        string division FK "digital-operations"
        string description
    }
```

## Structure:
- **ORGANIZATION**: Sony Music, SMEJ, Sony Pictures
- **SMEJ**: No divisions or apps (separate org, shows "...")
- **Sony Pictures**: No divisions or apps (separate org, shows "...")
- **Sony Music → Division**: Digital Operations
- **Digital Operations → Apps**: AOMA, Media Conversion, Promo

## NanoBanana Pro Layout:
When you say "fancy", the diagram will show:
- **Top row**: 3 cloud shapes (Sony Music, SMEJ, Sony Pictures)
- **Only Sony Music flows downward** to:
  - **Middle**: Digital Operations box
  - **Bottom**: 3 app boxes (AOMA, Media Conversion, Promo)
- SMEJ and Sony Pictures have "..." and no connections downward
