# Design System: ChefScale
> Inherits from ~/Developer/DESIGN.md (ALSTIG global design system)

## Product Overrides

### Colors
- Background: `#0A0A0A` (rich black)
- Card: `#141414` | Elevated: `#1E1E1E`
- Primary (Gold/Copper): `#D97706` | Light: `#F59E0B` | Dark: `#B45309`
- Secondary (Teal): `#0D9488`

### Typography
- Font: Inter via `@expo-google-fonts/inter` (weights: 400, 600, 700)
- Sizes: xs(11), sm(13), md(15), lg(17), xl(20), xxl(24), xxxl(28), display(34), hero(42)

### Spacing
- xs(4), sm(8), md(12), lg(16), xl(20), xxl(24), xxxl(32)

### Border Radius
- sm(8), md(12), lg(16), xl(20), xxl(24), full(9999)

### Glass Effect
- Background: `rgba(255,255,255,0.08)`
- Border: `rgba(255,255,255,0.12)`

### Category Gradients
Used on recipe cards as overlay strips: copper, red, orange, pink, teal, green, purple.

## App-Specific Components

- **GlassCard** -- frosted translucent card with subtle white border
- **RecipeCard** -- card with category-based gradient overlay, scaling info, and allergen display
- **Allergen Badges** -- small labeled badges for dietary/allergen flags
- **Cross-Promo** -- promotional banners linking to other ALSTIG apps
