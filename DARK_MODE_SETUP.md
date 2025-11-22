# Dark Mode Integration Guide

## Files Created
1. **`js/dark-mode.js`** - Theme toggle functionality with localStorage persistence
2. **`css/dark-mode.css`** - Dark theme variables and pipeline arrow visualizations

## Integration Steps

### 1. Add CSS Link to index.html
Add this line after the existing `style.css` link (around line 10):
```html
<link rel="stylesheet" href="css/dark-mode.css" />
```

### 2. Add JavaScript Link to index.html
Add this line before the closing `</body>` tag (at the end of the file):
```html
<script src="js/dark-mode.js"></script>
```

## Features Included
- **Dark Mode Toggle**: Click the moon/sun icon in the header to switch themes
- **Persistence**: Theme preference is saved in localStorage
- **Pipeline Arrows**: Visual connectors (→) between NICAD → CTASF → Délibérées cards (desktop only)
- **Responsive**: Pipeline arrows hide on mobile/tablet

## Testing
1. Refresh the page after adding the links
2. Click the theme toggle button (moon icon) in the header
3. Verify the theme switches and persists on page reload
4. Check that pipeline arrows appear between process cards on desktop
