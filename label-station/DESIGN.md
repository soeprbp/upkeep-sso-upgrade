# UpKeep Label Station Design System

## 1. Atmosphere & Identity

A precise Welch maintenance workbench: quiet white working surfaces, ink-navy type, restrained cobalt selection, and Welch red reserved for the final print action and destructive controls. The signature is a clear left-to-right task progression from asset selection through queue to physical preview. This documents and refines the incumbent UI rather than replacing it.

## 2. Color

| Role | Token | Value | Usage |
| --- | --- | --- | --- |
| Ink | `--navy` | `#071b47` | Brand and headings |
| Text | `--text` | `#0e2349` | Primary copy |
| Secondary | `--muted` | `#52627b` | Supporting copy |
| Blue | `--blue` | `#075ecf` | Selected asset, create action, focus |
| Blue hover | `--blue-hover` | `#004cae` | Primary action hover |
| Red | `--red` | `#ba0c16` | Print and destructive action |
| Red hover | `--red-hover` | `#970911` | Print hover |
| Green | `--green` | `#08754f` | Verified portal |
| Amber | `--amber` | `#925c04` | Portal review |
| Border | `--border` | `#d7dfeb` | Controls and pane boundaries |
| Soft border | `--border-soft` | `#e8edf4` | Table rows |
| Soft surface | `--soft` | `#f5f7fb` | Background hierarchy |
| White surface | `--surface` | `#ffffff` | Work areas and labels |

Semantic tints are used only with their associated status. The monochrome physical label and QR remain black on white regardless of screen colors.

## 3. Typography

One UI family: Segoe UI with system sans fallbacks. The Windows operational context takes precedence over decorative display typography. Main headings 18–22px / 650–700; panel headings 16–18px / 650; body and controls 13–14px / 400–600; metadata 11–12px / 500–700. Print-label type retains physical-inch sizing in CSS because printed output is measured in inches, not screen pixels.

## 4. Spacing & Layout

Four-pixel base scale: 4, 8, 12, 16, 20, 24, 32px. The desktop shell has a 68px brand bar, three work panes, and a print summary. At wide desktop width the panes are asset search, queue/configuration, and preview. Below 1380px, asset selection and queue share two panes while preview spans the width beneath them; below 760px all panes stack. Electron itself maintains a 1000px minimum window width.

The asset list is the explicit scroll owner and is height-bounded so its status/action stay visible. The document may scroll when the whole workflow exceeds the viewport. The print root is separate and hidden on screen. Letter 4-up output uses the full 8.5 × 11-inch sheet as four equal 4.25 × 5.5-inch quadrants with no sheet gap or padding; safe space belongs inside each label.

## 5. Components

### Step heading
- Structure: numbered marker, heading, short guidance.
- States: informational only; no fake interaction.
- Accessibility: semantic heading and legible supporting text.

### Asset picker
- Structure: search, sticky table header, scrollable selectable rows, portal status, one contextual action.
- States: loading, empty, selected, portal-ready, missing-portal, needs-review, error.
- Accessibility: named search, radio semantics, keyboard focus, status text beyond dot color.
- Scroll owner: asset list only.

### Action button
- Variants: blue create, neutral add, red print, outline secondary, quiet destructive.
- States: default, hover, focus-visible, active, disabled, loading.
- Accessibility: at least 40px control height and visible focus ring.

### Queue row and profile switch
- Structure: asset identity, quantity control, verified status, duplicate/remove; two output profiles.
- States: empty, populated, selected profile, disabled where inapplicable.
- Accessibility: named quantity and action controls; selected profile exposed by pressed state.

### Preview and dialog
- Preview: sheet-shaped physical mock; empty guidance; page count and navigation.
- Dialog: only for credential configuration or confirmed live portal creation; focused content and clear actions.

## 6. Motion & Interaction

Operational motion is restrained: 120–180ms color/shadow transitions communicate hover, selection, and focus. No page-load choreography or decorative animation. Reduced-motion preference removes transitions.

## 7. Depth & Surface

Mixed but restrained: crisp borders identify controls, tonal shifts separate work regions, and a soft offset shadow lifts only the print sheet and modal. No decorative glow or repeated nested cards.

## 8. Accessibility Constraints & Accepted Debt

Target WCAG 2.2 AA: 4.5:1 small-text contrast, 3:1 large text, keyboard-visible focus, explicit text alongside color-coded status, meaningful loading/error/empty states, and reduced-motion support. The print label's exact sizes are a physical-output constraint and intentionally differ from the UI type scale.

No additional accepted debt is introduced by this polish pass.
