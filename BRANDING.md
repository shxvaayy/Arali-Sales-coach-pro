# Arali.ai Branding - v3.5.1 🎨

## Brand Identity

**Company Name:** Arali.ai
**Product:** AI Sales Coach PRO
**Tagline:** Live AI sales coaching - listens to client, suggests perfect responses instantly

---

## Logo Usage

### Icon File
- **Location:** `icons/icon.png`
- **Used in:**
  - Extension icon (Chrome toolbar)
  - Popup header
  - Main panel (Sales Coach)
  - AI Coach panel

### Logo Specifications
- **Size (Popup):** 40x40px
- **Size (Main Panel):** 28x28px
- **Size (AI Panel):** 32x32px
- **Border Radius:** 6-8px (rounded corners)
- **Shadow:** `0 2px 8px rgba(0,0,0,0.3)`

---

## UI Branding Locations

### 1. Extension Popup (`popup.html`)

```html
<div class="branding">
  <img src="icons/icon.png" class="logo" alt="Arali.ai Logo" />
  <div class="company-info">
    <h1 class="company-name">Arali.ai</h1>
    <p class="tagline">AI Sales Coach PRO</p>
  </div>
</div>
```

**Visual:**
```
┌────────────────────────────┐
│  [LOGO]  Arali.ai          │
│          AI Sales Coach PRO│
├────────────────────────────┤
│  ⚙️ Settings               │
│  ...                       │
└────────────────────────────┘
```

### 2. Main Panel (Right Side - Purple)

```html
<div class="company-branding">
  <img src="icons/icon.png" class="company-logo" alt="Arali.ai" />
  <span class="company-name">Arali.ai</span>
</div>

<div class="panel-title">
  🎙️ Sales Coach
</div>
```

**Visual:**
```
┌────────────────────────────┐
│ [LOGO] Arali.ai            │
├────────────────────────────┤
│ 🎙️ Sales Coach            │
│                            │
│ STATUS                     │
│ 🔴 RECORDING               │
│                            │
│ 👥 PARTICIPANTS            │
│ • You (green)              │
│ • Client (orange)          │
│                            │
│ 💬 LIVE CONVERSATION       │
│ ...                        │
└────────────────────────────┘
```

### 3. AI Coach Panel (Left Side - Green)

```html
<div id="ai-header">
  <img src="icons/icon.png" alt="Arali.ai" />
  <span class="ai-pulse"></span>
  <span>AI SALES COACH</span>
</div>
```

**Visual:**
```
┌────────────────────────────┐
│ [LOGO] ● AI SALES COACH    │
│                            │
│ 💡 WHAT YOU SHOULD SAY     │
│                            │
│ I'd be happy to help!      │
│ What are you looking for?  │
│                            │
│ ⚡ CLIENT JUST SAID:       │
│ Client: "Can you help me?" │
└────────────────────────────┘
```

### 4. Extension Manifest

```json
{
  "name": "Arali.ai - AI Sales Coach PRO",
  "description": "Arali.ai: Live AI sales coaching - listens to client, suggests perfect responses instantly"
}
```

**Appears in:**
- Chrome Extensions page
- Chrome Web Store (if published)
- Extension details

---

## Color Palette

### Primary Colors
- **Brand Purple:** `#667eea` → `#764ba2` (gradient)
- **Success Green:** `#10b981` → `#059669` (AI panel gradient)
- **Accent Purple:** `#8b5cf6` (borders, highlights)
- **Light Purple:** `#a78bfa` (company name)
- **Soft Purple:** `#c4b5fd` (titles)

### Status Colors
- **Recording Red:** `#ef4444` → `#dc2626`
- **Client Orange:** `#f59e0b`
- **You Green:** `#10b981`

### UI Colors
- **Dark Background:** `rgba(17, 25, 40, 0.98)`
- **Panel Background:** `rgba(30, 41, 59, 0.5)`
- **Border:** `rgba(139, 92, 246, 0.6)`

---

## Typography

### Fonts
```css
font-family: -apple-system, system-ui, sans-serif
```

### Font Weights
- **Company Name:** 800 (Extra Bold)
- **Headers:** 700 (Bold)
- **Body:** 400 (Regular)

### Font Sizes
- **Company Name (Popup):** 22px
- **Company Name (Panel):** 16px
- **Section Headers:** 18-20px
- **Body Text:** 12-14px

---

## Visual Examples

### Popup Window
```
┌─────────────────────────────────┐
│ GRADIENT PURPLE BACKGROUND      │
│                                 │
│  [ICON]  Arali.ai               │
│  40x40   AI Sales Coach PRO     │
├─────────────────────────────────┤
│  ⚙️ Settings                    │
│                                 │
│  💡 Enter your OpenAI API key   │
│                                 │
│  OpenAI API Key:                │
│  [sk-.................]         │
│                                 │
│  [    Save Settings    ]        │
│                                 │
│  ✅ Saved successfully!         │
└─────────────────────────────────┘
```

### Main Meeting UI
```
LEFT (Green Panel)              RIGHT (Purple Panel)
┌─────────────────────┐        ┌──────────────────────┐
│ [ICON] ● AI COACH   │        │ [ICON] Arali.ai      │
│                     │        ├──────────────────────┤
│ 💡 WHAT TO SAY      │        │ 🎙️ Sales Coach      │
│                     │        │                      │
│ I'd be happy to     │        │ STATUS               │
│ help! What do you   │        │ 🔴 RECORDING         │
│ need?               │        │                      │
│                     │        │ 👥 PARTICIPANTS      │
│ ⚡ CLIENT SAID:     │        │ • You (You)          │
│ Client: "Can you    │        │ • Client             │
│ help me?"           │        │                      │
│                     │        │ 💬 CONVERSATION      │
│                     │        │ You: hello           │
│                     │        │ Client: hi           │
└─────────────────────┘        └──────────────────────┘
```

---

## Brand Guidelines

### Do's ✅
- Always use the official icon.png logo
- Maintain logo aspect ratio (square)
- Use purple gradient for primary branding
- Keep "Arali.ai" capitalization exact
- Use rounded corners on logo (6-8px)
- Apply subtle shadow to logo

### Don'ts ❌
- Don't stretch or distort the logo
- Don't change logo colors
- Don't use emoji instead of logo
- Don't write as "arali.ai" or "ARALI.AI"
- Don't use sharp corners on logo
- Don't place logo on busy backgrounds

---

## File Structure

```
chrome-extension-v2/
├── icons/
│   └── icon.png          # Main logo file
├── popup.html            # Branding: Header with logo + company name
├── recorder-openai.js    # Branding: Main panel + AI panel
└── manifest.json         # Branding: Extension name + description
```

---

## Version History

- **v3.5.1** - Added Arali.ai branding throughout UI
  - Added logo to popup header
  - Added company branding to main panel
  - Added logo to AI coach panel
  - Updated extension name in manifest
  - Created branding guidelines

---

## Marketing Copy

### Short Description
"Arali.ai - AI Sales Coach PRO: Real-time sales coaching powered by AI"

### Long Description
"Arali.ai's AI Sales Coach PRO listens to your sales conversations in real-time and provides instant, intelligent suggestions. Get the perfect response every time with our advanced AI coaching technology."

### Key Features
- 🎯 Real-time AI coaching
- 🎤 Live speech recognition
- ⚡ Instant suggestions
- 📊 Speaker identification
- 💾 Auto-recording & transcripts
- 🚀 Ultra-fast responses (<1.2s)

---

## Contact & Support

**Company:** Arali.ai
**Product:** AI Sales Coach PRO
**Version:** 3.5.1
**Last Updated:** 2025-11-23
