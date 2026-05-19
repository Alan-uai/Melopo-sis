# Mobile Performance Reference

> Deep dive into React Native and Flutter performance optimization, 60fps animations, memory management, and battery considerations.
> **This file covers the #1 area where AI-generated code FAILS.**

---

## 1. The Mobile Performance Mindset

### Why Mobile Performance is Different

```
DESKTOP:                          MOBILE:
├── Unlimited power               ├── Battery matters
├── Abundant RAM                  ├── RAM is shared, limited
├── Stable network                ├── Network is unreliable
├── CPU always available          ├── CPU throttles when hot
└── User expects fast anyway      └── User expects INSTANT
```

### Performance Budget Concept

```
Every frame must complete in:
├── 60fps → 16.67ms per frame
├── 120fps (ProMotion) → 8.33ms per frame

If your code takes longer:
├── Frame drops → Janky scroll/animation
└── User uninstalls your app
```

---

## 2. React Native Performance

### 🚫 The #1 AI Mistake: ScrollView for Lists

```javascript
// ❌ NEVER DO THIS - AI's favorite mistake
<ScrollView>
  {items.map(item => (
    <ItemComponent key={item.id} item={item} />
  ))}
</ScrollView>

// ✅ ALWAYS USE FlatList
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={item => item.id}
/>
```

### FlatList Optimization Checklist

```javascript
// ✅ CORRECT: All optimizations applied

// 1. Memoize the item component
const ListItem = React.memo(({ item }: { item: Item }) => {
  return (
    <Pressable style={styles.item}>
      <Text>{item.title}</Text>
    </Pressable>
  );
});

// 2. Memoize renderItem with useCallback
const renderItem = useCallback(
  ({ item }: { item: Item }) => <ListItem item={item} />,
  [] // Empty deps = never recreated
);

// 3. Stable keyExtractor (NEVER use index!)
const keyExtractor = useCallback((item: Item) => item.id, []);

// 4. Provide getItemLayout for fixed-height items
const getItemLayout = useCallback(
  (data: Item[] | null, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }),
  []
);

// 5. Apply to FlatList
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={keyExtractor}
  getItemLayout={getItemLayout}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
  updateCellsBatchingPeriod={50}
/>
```

### FlashList: The Better Option

```javascript
import { FlashList } from "@shopify/flash-list";

<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={ITEM_HEIGHT}
  keyExtractor={keyExtractor}
/>
```

### Animation Performance

```javascript
// ❌ JS-driven animation (blocks JS thread)
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  useNativeDriver: false, // BAD!
}).start();

// ✅ Native-driver animation (runs on UI thread)
Animated.timing(value, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // GOOD!
}).start();
```

### Reanimated for Complex Animations

```javascript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const Component = () => {
  const offset = useSharedValue(0);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(offset.value) }],
  }));

  return <Animated.View style={animatedStyles} />;
};
```

### Memory Leak Prevention

```javascript
// ❌ Memory leak: uncleared interval
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 5000);
  // Missing cleanup!
}, []);

// ✅ Proper cleanup
useEffect(() => {
  const interval = setInterval(() => {
    fetchData();
  }, 5000);
  return () => clearInterval(interval);
}, []);
```

---

## 3. Flutter Performance

### 🚫 The #1 AI Mistake: setState Overuse

```dart
// ❌ WRONG: setState rebuilds ENTIRE widget tree
class BadCounter extends StatefulWidget {
  @override
  State<BadCounter> createState() => _BadCounterState();
}

class _BadCounterState extends State<BadCounter> {
  int _counter = 0;
  
  void _increment() {
    setState(() {
      _counter++;
    });
  }
}
```

### The `const` Constructor

```dart
// ✅ CORRECT: const prevents rebuilds
class GoodCounter extends StatelessWidget {
  const GoodCounter({super.key});
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text('Counter: $_counter'),
        const ExpensiveWidget(),
      ],
    );
  }
}
```

### Targeted State Management

```dart
// ✅ ValueListenableBuilder: surgical rebuilds
ValueListenableBuilder<int>(
  valueListenable: counter,
  builder: (context, value, child) => Text('$value'),
)
```

### ListView Optimization

```dart
// ✅ CORRECT: ListView.builder (lazy rendering)
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ItemWidget(items[index]),
  itemExtent: 56, // Fixed height = faster layout
)
```

### Dispose Pattern

```dart
@override
void dispose() {
  _textController.dispose();
  _controller.dispose();
  _subscription.cancel();
  super.dispose();
}
```

---

## 4. Animation Performance (Both Platforms)

### The 60fps Imperative

```
Human eye detects:
├── < 24 fps → "Slideshow"
├── 30-45 fps → "Choppy"
├── 45-60 fps → "Smooth"
└── 60 fps → "Buttery" (target)
```

### GPU vs CPU Animation

```
GPU-ACCELERATED (FAST):          CPU-BOUND (SLOW):
├── transform: translate          ├── width, height
├── transform: scale              ├── margin, padding
├── transform: rotate             ├── borderRadius
└── opacity                       └── box-shadow

RULE: Only animate transform and opacity.
```

---

## 5. Memory Management

### Common Memory Leaks

| Source | Solution |
|--------|----------|
| Timers | Clear in cleanup/dispose |
| Event listeners | Remove in cleanup/dispose |
| Subscriptions | Cancel in cleanup/dispose |
| Large images | Limit cache, resize |

### Image Memory

```
Image memory = width × height × 4 bytes (RGBA)

1080p image = 8.3 MB
10 4K images = 332 MB → App crash!

RULE: Always resize images to display size.
```

---

## 6. Battery Optimization

### Battery Drain Sources

| Source | Impact | Mitigation |
|--------|--------|------------|
| **Screen on** | 🔴 Highest | Dark mode on OLED |
| **GPS continuous** | 🔴 Very high | Significant change API |
| **Network requests** | 🟡 High | Batch, cache aggressively |
| **Animations** | 🟡 Medium | Reduce when low battery |

---

## 7. Network Performance

### Offline-First Architecture

```
UI → Cache (read first) → Network (update cache)
```

---

## 8. Performance Testing

### What to Test

| Metric | Target | Tool |
|--------|--------|------|
| **Frame rate** | ≥ 60fps | Performance overlay |
| **Memory** | Stable, no growth | Profiler |
| **Cold start** | < 2s | Manual timing |
| **List scroll** | No jank | Manual feel |

### Test on Real Devices

```
NEVER trust only:
├── Simulator/emulator (faster than real)
├── Dev mode (slower than release)
└── High-end devices

ALWAYS test on:
├── Low-end Android (< $200 phone)
├── Older iOS device (iPhone 8)
└── Release/profile build
```

---

## 9. Quick Reference Card

### React Native Essentials

```javascript
// List: Always use
<FlatList
  data={data}
  renderItem={useCallback(({item}) => <MemoItem item={item} />, [])}
  keyExtractor={useCallback(item => item.id, [])}
  getItemLayout={useCallback((_, i) => ({length: H, offset: H*i, index: i}), [])}
/>

// Animation: Always native
useNativeDriver: true

// Cleanup: Always present
useEffect(() => {
  return () => cleanup();
}, []);
```

### Flutter Essentials

```dart
// Widgets: Always const
const MyWidget()

// Lists: Always builder
ListView.builder(itemBuilder: ...)

// Dispose: Always cleanup
@override
void dispose() {
  controller.dispose();
  super.dispose();
}
```

---

> **Remember:** Performance is not optimization—it's baseline quality. A slow app is a broken app. Test on the worst device your users have.
