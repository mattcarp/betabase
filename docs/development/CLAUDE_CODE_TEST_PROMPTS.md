# Claude Code Test Prompts

Copy and paste these prompts one by one in Claude Code to verify everything is working.

## 1. Basic Configuration Test

```
/doctor
```

Expected: No errors about invalid settings

## 2. Design System Recognition

```
What design system should I follow for this project?
```

Expected: Claude should reference the design system with shadcn/ui, Tailwind, dark mode support, etc.

## 3. Subagent Discovery

```
Show me all available subagents
```

Expected: Should list 4 agents including voice-ui-specialist

## 4. Subagent Functionality

```
@ui-designer create a beautiful card component for displaying meeting transcripts
```

Expected: Should create a component using:

- Card from shadcn/ui
- Semantic colors (bg-background, text-foreground)
- Proper spacing (space-4, space-6)
- Dark mode support

## 5. Voice Specialist Test

```
@voice-ui-specialist create a real-time audio level meter component
```

Expected: Should create a voice-specific component with:

- Visual feedback for audio levels
- Accessibility considerations
- Performance optimizations

## 6. Custom Command Test

```
/create-component MeetingCard
```

Expected: Should scaffold a new component following the template

## 7. Design Review Command

```
/review-design src/components/ui/button.tsx
```

Expected: Should review the file for design system compliance

## 8. Hook Functionality Test

Create a test file to trigger the Prettier hook:

```
Create a new file called test-formatting.tsx with a React component
```

Expected: After creating, you should see "Creating file:" message and Prettier should auto-format

## 9. Permission Test (Should Work)

```
Run npm run dev
```

Expected: Should execute successfully (it's in the allow list)

## 10. Permission Test (Should Fail)

```
Run sudo npm install something
```

Expected: Should be denied (sudo is in the deny list)

## 11. Project Context Test

```
What are the key features of SIAM? How should I handle voice UI components?
```

Expected: Should know about:

- Real-time transcription
- Deepgram integration
- Voice UI patterns
- Meeting assistance features

## 12. MCP Server Test (if AOMA Mesh is built)

```
Using AOMA Mesh, search for recent JIRA tickets about authentication
```

Expected: Either works (if server is built) or says server isn't available

## 13. File System Operations

```
Show me all React components in src/components/audio/
```

Expected: Should list files in that directory (using Desktop Commander)

## 14. Git Integration

```
Show me the last 5 commits in this repository
```

Expected: Should display recent git history

## 15. Complex Task Test

```
Create a new voice transcription display component that:
1. Shows real-time transcription with speaker labels
2. Has a visual indicator for voice activity
3. Follows our design system
4. Includes proper TypeScript types
5. Is fully accessible
```

Expected: Should create a comprehensive component following all guidelines

## Success Indicators

✅ No /doctor errors
✅ Recognizes design system
✅ All subagents available
✅ Commands work properly
✅ Hooks execute (Prettier formats)
✅ Permissions are enforced
✅ Knows SIAM context
✅ Can access file system
✅ Creates compliant components

## Troubleshooting

If something doesn't work:

1. **Subagent not found**: Make sure you're in the SIAM directory when starting Claude
2. **Command not recognized**: Check if the file exists in .claude/commands/
3. **Design system not referenced**: Verify symlinks with `ls -la .cursorrules`
4. **Hooks not running**: Check .claude/settings.json syntax
5. **MCP not working**: The server needs to be built first
