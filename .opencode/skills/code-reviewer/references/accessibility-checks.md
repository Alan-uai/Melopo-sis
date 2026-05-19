# Accessibility (A11y) Checks Reference

## Required Attributes

### Images
```tsx
// BAD
<img src="photo.jpg" />

// GOOD
<img src="photo.jpg" alt="Foto do usuário João Silva" />
```

### Buttons
```tsx
// BAD
<div onClick={handleClick}>Clique aqui</div>

// GOOD
<button onClick={handleClick}>Clique aqui</button>
```

### Links
```tsx
// BAD
<span onClick={navigate}>Ir para página</span>

// GOOD
<a href="/pagina" onClick={navigate}>Ir para página</a>
```

### Forms
```tsx
// BAD
<input type="text" placeholder="Nome" />

// GOOD
<label htmlFor="name">Nome</label>
<input id="name" type="text" aria-describedby="name-hint" />
<span id="name-hint">Seu nome completo</span>
```

## Keyboard Navigation

- All interactive elements must be focusable
- Logical tab order
- Focus indicators visible
- Skip links for main content

## Color Contrast

- Text: minimum 4.5:1 (WCAG AA)
- Large text: minimum 3:1
- UI components: minimum 3:1

## ARIA Guidelines

```tsx
// BAD - Missing context
<button>...</button>

// GOOD - Clear purpose
<button aria-label="Fechar modal de configurações" aria-pressed={isOpen}>
  <CloseIcon />
</button>

// BAD - Missing expanded state
<button>Menu</button>

// GOOD - With state
<button aria-expanded={isMenuOpen} aria-controls="menu">
  Menu
</button>
<div id="menu" hidden={!isMenuOpen}>
```
