// Designally Knowledge Hub — design-system component barrel.
// The shared components of the Branding Explained system. Their styles live in
// styles/components.css and use the tokens in styles/tokens/. The gallery at
// /design-system renders them all.
export { Icon } from './Icon'
export { Button } from './Button'
export { IconButton } from './IconButton'
export { Tag } from './Tag'
export { TopicPill } from './TopicPill'
export { ArticleCard } from './ArticleCard'
export { ResourceCard } from './ResourceCard'
export { ResourceFigure, type ResourceGlyphName } from './ResourceFigure'
export { FileTypeIcon, fileKindFor } from './FileTypeIcon'
export { SectionHeading } from './SectionHeading'
export { Tabs, type TabItem } from './Tabs'
export { FilterChip } from './FilterChip'
export { SocialLinks } from './SocialLinks'
export { Divider } from './Divider'

// Behaviour, reusable across content types.
export { useCarousel } from './useCarousel.js'
