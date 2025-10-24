# MAC Design System Violations Report

Generated: 10/24/2025, 11:05:58 AM

## Summary

- **Hardcoded Colors**: 97
- **Non-MAC Typography**: 13
- **Missing MAC Classes**: 109
- **Hardcoded Spacing**: 60
- **Non-MAC Animations**: 0

## 🎨 Hardcoded Colors (should use --mac-\* variables)

- **src/index.css:88** - `background: rgba(20, 20, 20, 0.7)`
  - Use --mac-\* CSS variables

- **src/services/errorLogger.ts:156** - `color: #fbbf24`
  - Use --mac-\* CSS variables

- **src/services/errorLogger.ts:157** - `color: #f97316`
  - Use --mac-\* CSS variables

- **src/services/errorLogger.ts:158** - `color: #ef4444`
  - Use --mac-\* CSS variables

- **src/services/errorLogger.ts:159** - `color: #dc2626`
  - Use --mac-\* CSS variables

- **src/services/errorLogger.ts:159** - `background: #fef2f2`
  - Use --mac-\* CSS variables

- **src/styles/cinematic-ui.css:263** - `background: rgba(255, 255, 255, 0.15)`
  - Use --mac-\* CSS variables

- **src/styles/cinematic-ui.css:314** - `border-color: rgba(14, 165, 233, 0.5)`
  - Use --mac-\* CSS variables

- **src/styles/cinematic-ui.css:357** - `background: rgba(23, 23, 23, 0.8)`
  - Use --mac-\* CSS variables

- **src/styles/cinematic-ui.css:370** - `border-color: rgba(14, 165, 233, 0.4)`
  - Use --mac-\* CSS variables

- **src/styles/cinematic-ui.css:506** - `border-color: rgba(14, 165, 233, 0.5)`
  - Use --mac-\* CSS variables

- **src/styles/cinematic-ui.css:531** - `background: rgba(14, 165, 233, 0.2)`
  - Use --mac-\* CSS variables

- **src/styles/cinematic-ui.css:532** - `border-color: rgba(14, 165, 233, 0.5)`
  - Use --mac-\* CSS variables

- **src/styles/cinematic-ui.css:537** - `background: rgba(16, 185, 129, 0.2)`
  - Use --mac-\* CSS variables

- **src/styles/cinematic-ui.css:538** - `border-color: rgba(16, 185, 129, 0.5)`
  - Use --mac-\* CSS variables

- **src/styles/cinematic-ui.css:539** - `color: #34d399`
  - Use --mac-\* CSS variables

- **src/styles/cinematic-ui.css:655** - `background: rgba(255, 255, 255, 0.05)`
  - Use --mac-\* CSS variables

- **src/styles/cinematic-ui.css:660** - `background: rgba(14, 165, 233, 0.3)`
  - Use --mac-\* CSS variables

- **src/styles/cinematic-ui.css:665** - `background: rgba(14, 165, 233, 0.5)`
  - Use --mac-\* CSS variables

- **src/styles/glassmorphism-motiff.css:14** - `border: rgba(255, 255, 255, 0.1)`
  - Use --mac-\* CSS variables

... and 77 more

## 🔤 Non-MAC Typography Weights

- **src/services/errorLogger.ts:156** - `font-weight: bold`
  - Use font-weight: 100, 200, 300, or 400 only

- **src/services/errorLogger.ts:157** - `font-weight: bold`
  - Use font-weight: 100, 200, 300, or 400 only

- **src/services/errorLogger.ts:158** - `font-weight: bold`
  - Use font-weight: 100, 200, 300, or 400 only

- **src/services/errorLogger.ts:159** - `font-weight: bold`
  - Use font-weight: 100, 200, 300, or 400 only

- **src/services/motiff-mcp-bridge.ts:690** - `font-weight: bold`
  - Use font-weight: 100, 200, 300, or 400 only

- **src/services/motiff-mcp-bridge.ts:691** - `font-weight: 600`
  - Use font-weight: 100, 200, 300, or 400 only

- **src/styles/cinematic-ui.css:234** - `font-weight: 600`
  - Use font-weight: 100, 200, 300, or 400 only

- **src/styles/cinematic-ui.css:420** - `font-weight: 600`
  - Use font-weight: 100, 200, 300, or 400 only

- **src/styles/cinematic-ui.css:497** - `font-weight: 500`
  - Use font-weight: 100, 200, 300, or 400 only

- **src/styles/jarvis-theme.css:116** - `font-weight: 500`
  - Use font-weight: 100, 200, 300, or 400 only

- **src/styles/motiff-glassmorphism.css:160** - `font-weight: 600`
  - Use font-weight: 100, 200, 300, or 400 only

- **src/styles/motiff-glassmorphism.css:185** - `font-weight: 500`
  - Use font-weight: 100, 200, 300, or 400 only

- **src/styles/motiff-glassmorphism.css:216** - `font-weight: 500`
  - Use font-weight: 100, 200, 300, or 400 only

## 🏷️ Missing MAC Classes

- **src/ComponentPlayground.tsx** - Input without mac-input class
  - Add mac-input class

- **src/TestApp.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/app-backup/page 3.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/app-backup/page 3.tsx** - Input without mac-input class
  - Add mac-input class

- **src/app-backup/page 4.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/app-backup/page 4.tsx** - Input without mac-input class
  - Add mac-input class

- **src/app-backup/page.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/app-backup/page.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/AOMAPerformanceDashboard.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/AOMAPerformanceDashboard.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/ConversationalAI 3.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ConversationalAI.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/DocumentUpload 3.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/DocumentUpload 4.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/DocumentUpload 5.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/DocumentUpload 6.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/DocumentUpload.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/ErrorBoundary.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ErrorTest.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/MACFusion.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/SettingsPanel.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/SettingsPanel.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/ai/ai-sdk-chat-panel.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ai/chat-input.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ai/chat-input.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/ai/chat-panel.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ai/chat-wrapper.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ai/chat-wrapper.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/ai/enhanced-chat-panel-with-ai-elements.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ai/enhanced-chat-panel.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ai-elements/branch.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ai-elements/code-block.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ai-elements/conversation.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ai-elements/file-upload.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ai-elements/file-upload.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/ai-elements/inline-citation.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ai-elements/prompt-input.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ai-elements/suggestion.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ai-elements/web-preview.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ai-elements/web-preview.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/auth/ui/LoadingButton.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/auth/ui/PasswordInput.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/auth/ui/VerificationCodeInput.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/test-dashboard/AITestGenerator.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/test-dashboard/AITestGenerator.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/test-dashboard/AnnotationPins.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/test-dashboard/AnnotationToolbar.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/test-dashboard/CoverageReport.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/test-dashboard/FirecrawlPanel.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/test-dashboard/FirecrawlPanel.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/test-dashboard/FlagIssueLayer.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/test-dashboard/FlagIssueLayer.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/test-dashboard/FlakyTestExplorer.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/test-dashboard/HighlighterCanvas.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/test-dashboard/MarkdownNoteEditor.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/test-dashboard/ScreenshotCapture.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/test-dashboard/SessionTimeline.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/test-dashboard/SessionTimeline.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/test-dashboard/StickyNoteLayer.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/test-dashboard/TestAnalytics.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/test-dashboard/TestDashboard.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/test-dashboard/TestResultsViewer.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/test-dashboard/TestResultsViewer.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/test-dashboard/TraceViewer.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/AOMAKnowledgePanel.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/AOMAKnowledgePanel.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/ui/AudioSourceSelector.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/AudioSourceSelector.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/ui/AudioWaveformResponse.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/AudioWaveformResponse.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/ui/CircularHUD.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/EnhancedCurateTab.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/EnhancedCurateTab.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/ui/EnhancedHUDInterface.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/EnhancedKnowledgePanel.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/EnhancedKnowledgePanel.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/ui/FloatingPanel.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/HUDCustomizationPanel.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/HUDCustomizationPanel.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/ui/HUDHelpOverlay.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/IntrospectionDropdown.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/LiveInsights.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/ResponseRenderer.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/SearchResultsResponse.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/TopicVisualization.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/VoiceSelector.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/WisdomLibrary.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/WisdomLibrary.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/ui/calendar.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/carousel.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/input-group.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/input-group.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/ui/layout/LeftSidebar.tsx** - Input without mac-input class
  - Add mac-input class

- **src/components/ui/layout/RightSidebar.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/pages/ChatPage.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/sidebar.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/components/ui/sidebar.tsx** - Input without mac-input class
  - Add mac-input class

- **src/hooks/useNotifications.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/renderer/components/settings/McpSettings.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/renderer/components/settings/McpSettings.tsx** - Input without mac-input class
  - Add mac-input class

- **src/services/aomaUIAnalyzer.ts** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **src/services/aomaUIAnalyzer.ts** - Input without mac-input class
  - Add mac-input class

- **app/error.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **app/gpt5-chat/page.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **app/gpt5-chat/page.tsx** - Input without mac-input class
  - Add mac-input class

- **app/page.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **app/performance/page.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **app/test-mac-components/page.tsx** - Button without mac-button class
  - Add mac-button, mac-button-primary, or mac-button-secondary class

- **app/test-mac-components/page.tsx** - Input without mac-input class
  - Add mac-input class
