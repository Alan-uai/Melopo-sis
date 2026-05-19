# TypeScript Best Practices Reference

## Avoid `any`

### BAD
```typescript
function processData(data: any): any {
  return data.items.map((item: any) => item.value);
}
```

### GOOD
```typescript
interface DataItem {
  value: string;
}

interface Data {
  items: DataItem[];
}

function processData(data: Data): string[] {
  return data.items.map(item => item.value);
}
```

## Use `unknown` for External Data

### BAD
```typescript
function parseResponse(response: any) {
  return response.data;
}
```

### GOOD
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
});

function parseResponse(response: unknown) {
  const validated = UserSchema.parse(response);
  return validated;
}
```

## Explicit Return Types for Exports

```typescript
// GOOD - Explicit return type
export function createUser(data: CreateUserDTO): Promise<User> {
  return db.users.create(data);
}
```

## Avoid Type Assertions Without Validation

### BAD
```typescript
const user = data as User;
```

### GOOD
```typescript
const user = UserSchema.parse(data);
```

## Union Types Instead of `any`

### BAD
```typescript
function formatDate(date: any): string {
  return new Date(date).toLocaleDateString();
}
```

### GOOD
```typescript
function formatDate(date: string | Date | number): string {
  return new Date(date).toLocaleDateString();
}
```
