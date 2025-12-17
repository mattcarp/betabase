# SIAM Implementation Plan

- [ ] 1. Set up testing infrastructure
  - [-] 1.1 Install and configure fast-check for property-based testing
    - Install fast-check package: `pnpm add -D fast-check`
    - Configure Vitest integration for property tests
    - Create test utilities for common generators
    - _Requirements: Testing Strategy_

- [ ] 2. Chat Experience - Code Rendering
  - [ ] 2.1 Verify code block rendering with syntax highlighting
    - Confirm CodeBlock component renders with syntax highlighting
    - Verify download and share buttons are present
    - _Requirements: 1.3_
  - [ ] 2.2 Write property test for code rendering
    - **Property 1: Code and diagram rendering completeness**
    - **Validates: Requirements 1.3**

- [ ] 3. RLHF Curate - Curator UI
  - [ ] 3.1 Verify curator UI elements are present for authorized users
    - Confirm thumbs up/down buttons render for curator role
    - Verify star rating controls are functional
    - Confirm document relevance toggles work
    - Verify detailed notes textarea is present
    - _Requirements: 2.1_
  - [ ] 3.2 Write property test for curator UI elements
    - **Property 2: Curator UI element presence**
    - **Validates: Requirements 2.1**

- [ ] 4. RLHF Curate - Document Upload Pipeline
  - [ ] 4.1 Implement document upload to Supabase with embedding generation
    - Create upload API endpoint at `/api/rlhf/upload`
    - Generate embeddings using OpenAI text-embedding-3-small
    - Store document and embedding in gemini_embeddings table
    - _Requirements: 2.2_
  - [ ] 4.2 Write property test for document upload round-trip
    - **Property 3: Document upload round-trip**
    - **Validates: Requirements 2.2**
  - [ ] 4.3 Implement document deduplication at 85% similarity threshold
    - Check similarity before inserting new documents
    - Reference existing document if similarity >= 85%
    - _Requirements: 2.2_
  - [ ] 4.4 Write property test for document deduplication
    - **Property 4: Document deduplication**
    - **Validates: Requirements 2.2**

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. RLHF Curate - Dashboard Statistics
  - [ ] 6.1 Connect stats dashboard to live Supabase data
    - Replace mock data in RLHFFeedbackTab with real API calls
    - Query pending/submitted counts from rlhf_feedback table
    - Calculate average rating from submitted feedback
    - _Requirements: 2.3_
  - [ ] 6.2 Write property test for dashboard statistics accuracy
    - **Property 5: Dashboard statistics accuracy**
    - **Validates: Requirements 2.3**

- [ ] 7. RLHF Curate - Fine-Tuning Loop
  - [ ] 7.1 Implement feedback improvement mechanism
    - Update RLHF signals when admin submits correction
    - Boost document relevance scores based on positive feedback
    - Penalize documents with negative feedback
    - _Requirements: 2.4_
  - [ ] 7.2 Write property test for feedback improvement effect
    - **Property 6: Feedback improvement effect**
    - **Validates: Requirements 2.4**

- [ ] 8. Role-Based Access Control
  - [ ] 8.1 Verify RLS policies enforce role-based access
    - Confirm admin can access all resources
    - Verify curator can only access feedback-related resources
    - Confirm viewer has read-only access
    - _Requirements: 2.5_
  - [ ] 8.2 Write property test for role-based access enforcement
    - **Property 7: Role-based access enforcement**
    - **Validates: Requirements 2.5**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Automated Testing - HITL UI
  - [ ] 10.1 Implement HITL review UI for failing tests
    - Create annotation input fields for test failures
    - Add escalation buttons for critical failures
    - Implement conversion-to-automated-suite action
    - _Requirements: 3.2_
  - [ ] 10.2 Write property test for HITL UI capabilities
    - **Property 8: HITL UI capabilities**
    - **Validates: Requirements 3.2**

- [ ] 11. Automated Testing - Automation Loop
  - [ ] 11.1 Implement test regeneration from human feedback
    - Create API endpoint to trigger TestSprite regeneration
    - Store regenerated test results in Supabase
    - Link regenerated tests to original feedback
    - _Requirements: 3.3_
  - [ ] 11.2 Write property test for automation loop persistence
    - **Property 9: Automation loop persistence**
    - **Validates: Requirements 3.3**

- [ ] 12. Automated Testing - Dashboard Visualization
  - [ ] 12.1 Implement testing dashboard with charts
    - Add pass/fail trend charts using shadcn/recharts
    - Display reviewer queue counts
    - Calculate and show ROI metrics
    - _Requirements: 3.4_
  - [ ] 12.2 Write property test for dashboard visualization completeness
    - **Property 10: Dashboard visualization completeness**
    - **Validates: Requirements 3.4**

- [ ] 13. HITL Compliance - Audit Logging
  - [ ] 13.1 Implement audit logging for HITL actions
    - Create audit_log table in Supabase
    - Log all approval actions with timestamp and user
    - Log LangGraph breakpoint hits
    - _Requirements: 3.5_
  - [ ] 13.2 Write property test for HITL action logging
    - **Property 11: HITL action logging**
    - **Validates: Requirements 3.5**

- [ ] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
