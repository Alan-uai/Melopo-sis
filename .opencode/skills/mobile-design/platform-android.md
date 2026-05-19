# Android Platform Guidelines

> Material Design 3 essentials, Android design conventions, Roboto typography, and native patterns.
> **Read this file when building for Android devices.**

---

## 1. Material Design 3 Philosophy

### Core Material Principles

```
MATERIAL AS METAPHOR:
├── Surfaces exist in 3D space
├── Light and shadow define hierarchy
├── Motion provides continuity
└── Bold, graphic, intentional design

ADAPTIVE DESIGN:
├── Responds to device capabilities
├── One UI for all form factors
├── Dynamic color from wallpaper
└── Personalized per user

ACCESSIBLE BY DEFAULT:
├── Large touch targets
├── Clear visual hierarchy
├── Semantic colors
└── Motion respects preferences
```

---

## 2. Android Typography

### Roboto Font Family

```
Android System Fonts:
├── Roboto: Default sans-serif
├── Roboto Flex: Variable font (API 33+)
├── Roboto Serif: Serif alternative
├── Roboto Mono: Monospace
└── Google Sans: Google products (special license)
```

### Material Type Scale

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **Display Large** | 57sp | Regular | 64sp | Hero text |
| **Headline Large** | 32sp | Regular | 40sp | Page titles |
| **Title Large** | 22sp | Regular | 28sp | Cards, dialogs |
| **Body Large** | 16sp | Regular | 24sp | Primary content |
| **Body Medium** | 14sp | Regular | 20sp | Secondary content |
| **Label Large** | 14sp | Medium | 20sp | Buttons, FAB |

### Scalable Pixels (sp)

```
sp = Scale-independent pixels

RULE: ALWAYS use sp for text, dp for everything else.
```

---

## 3. Material Color System

### Dynamic Color (Material You)

```
Android 12+ Dynamic Color:

User's wallpaper → Color extraction → App theme
```

### Dark Theme

```
Material Dark Theme:

├── Background: #121212 (not pure black by default)
├── Surface: #1E1E1E, #232323, etc.
├── Elevation: Higher = lighter overlay
└── Reduce saturation on colors
```

---

## 4. Android Layout & Spacing

### Layout Grid

```
Android uses 8dp baseline grid:

All spacing in multiples of 8dp:
├── 4dp: Component internal (half-step)
├── 8dp: Minimum spacing
├── 16dp: Standard spacing
├── 24dp: Section spacing
└── Margins: 16dp (phone), 24dp (tablet)
```

---

## 5. Android Navigation Patterns

### Navigation Components

| Component | Use Case | Position |
|-----------|----------|----------|
| **Bottom Navigation** | 3-5 destinations | Bottom |
| **Navigation Rail** | Tablets | Left side |
| **Navigation Drawer** | Many destinations | Left side |
| **Top App Bar** | Context, actions | Top |

### Back Navigation

```
Android provides system back:
├── Back button (3-button nav)
├── Back gesture (swipe from edge)
└── Predictive back (Android 14+)
```

---

## 6. Material Components

### Buttons

```
Button Types:
├── Filled Button: Primary action
├── Tonal Button: Secondary action
├── Outlined Button: Tertiary action
└── Text Button: Lowest emphasis

Height: 40dp standard, 56dp large
Touch target: 48dp minimum
```

### Cards

```
Card Types:
├── Elevated: Shadow, resting state
├── Filled: Background color, no shadow
└── Outlined: Border, no shadow

Corner radius: 12dp
Padding: 16dp
```

---

## 7. Android-Specific Patterns

### Ripple Effect

```
Every touchable element needs ripple:

Touch down → Ripple expands from touch point
Color: Black at ~12% opacity
```

### Snackbars

```
Position: Bottom, above navigation
Duration: 4-10 seconds
Action: One optional text action
Corner radius: 4dp (if pill-shaped)
```

### Bottom Sheets

```
Types:
├── Standard: Interactive content
└── Modal: Blocks background

Corner radius: 28dp (top corners)
```

---

## 8. Material Symbols

### Usage Guidelines

```
Material Symbols: Google's icon library

Styles:
├── Outlined: Default
├── Rounded: Softer
└── Sharp: Angular

Sizes: 20dp (dense), 24dp (standard), 40dp (emphasis)
```

---

## 9. Android Accessibility

### Touch Target Size

```
MANDATORY: 48dp × 48dp minimum
```

### TalkBack Requirements

```
Every interactive element needs:
├── contentDescription
├── Correct semantics
└── State announcements
```

---

## 10. Android Checklist

### Before Every Android Screen

- [ ] Using Material 3 components
- [ ] Touch targets ≥ 48dp
- [ ] Ripple effect on all touchables
- [ ] Semantic colors
- [ ] Back navigation works correctly

### Before Android Release

- [ ] Dark theme tested
- [ ] All font sizes tested (200% scale)
- [ ] TalkBack tested
- [ ] Different screen sizes tested
- [ ] Edge-to-edge display (Android 15+)

---

> **Remember:** Android users expect Material Design. Use Material components as your foundation.
