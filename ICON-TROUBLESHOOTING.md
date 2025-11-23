# Icon Loading Troubleshooting Guide

## Issue Fixed in v3.5.2

**Problem:** Icon.png was not loading in the AI Sales Coach panels (only in popup.html)

**Root Cause:** Content scripts need special permission to access extension resources

---

## What Was Fixed

### 1. Added `web_accessible_resources` to manifest.json

```json
{
  "web_accessible_resources": [
    {
      "resources": ["icons/icon.png"],
      "matches": ["https://meet.google.com/*"]
    }
  ]
}
```

**Why needed:** Chrome Manifest V3 requires explicit permission for content scripts to access extension files when injected into web pages.

### 2. Proper `chrome.runtime.getURL()` Usage

**Before (❌ Wrong):**
```javascript
panel.innerHTML = `
  <img src="${chrome.runtime.getURL('icons/icon.png')}" />
`;
```

**After (✅ Correct):**
```javascript
const iconUrl = chrome.runtime.getURL('icons/icon.png');
console.log('Icon URL:', iconUrl);

panel.innerHTML = `
  <img src="${iconUrl}" />
`;
```

**Why:** Template literals need the URL to be evaluated before being inserted into the HTML string.

---

## How to Verify Icon is Loading

### Step 1: Check Console Logs

After loading the extension, open console (Cmd+Option+J) and look for:

```
📷 Main Panel Icon URL: chrome-extension://[extension-id]/icons/icon.png
📷 AI Panel Icon URL: chrome-extension://[extension-id]/icons/icon.png
```

### Step 2: Check Network Tab

1. Open DevTools → Network tab
2. Filter by "icon.png"
3. Should see successful loads (Status: 200)

### Step 3: Inspect Element

1. Right-click on where icon should appear
2. Inspect element
3. Check `<img>` tag src attribute:
   - Should be: `chrome-extension://[id]/icons/icon.png`
   - Should NOT be: `${iconUrl}` or `undefined`

---

## Common Issues & Solutions

### Issue 1: Icon Shows as Broken Image

**Symptoms:**
- Broken image icon (🖼️) appears
- Console error: "Failed to load resource"

**Solutions:**
1. ✅ Check `icons/icon.png` exists in extension folder
2. ✅ Verify `web_accessible_resources` in manifest.json
3. ✅ Reload extension completely (remove + re-add)

### Issue 2: Icon Doesn't Appear at All

**Symptoms:**
- No image, no broken image icon
- Empty space where icon should be

**Solutions:**
1. ✅ Check console for icon URL logs
2. ✅ Verify `chrome.runtime.getURL()` is called BEFORE `innerHTML`
3. ✅ Check CSS: `display: block` or `flex`, not `display: none`

### Issue 3: Icon Works in Popup, Not in Panels

**Symptoms:**
- Popup.html shows icon ✅
- Meeting panels don't show icon ❌

**Solutions:**
1. ✅ Add `web_accessible_resources` to manifest (most common fix!)
2. ✅ Use `chrome.runtime.getURL()` in content script
3. ✅ Hard refresh Google Meet (Cmd+Shift+R)

### Issue 4: Console Shows "undefined" for Icon URL

**Symptoms:**
```
📷 Main Panel Icon URL: undefined
```

**Solutions:**
1. ✅ Check if `chrome.runtime.getURL` exists:
   ```javascript
   console.log('chrome.runtime exists?', !!chrome.runtime);
   console.log('getURL exists?', !!chrome.runtime?.getURL);
   ```
2. ✅ Make sure code is running in extension context (not isolated script)

---

## File Checklist

### ✅ Required Files
```
chrome-extension-v2/
├── icons/
│   └── icon.png          ← Must exist!
├── manifest.json         ← Must have web_accessible_resources
├── recorder-openai.js    ← Must use chrome.runtime.getURL()
└── popup.html            ← Can use relative path
```

### ✅ Manifest.json Requirements
```json
{
  "web_accessible_resources": [
    {
      "resources": ["icons/icon.png"],
      "matches": ["https://meet.google.com/*"]
    }
  ]
}
```

### ✅ Content Script Requirements
```javascript
// Get URL BEFORE creating HTML
const iconUrl = chrome.runtime.getURL('icons/icon.png');

// Use variable in template literal
panel.innerHTML = `<img src="${iconUrl}" />`;
```

---

## Testing Steps

### Complete Test Procedure

1. **Remove old extension:**
   ```
   chrome://extensions/ → Remove "Arali.ai"
   ```

2. **Clear browser cache:**
   ```
   Cmd+Shift+Delete → Clear images and files
   ```

3. **Load v3.5.2:**
   ```
   Load unpacked → chrome-extension-v2 folder
   ```

4. **Verify extension loaded:**
   ```
   Should show: Arali.ai - AI Sales Coach PRO v3.5.2
   ```

5. **Open popup (click extension icon):**
   ```
   Icon should appear in header ✅
   ```

6. **Join Google Meet:**
   ```
   Wait for panels to load (2 seconds)
   ```

7. **Check console:**
   ```
   📷 Main Panel Icon URL: chrome-extension://[id]/icons/icon.png
   📷 AI Panel Icon URL: chrome-extension://[id]/icons/icon.png
   ✅ Main panel created
   ✅ AI Coach panel created
   ```

8. **Verify icons visible:**
   ```
   Right panel: [ICON] Arali.ai ✅
   Left panel: [ICON] ● AI SALES COACH ✅
   ```

---

## Expected Output

### Console Logs (Successful)
```
🚀 Initializing Sales Coach (FAST MODE)...
📷 Main Panel Icon URL: chrome-extension://abcdef123456/icons/icon.png
✅ Main panel created
📷 AI Panel Icon URL: chrome-extension://abcdef123456/icons/icon.png
✅ AI Coach panel created
⚡ FAST MODE: Real-time speech + instant AI suggestions!
```

### Visual Result
```
LEFT PANEL:                    RIGHT PANEL:
┌─────────────────┐           ┌──────────────────┐
│ [✅ICON] ● AI   │           │ [✅ICON] Arali.ai│
│ SALES COACH     │           ├──────────────────┤
│                 │           │ 🎙️ Sales Coach  │
└─────────────────┘           └──────────────────┘
```

---

## Quick Fix Commands

### If icon still not loading after all fixes:

```bash
# 1. Navigate to extension folder
cd "/Volumes/SHIVAY DATA/Writory-branch/without ai/chrome-extension-v2"

# 2. Verify icon exists
ls -la icons/icon.png

# 3. Check manifest is valid JSON
cat manifest.json | python3 -m json.tool

# 4. Check file permissions
chmod 644 icons/icon.png

# 5. Verify web_accessible_resources
grep -A 5 "web_accessible_resources" manifest.json
```

---

## Version History

- **v3.5.0** - Added Arali.ai branding (icons not loading)
- **v3.5.1** - Fixed popup branding
- **v3.5.2** - Fixed icon loading in content scripts ✅
  - Added `web_accessible_resources`
  - Fixed `chrome.runtime.getURL()` usage
  - Added console logging for debugging

---

## Additional Resources

- [Chrome Extension Content Scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Web Accessible Resources](https://developer.chrome.com/docs/extensions/mv3/manifest/web_accessible_resources/)
- [chrome.runtime.getURL()](https://developer.chrome.com/docs/extensions/reference/runtime/#method-getURL)

---

## Support

If icons still not loading after following this guide:

1. Check console for errors
2. Verify all files exist
3. Try in incognito mode
4. Create fresh extension folder
5. Test with different icon file

**Last Updated:** v3.5.2 (2025-11-23)
