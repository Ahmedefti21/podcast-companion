# Recast design direction

An episode reading desk for people who listen to learn. The distinctive interaction is the short path from insight to original passage, and from a missed question back to that passage.

## Tokens and composition

- Canvas: light lilac `#FAF7FC`; reading paper `#FFFFFF`.
- Ink: plum `#30233D`; secondary text `#706379`.
- Primary action: violet `#684294`; soft surface: lavender `#EFE7F6`.
- Gradient light: apricot `#FFC99F`, used alongside lilac in the episode header, navigation and supporting surfaces. Warning and error states retain distinct amber/red treatments.
- Typography: locally bundled Manrope. 16px mobile reading text, generous line height, up to 54px episode title on desktop. Source controls are at least 11px.
- Layout: quiet navigation rail, large episode heading, ordered chapter ribbon, overview and takeaway columns. Evidence opens in a keyboard-accessible side dialog.
- Numbering denotes actual source order or question order, not decoration.
- No decorative audio waveform: text input has no audio signal to visualize. The cover uses original abstract conversation rings.
- Motion responds to actions: 240ms view crossfades and dialog entrances, directional source-drawer entry, 220ms answer/revision feedback, tactile button press and an indeterminate processing sweep. No fabricated progress percentage or continuously drifting backdrop. Reduced-motion users get immediate state changes and static processing text.

## Design review

UI UX Pro Max's podcast palette match was relevant, but its generated scrolling entertainment layout and second educational claymorphism match did not fit an adult reading workspace. We retained accessibility and interaction guidance and authored the palette/layout above. We do not claim these are generated recommendations.

The second visual pass follows the user's gradient reference: light apricot glow and fine vertical rays, softened with lilac instead of the reference's black background and saturated orange. The header is the main expressive surface; the longer reading areas stay quiet. This remains original app styling, not a copied template. At tablet widths the reading layout collapses to one column; navigation icons retain accessible labels.

Visual polish is not equivalent to a launched multi-tenant SaaS. Accounts, durable storage, user-specific quotas, production monitoring and a verified deployment still require separate implementation and decisions. The current tab-only storage disclosure remains visible in the input flow.

Avoid a marketing landing page, invented listening times, fake playback controls, endless card grids, and unsubstantiated confidence percentages.
