# Design System (UI Kit)

## Color Palette

### Primary Colors
- **Primary**: `#0066CC` - Used for CTAs, links, focus states
- **Primary Light**: `#E6F0FF` - Light backgrounds
- **Primary Dark**: `#003D99` - Hover/active states

### Secondary Colors
- **Secondary**: `#FF6B35` - Accent, warnings
- **Secondary Light**: `#FFE8DB`
- **Secondary Dark**: `#CC3D1F`

### Semantic Colors
- **Success**: `#28A745` - Forms, confirmations
- **Error**: `#DC3545` - Validation errors
- **Warning**: `#FFC107` - Caution messages
- **Info**: `#17A2B8` - Informational

### Neutral
- **Background**: `#FFFFFF`
- **Surface**: `#F8F9FA`
- **Border**: `#E9ECEF`
- **Text Primary**: `#212529`
- **Text Secondary**: `#6C757D`
- **Text Disabled**: `#ADB5BD`

## Typography

### Font Families
- **Headings**: Inter, sans-serif
- **Body**: Inter, sans-serif
- **Monospace**: IBM Plex Mono, monospace

### Type Scale
- **Display**: 48px / 1.2 line-height / 700 weight
- **H1**: 36px / 1.3 / 700
- **H2**: 28px / 1.3 / 700
- **H3**: 24px / 1.35 / 600
- **H4**: 20px / 1.4 / 600
- **Body**: 16px / 1.5 / 400
- **Body Small**: 14px / 1.5 / 400
- **Caption**: 12px / 1.6 / 400
- **Code**: 14px / 1.5 / 400 (monospace)

## Spacing Scale

Base unit: 8px

- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

## Responsive Breakpoints

- **Mobile**: 0-640px (4 columns)
- **Tablet**: 641-1024px (8 columns)
- **Desktop**: 1025-1440px (12 columns)
- **Wide**: 1441px+ (12 columns, max 1440px container)

## Component Library

### Buttons

**Primary Button** (CTA)
- Background: Primary (`#0066CC`)
- Text: White
- Padding: 12px 24px
- Border Radius: 6px
- Hover: Primary Dark (`#003D99`)
- Active: Primary Dark with inset shadow
- Disabled: Gray with 50% opacity
- Min touch target: 44x44px

**Secondary Button**
- Background: Transparent
- Border: 2px Primary
- Text: Primary
- Padding: 10px 22px (accounts for border)
- Hover: Light Primary background

### Form Inputs

**Text Input**
- Border: 1px `#E9ECEF`
- Padding: 12px 16px
- Border Radius: 6px
- Font: Body (16px)
- Focus: 2px Primary outline, -2px offset
- Disabled: Background `#F8F9FA`, text `#ADB5BD`
- Error: Border color becomes Error (red)

**Select/Dropdown**
- Same styling as text input
- Arrow icon on right side
- Open: Border Primary, outline Primary
- Options: Body text, 48px min height per option

### Cards

- Background: White
- Border: 1px `#E9ECEF`
- Border Radius: 8px
- Padding: 24px
- Box Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Hover: Box Shadow becomes 0 4px 12px rgba(0,0,0,0.15)

## Animations

- **Instant** (100ms): Micro-interactions (button press)
- **Fast** (200ms): State changes
- **Medium** (300ms): Page transitions
- **Slow** (500ms): Entrance animations

Timing function: `cubic-bezier(0.4, 0.0, 0.2, 1)` (Material Design)

## Accessibility Standards

- **Touch targets**: Minimum 44x44px
- **Color contrast**: WCAG AA (4.5:1 for text)
- **Focus indicators**: Visible 2px outline
- **Line height**: Minimum 1.5
- **Font size**: Minimum 14px for body text

## Grid System

**Desktop (12 columns)**
- Column width: calc((100% - 48px) / 12)
- Gutter: 16px (8px each side)
- Max width: 1440px container

## Status

**Version**: 1.0  
**Last Updated**: [Date]
