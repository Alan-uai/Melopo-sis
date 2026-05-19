# iOS Platform Guidelines

> Human Interface Guidelines (HIG) essentials, iOS design conventions, SF Pro typography, and native patterns.
> **Read this file when building for iPhone/iPad.**

---

## 1. Human Interface Guidelines Philosophy

### Core Apple Design Principles

```
CLARITY:
├── Text is legible at every size
├── Icons are precise and lucid
└── Focus on functionality drives design

DEFERENCE:
├── Content fills the screen
├── UI never competes with content
└── Translucency hints at more content

DEPTH:
├── Distinct visual layers convey hierarchy
├── Transitions provide sense of depth
└── Touch reveals functionality
```

---

## 2. iOS Typography

### SF Pro Font Family

```
iOS System Fonts:
├── SF Pro Text: Body text (< 20pt)
├── SF Pro Display: Large titles (≥ 20pt)
├── SF Pro Rounded: Friendly contexts
├── SF Mono: Monospace
└── SF Compact: Apple Watch
```

### Dynamic Type Support (MANDATORY)

```
User can set text size from 14pt to 53pt body.
Your app MUST scale gracefully at all sizes.
```

---

## 3. iOS Color System

### System Colors (Semantic)

```
Use semantic colors for automatic dark mode:

Primary:
├── .label → Primary text
├── .secondaryLabel → Secondary text
├── .systemBackground → Main background
└── Accent colors: Blue, Green, Red, Orange, etc.
```

### Dark Mode Considerations

```
LIGHT MODE:              DARK MODE:
├── White backgrounds    ├── True black (#000)
├── High saturation      ├── Desaturated colors
└── Black text          └── Light gray text
```

---

## 4. iOS Layout & Spacing

### Safe Areas

```
Never place interactive content in unsafe areas:
├── Top: Status bar
└── Bottom: Home indicator

Use SafeAreaView to handle this.
```

### Standard Margins & Padding

| Element | Margin |
|---------|--------|
| Screen edge → content | 16pt |
| Grouped table sections | 16pt |
| List item padding | 16pt |

---

## 5. iOS Navigation Patterns

### Navigation Types

| Pattern | Use Case |
|---------|----------|
| **Tab Bar** | 3-5 top-level sections |
| **Navigation Controller** | Hierarchical drill-down |
| **Modal** | Focused task |
| **Sidebar** | iPad, multi-column |

### Gestures

| Gesture | iOS Convention |
|---------|-----------------|
| **Edge swipe (left)** | Navigate back |
| **Pull down (sheet)** | Dismiss modal |
| **Long press** | Context menu |

---

## 6. iOS Components

### Buttons

```
Button Styles:
├── Tinted: Primary action (filled)
├── Bordered: Secondary action (outline)
└── Plain: Tertiary action (text only)

Sizes: Mini, Small, Medium, Large
```

### Lists & Tables

```
List Styles:
├── .plain: No separators
├── .insetGrouped: Rounded cards
└── .grouped: Full-width sections
```

---

## 7. iOS Specific Patterns

### Pull to Refresh

```
Always use native UIRefreshControl.
```

### Swipe Actions

```
← Swipe Left: Archive, Delete, Flag
Swipe Right: → Pin, Star, Mark as Read
```

### Context Menus

```
Long press → Context menu appears with preview
```

---

## 8. SF Symbols

### Usage Guidelines

```
SF Symbols: Apple's icon library (5000+ icons)

Weights: Match text weight
Scales: .small, .medium, .large
```

---

## 9. iOS Accessibility

### VoiceOver Requirements

```
Every interactive element needs:
├── Accessibility label (what it is)
├── Accessibility hint (optional)
└── Accessibility traits
```

### Dynamic Type Scaling

```
Test at ALL sizes:
├── xSmall → 14pt body
├── Large (Default) → 17pt body
└── xxxLarge → 53pt body
```

---

## 10. iOS Checklist

### Before Every iOS Screen

- [ ] Using SF Pro or SF Symbols
- [ ] Dynamic Type supported
- [ ] Safe areas respected
- [ ] Touch targets ≥ 44pt
- [ ] Navigation follows HIG

### Before iOS Release

- [ ] Dark mode tested
- [ ] VoiceOver tested
- [ ] Edge swipe back works everywhere
- [ ] Notch/Dynamic Island handled
- [ ] Home indicator area respected

---

> **Remember:** iOS users have strong expectations from other iOS apps. When in doubt, use native components.
