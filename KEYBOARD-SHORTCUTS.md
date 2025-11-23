# Keyboard Shortcuts - v3.6.3 ⌨️

## Available Shortcuts

### 1. **Ctrl Key** - Hide/Show ALL Panels
```
Press: Ctrl (alone)
Effect: Toggles BOTH panels (AI Coach + Sales Coach)
```

**Use Case:**
- Screen sharing with client
- Want to hide everything completely
- Clean screen for presentation

**Visual:**
```
Before:
┌──────────────┐  ┌──────────────┐
│ AI COACH     │  │ SALES COACH  │
│ (Center)     │  │ (Right)      │
└──────────────┘  └──────────────┘

Press Ctrl ↓

After:
[Clean screen - both panels hidden]

Press Ctrl again ↓

Back to:
┌──────────────┐  ┌──────────────┐
│ AI COACH     │  │ SALES COACH  │
│ (Center)     │  │ (Right)      │
└──────────────┘  └──────────────┘
```

---

### 2. **Shift Key** - Hide/Show Sales Coach Panel ONLY
```
Press: Shift (alone)
Effect: Toggles ONLY Sales Coach panel (right side)
       AI Coach panel stays visible!
```

**Use Case:**
- Want to see AI suggestions but hide status/participants
- Minimize distraction while keeping AI active
- Focus only on AI coach

**Visual:**
```
Before:
┌──────────────┐  ┌──────────────┐
│ AI COACH     │  │ SALES COACH  │
│ (Center)     │  │ (Right)      │
│ Suggestions  │  │ Status/Parti │
└──────────────┘  └──────────────┘

Press Shift ↓

After:
┌──────────────┐
│ AI COACH     │  [Sales Coach hidden]
│ (Center)     │
│ Suggestions  │
└──────────────┘

Press Shift again ↓

Back to:
┌──────────────┐  ┌──────────────┐
│ AI COACH     │  │ SALES COACH  │
│ (Center)     │  │ (Right)      │
└──────────────┘  └──────────────┘
```

---

## Quick Reference

| Key | Effect | AI Panel | Sales Coach Panel |
|-----|--------|----------|-------------------|
| **Ctrl** | Hide ALL | Hidden | Hidden |
| **Shift** | Hide Sales Coach | Visible ✅ | Hidden |

---

## Notifications

### Ctrl Key
```
Shown: "👁️ All UI Shown"
Hidden: "🙈 All UI Hidden"
```

### Shift Key
```
Shown: "📊 Sales Coach Shown"
Hidden: "🙈 Sales Coach Hidden (AI Still Active)"
```

---

## Console Logs

When you press the keys, check console (Cmd+Option+J):

### Ctrl Key
```
👁️ All UI Shown
🙈 All UI Hidden
```

### Shift Key
```
📊 Sales Coach Shown
🙈 Sales Coach Hidden
```

---

## Use Cases

### Scenario 1: Screen Sharing
**Need:** Clean screen for client presentation

**Action:**
```
Press: Ctrl
Result: Everything hidden
Client sees: Clean screen
```

### Scenario 2: Focus on AI Only
**Need:** See AI suggestions, hide status panel

**Action:**
```
Press: Shift
Result: Sales Coach hidden, AI visible
You see: Only AI suggestions (center bottom)
```

### Scenario 3: Recording Demo
**Need:** Show full UI for demo/training

**Action:**
```
Press: Nothing (or Ctrl/Shift if hidden)
Result: All panels visible
```

---

## Panel Details

### AI Coach Panel (Center Bottom)
- **Shows:** AI suggestions, client messages
- **Position:** Bottom center (translucent black)
- **Hidden by:** Ctrl key only
- **Visible with:** Shift key

### Sales Coach Panel (Right Side)
- **Shows:** Status, participants, conversation
- **Position:** Top right (purple)
- **Hidden by:** Both Ctrl and Shift keys
- **Visible with:** Default state

---

## Keyboard Combinations

### Valid
```
✅ Ctrl (alone)
✅ Shift (alone)
```

### Invalid (Won't trigger)
```
❌ Ctrl + Shift
❌ Ctrl + Alt
❌ Shift + Alt
❌ Cmd + Ctrl
❌ Cmd + Shift
```

**Why:** To prevent conflicts with browser/system shortcuts

---

## Testing

### Test Ctrl Key
1. Join Google Meet
2. Wait for panels to load
3. Press Ctrl
4. Verify: Both panels hidden
5. Press Ctrl again
6. Verify: Both panels visible

### Test Shift Key
1. Join Google Meet
2. Wait for panels to load
3. Press Shift
4. Verify: Sales Coach hidden, AI visible
5. Press Shift again
6. Verify: Sales Coach visible again

---

## Troubleshooting

### Shortcuts Not Working?

**Issue 1: Key doesn't respond**
- Check console for logs
- Make sure Google Meet tab is focused
- Try clicking on the page first

**Issue 2: Wrong panel hiding**
- Ctrl = Both panels
- Shift = Only Sales Coach (right)
- Check which key you pressed

**Issue 3: Panel stays hidden**
- Press the same key again to toggle
- If stuck, reload page (Cmd+R)

---

## State Management

### Panel Visibility States

```javascript
// Default state
isUIVisible = true (both panels visible)
isSalesCoachVisible = true (sales coach visible)

// After Ctrl press
isUIVisible = false (both panels hidden)

// After Shift press
isSalesCoachVisible = false (only sales coach hidden)
```

---

## Tips & Tricks

### 1. Quick Hide During Screen Share
```
Before sharing: Press Ctrl
During share: Clean screen
After share: Press Ctrl again
```

### 2. Minimize Distraction
```
Reading AI suggestions: Press Shift (hide status)
Need status check: Press Shift again
```

### 3. Demo Mode
```
Want to show AI only: Press Shift
Want to show everything: Press Shift again
Want to hide everything: Press Ctrl
```

---

## Version History

- **v3.6.3** - Added Shift key for Sales Coach panel toggle
  - Ctrl = Hide all (existing)
  - Shift = Hide Sales Coach only (new!)
  - Better notifications
  - Console logging for both keys

---

## Accessibility

### Keyboard Navigation
- ✅ Single key press (easy)
- ✅ No complex combinations
- ✅ Instant toggle (no delay)
- ✅ Visual notifications
- ✅ Console feedback

### Screen Reader Compatible
- Notifications shown on screen
- Console logs for verification
- Clear panel states

---

## Future Enhancements

Possible additions:
- Custom key bindings
- More panel controls
- Opacity adjustment
- Panel positioning

---

**Quick Reference Card:**
```
┌─────────────────────────────┐
│  KEYBOARD SHORTCUTS         │
├─────────────────────────────┤
│  Ctrl  → Hide ALL panels    │
│  Shift → Hide Sales Coach   │
└─────────────────────────────┘
```

**Remember:**
- Ctrl = Everything gone 🙈
- Shift = AI stays, Sales Coach goes 📊

---

**Last Updated:** v3.6.3 (2025-11-23)
