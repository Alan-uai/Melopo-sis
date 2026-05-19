# Touch Psychology Reference

> Deep dive into mobile touch interaction, Fitts' Law for touch, thumb zone anatomy, gesture psychology, and haptic feedback.
> **This is the mobile equivalent of ux-psychology.md - CRITICAL for all mobile work.**

---

## 1. Fitts' Law for Touch

### The Fundamental Difference

```
DESKTOP (Mouse/Trackpad):
├── Cursor size: 1 pixel
├── Visual feedback: Hover states
└── Error cost: Low

MOBILE (Finger):
├── Contact area: ~7mm diameter (imprecise)
├── Visual feedback: No hover, only tap
├── Error cost: High (frustrating)
└── Occlusion: Finger covers target
```

### Minimum Touch Target Sizes

| Platform | Minimum | Recommended |
|----------|---------|-------------|
| **iOS (HIG)** | 44pt × 44pt | 48pt+ |
| **Android (Material)** | 48dp × 48dp | 56dp+ |
| **WCAG 2.2** | 44px × 44px | - |

---

## 2. Thumb Zone Anatomy

### One-Handed Phone Usage

```
Research shows: 49% of users hold phone one-handed.

EASY TO REACH: Bottom center/right
HARD TO REACH: Top of screen

SOLUTION: Place primary CTAs at bottom!
```

---

## 3. Touch vs Click Psychology

### Expectation Differences

| Aspect | Click | Touch |
|--------|-------|-------|
| **Feedback timing** | 100ms OK | <50ms expected |
| **Visual feedback** | Hover → Click | Immediate tap |
| **Precision** | High | Low |
| **Error tolerance** | Easy retry | Frustrating |

### Touch Feedback Requirements

```
Tap → Immediate visual change (< 50ms)
├── Highlight state
├── Scale down slightly
└── Ripple effect (Android)

Loading → Show within 100ms
```

---

## 4. Gesture Psychology

### Gesture Discoverability Problem

```
Problem: Gestures are INVISIBLE.

Solution: Always provide visible alternative.
├── Swipe to delete → Also show delete button
├── Pull to refresh → Also show refresh button
└── Gestures as shortcuts, not only way
```

### Platform Gesture Differences

| Gesture | iOS | Android |
|---------|-----|---------|
| **Back** | Edge swipe | System back |
| **Share** | Action sheet | Share sheet |
| **Delete in list** | Swipe left | Swipe left |

---

## 5. Haptic Feedback Patterns

### Why Haptics Matter

```
Haptics provide:
├── Confirmation without looking
├── Premium feel
├── Accessibility (blind users)
└── Reduced error rate
```

### iOS Haptic Types

| Type | Intensity | Use Case |
|------|-----------|----------|
| `selection` | Light | Picker scroll |
| `light` | Light | Minor actions |
| `medium` | Medium | Standard tap |
| `heavy` | Strong | Important actions |
| `success` | Pattern | Task complete |
| `error` | Pattern | Failed action |

### Android Haptic Types

| Type | Use Case |
|------|----------|
| `CLICK` | Standard tap |
| `HEAVY_CLICK` | Important actions |
| `LONG_PRESS` | Long press activation |

---

## 6. Mobile Cognitive Load

### Reducing Mobile Cognitive Load

```
1. ONE PRIMARY ACTION per screen
2. PROGRESSIVE DISCLOSURE (show only needed)
3. SMART DEFAULTS
4. CHUNKING (break long forms)
5. RECOGNITION over RECALL
6. CONTEXT PERSISTENCE
```

### Miller's Law for Mobile

```
Desktop: 7±2 items
Mobile: 5±1 items (more distractions)

Navigation: Max 5 tab bar items
Options: Max 5 per menu level
```

---

## 7. Touch Accessibility

### Motor Impairment Considerations

```
Users may have:
├── Tremors (need larger targets)
├── Limited reach (one-handed)
└── Need more time

Design responses:
├── 48dp+ touch targets
├── Undo for destructive actions
└── Voice control support
```

---

## 8. Touch Psychology Checklist

### Before Every Screen

- [ ] **All touch targets ≥ 44-48px?**
- [ ] **Primary CTA in thumb zone?**
- [ ] **Destructive actions require confirmation?**
- [ ] **Gesture alternatives exist?**
- [ ] **Haptic feedback on important actions?**
- [ ] **Immediate visual feedback on tap?**

---

## 9. Quick Reference Card

### Touch Target Sizes

```
                     iOS        Android
Minimum:           44pt       48dp
Recommended:       48pt+      56dp+
```

### Thumb Zone Actions

```
TOP:      Navigation, settings (infrequent)
MIDDLE:   Content, secondary actions
BOTTOM:   Primary CTA, tab bar, FAB (frequent)
```

---

> **Remember:** Every touch is a conversation between user and device. Make it feel natural, responsive, and respectful of human fingers.
