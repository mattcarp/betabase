# AOMA Release Notes 2.113.0

## Overview
This document contains the release notes for AOMA (Artist & Operational Management Application) version 2.113.0, released August 27, 2025.

## Release Highlights

### UST (Universal Studio Tools)
- **Stereo Audio, Immersive and SFV**: Inherit and display explicit indicator on QC notes and master interfaces
- **All master types**: Include additional warning on registration, asset swap and linking interfaces for released and full publish products indicating that new assets will be delivered to partners
- **AMB Preflight Validation - Duration**: File duration support for 8-20 seconds
- **AMB Preflight Validation**: Resolution/Dimension, Codec/Wrapper, File Extension and Audio Stream validation
- **SFV**: Revamp of download source master and autocorrected master to reduce Aspera Traffic
- **DBKS**: Resolution/Dimension display in inches

### Asset Upload Job Status Page
- Add more filters: Type, Status, Asset upload on the interface
- Fix column sorting issue and prevent display of archive uploads on the interface

### Details Page Enhancements
- Display explicit indicators and mismatches on track master level on QC notes, product and master details pages for SFV, Stereo and Immersive audio
- Master details page: Add "Regenerate Preview" support for all applicable masters
- Support creation of Pseudo video using .gif files in addition to current supported files like .jpeg
- Fix alignment of Source and Proxy/Preview download option for LFVs
- Fix bug where user was unable to update security groups of standalone masters
- Fix AOMA URL redirection upon login to land on desired page

### Export Features
- Support Vinyl export to Sony Ci
- Hide A2 Export button display for digital products/masters unless a DDP is available

### MBC (Media Batch Converter)
- Redirect to Media Batch Converter with pre-populated products from Mobile Audio Manager
- Code Clean Up for Media File Convertor (MFC)
- Unified loading indicator (ellipsis style) for MBC consistency throughout AOMA
- Ensure "Select Audio Sources" in MBC exports the highest priority format when No/All/Multiple selection is made
- Fix for MBC submit button incorrectly displayed after closing "Select Destinations" without changes

### Linking Capabilities
- Ability to unlink select masters (Immersive/AMB/CC/Subtitle) masters from published products (GRPS)
- Include GRPS publish status in addition to GRPS release date for AOMA product release warning

### Track Linking & Management
- AOMA 3 Track Linking: Ability to add new link to new assets via Track Hot swap for Stereo virtual masters
- Ability to generate and populate master in GRPS 3
- Ability to attach multiple sources/projects to AOMA masters

### GRPS Integration
- Hide "GRPS QC" button on Digital product pages
- Align Participant ID in Artist Summary URL with GRPS Participant ID

### Search & Discovery
- **AMP Search**: Fix for multiple page refreshes in AMP Search before results display

### Registration & Repository
- Registration Reporting: Ability to stop specific asset delivery to specific partners via Repository or Registration events
- Support Registration Status Report to comply with FGPs

### Miscellaneous Updates
- Clear cache automatically upon AOMA login
- Code refactor for Track Metadata - Remove Special Character Validation
- To implement Media Batch Converter job status page

## Additional Information
- **Wiki**: For detailed information on tickets and tasks, visit the AOMA Wiki at https://wiki.smedigitalapps.com/wiki/display/AOMA/AOMA+Release+Notes
- **Support Contact**: Aoma.support@sonymusic.com
- **Version**: 2.113.0
- **Release Date**: August 27, 2025

---

*This document has been reformatted from .eml format for optimal LLM processing and readability.*