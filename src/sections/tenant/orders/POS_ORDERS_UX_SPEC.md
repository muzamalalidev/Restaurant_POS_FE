# POS Orders Screen – UX Spec & Implementation Notes

**Path:** `/tenant/orders`  
**Audience:** Cashiers (primary), Managers  
**Context:** Production Restaurant POS SaaS; mission-critical during rush hours on touch devices.

---

## 1. R&D & UX Research

### 1.1 Current Screen Analysis (Reference Image)

The reference Orders screen uses a two-pane layout:

- **Left:** Category strip + product grid (images, name, price). One tap adds item.
- **Right:** Order context (order type, table, customer, waiter), cart lines (item, qty +/- , disc %, price, edit/delete), summary (subtotal, charges, discounts, grand total), payment (mode, amount, cash back), and actions (Send To Kitchen, Save, KOT Print, KDS Print).

**Observed strengths:** Clear left/right split, visible grand total, quantity controls on each line, payment and change visible.

**Observed risks:**

- Redundant order-type selection (top bar + right pane) adds cognitive load.
- Dense right pane with small text and small icon targets (edit/delete) increases mis-tap and cognitive load.
- Cart is table-like but not a heavy grid; keeping it as a simple list aligns with "avoid heavy grids in checkout."

### 1.2 Modern POS UI Patterns (Synthesis)

From POS/retail UI patterns (Shopify POS, Quantic, enterprise POS):

| Pattern | Application |
|--------|-------------|
| **Left menu / center items / right cart** | Keep: categories filter items; center or left for products; right for cart and payment. Right-hand cart supports one-hand use when device is held in left hand. |
| **Touch ergonomics** | Minimum 44px tap targets; spacing between tappable areas; no tightly packed icon-only buttons without sufficient hit area. |
| **Visual hierarchy** | Grand total and primary action (Save/Pay) dominate; secondary actions (Send to Kitchen, Print) visually de-emphasized; line-level actions (edit, remove) clear but not competing with add/qty. |
| **Speed in rush** | Add item = one tap; change qty = direct +/-; search product always visible; payment amount and change visible without opening modals. |
| **Error prevention** | Confirm only for destructive (clear cart, void); no confirm for add/remove line; prevent double submit on Save; clear feedback on add (e.g. brief highlight or cart count update). |
| **Keyboard & scanner** | Search accepts focus and barcode input; payment amount field numeric and focusable; tab order: search → products (if applicable) → cart → payment → primary action. |

### 1.3 Dribbble POS order research

**Access note:** Direct fetch of `https://dribbble.com/search/pos-order` returned a bot-check page; individual shot pages returned 500. The following is from web search and design summaries; you can review the links in a browser for full visuals.

**Reference links (review manually):**

- [POS system for restaurants (collection)](https://dribbble.com/gracege/collections/4651723-POS-system-for-restaurants)
- [UI Design - POS restaurants](https://dribbble.com/shots/17812518-UI-Design-POS-restaurants)
- [POS - Restaurant management software](https://dribbble.com/shots/25682309-POS-Restaurant-management-software)
- [POS Web App Design For Restaurant](https://dribbble.com/shots/17510739-POS-Web-App-Design-For-Restaurant)
- [Web Restaurant Order](https://dribbble.com/shots/14324795-Web-Restaurant-Order)

**Patterns extracted from Dribbble-style POS designs:**

| Source / theme | Pattern we apply |
|----------------|------------------|
| **Rush Restaurant Management** (order management) | Add multiple products; send to kitchen; order status (queue, in preparation); support multiple orders per table; keep status visible without clutter. |
| **FoodEology POS** (search, pay, promotions) | Search food items; add/remove; order history; payment modes; clean dashboard (e.g. light backgrounds, clear hierarchy). |
| **Color and hierarchy** | Contrasting neutrals + one accent (e.g. purple/teal primary); or warm restaurant palette (pinks, browns, oranges). We use existing MUI theme; primary for total and Save only. |
| **iPad / cashier prototypes** | Large tap areas; minimal chrome; order flow first; admin/secondary actions de-emphasized. |
| **Retail & Lightspeed-style POS** | Category-driven product grid; compact cart list; prominent total and single primary CTA. |

We use these as **pattern inspiration only** (layout, hierarchy, touch targets, clarity), not pixel-level copy. Implementation stays within the existing design system and MUI.

---

## 2. UX Goals (Mandatory)

- **Minimize taps:** One tap to add item; inline qty +/-; no extra steps for standard flow.
- **Zero cognitive overload:** Single order-type context per order; clear zones (products vs cart vs payment); no duplicate selectors for the same concept.
- **Large touch targets (≥44px):** All interactive elements (product cards, qty +/- , primary/secondary buttons, payment input area) meet min height/width 44px.
- **One-hand tablet use:** Cart and payment on one side (e.g. right) so thumb can reach Save/Pay and qty without reaching across.
- **Keyboard & barcode friendly:** Search product and payment amount support keyboard/scanner; logical tab order; no trapping focus.
- **Visual feedback:** Clear feedback on add (e.g. cart count +1, optional brief row highlight); on remove, instant update; on save, loading state then success/error.
- **Prevent mis-clicks:** Adequate spacing; destructive actions (remove line, clear) with undo or confirm where appropriate; no stacking dialogs in checkout flow.
- **Fast scanning + manual search:** Search product prominent; results quick and tappable; barcode can populate search or directly add item when backend supports.

---

## 3. Final Layout Breakdown (Zones / Sections)

### 3.1 Desktop / Tablet (Horizontal)

```
+------------------------------------------------------------------+----------------------------+
| HEADER: [Menu] POS   [Tablet Orders toggle]  [Search Product]     Tables | Delivery | Take Away | Queue |
+------------------------------------------------------------------+----------------------------+
| CATEGORIES: [All Products] [Appetizers] [PIZZA] [Shakes] ... (horizontal scroll)               |
+------------------------------------------------------------------+----------------------------+
|                                                                  | ORDER CONTEXT              |
| PRODUCT GRID                                                      | Order type: Dine In | ...   |
| [Card] [Card] [Card] [Card] [Card]                              | Table: [Select Tables v]   |
| [Card] [Card] [Card] [Card] [Card]                              | Customer: [____] [+ user]   |
| ...                                                               | Waiter: [____]             |
|                                                                  |----------------------------|
|                                                                  | CART (simple list, no grid)|
|                                                                  | Item name     [-] 1 [+] ...|
|                                                                  | ...                        |
|                                                                  |----------------------------|
|                                                                  | Summary: Subtotal, Tax, Disc|
|                                                                  | GRAND TOTAL   PKR 1,220.75 |
|                                                                  |----------------------------|
|                                                                  | Payment: [Cash] [2000]     |
|                                                                  | Cash back: 779.25          |
|                                                                  | [Send Kitchen] [Save] ...  |
+------------------------------------------------------------------+----------------------------+
```

- **Zone A – Header:** Global search, order-type quick switch (Tables/Delivery/Take Away/Queue). Single source of truth for “session” order type; right pane only refines if needed (e.g. Dine In vs Service).
- **Zone B – Categories:** Single horizontal scroll strip; “All Products” + category chips; selection filters product grid. Touch-friendly chip height ≥44px.
- **Zone C – Product grid:** Cards (image, name, price). Each card ≥44px touch target; no nested tiny buttons. Optional lazy-load images; no heavy grid component (use CSS Grid or Flexbox).
- **Zone D – Order context:** Order type (if different from header), table, customer, waiter. Compact but readable; dropdowns/autocompletes use Field from hook-form.
- **Zone E – Cart:** Simple list (map over line items). Each row: name + price, qty with -/+, optional disc %, line total, edit (optional), remove. No DataGrid/CustomTable here (lightweight list only).
- **Zone F – Summary:** Items count, subtotal, tax, discount, then **Grand Total** (prominent).
- **Zone G – Payment:** Payment mode, amount tendered, cash back; primary action Save (or Pay).
- **Zone H – Actions:** Send To Kitchen, Save, KOT Print, KDS Print. Primary = Save; others secondary (outlined or text).

### 3.2 Mobile (Portrait)

- **Option A – Stacked:** Header → Categories → Full-width product grid (2 cols) → Collapsible “Cart” (bottom sheet or accordion) with same structure (context, lines, summary, payment, actions). Primary action fixed at bottom.
- **Option B – Tabs:** “Products” tab (categories + grid) and “Cart” tab (context, lines, summary, payment, actions). Reduces horizontal squeeze but adds one tap to switch.

Recommendation: Prefer **Option A** with a sticky “Cart (n)” bar that expands to bottom sheet so cashier stays in one scroll flow when needed.

### 3.3 What NOT to Change (Avoid Regressions)

- **Business logic:** Order type, table, customer, waiter, items (itemId, quantity, unitPrice, notes), tax/discount/surcharge rules, payment mode, and backend contract (e.g. createOrderSchema) remain unchanged.
- **Data sources:** Same APIs (orders, items, categories, branches, staff, tables, order types, payment modes); same RTK Query slices and cache invalidation.
- **Content and fields:** Do not remove or rename fields the backend expects; only re-layout and re-present (e.g. same fields in a different order or grouped differently).
- **Validation:** Keep using `createOrderSchema` (and any update schema) from `src/schemas`; keep React Hook Form + Zod.
- **Navigation and routes:** Path `/tenant/orders` can show POS canvas as default with a link “Order list” to the existing list view, or vice versa; do not remove the existing list view or its filters/actions.

---

## 4. Interaction Flow (Tap-by-Tap)

1. **Land:** Screen loads; categories and products load (skeleton or placeholder for grid); cart empty or restored (if draft supported).
2. **Set context (optional):** Select table, customer, waiter if needed. Defaults or last-used can reduce taps.
3. **Add item:** Tap product card → one line added to cart with qty 1, unit price from item. Visual feedback: cart count updates and/or cart row brief highlight.
4. **Adjust qty:** Tap - or + on line; qty and line total update immediately.
5. **Edit line (optional):** Tap edit → inline or small popover for notes/discount; no full-page.
6. **Remove line:** Tap remove; line disappears. No confirm for single line remove (optional confirm only for “Clear cart”).
7. **Discount / tax:** Applied at order level (existing logic); display in summary. Per-line disc % if supported: single input per line, no dialog.
8. **Payment:** Select mode; enter amount; cash back computed and shown. Focus and keyboard/scanner friendly.
9. **Save:** Tap Save → loading state on button → request (create order); success → toast + clear cart or navigate; error → toast with `getApiErrorMessage`, optional retry.
10. **Send To Kitchen / Print:** Secondary actions; do not block main flow; optional loading state.

---

## 5. Error & Empty State Design

- **Empty cart:** Right pane shows “Cart is empty. Tap a product to add.” No heavy illustration; minimal text. No primary Save until at least one item.
- **API error (load products/categories):** Inline in product zone: “Could not load products” + Retry button; use `getApiErrorMessage` for message; do not blank entire screen.
- **API error (save order):** Toast with `getApiErrorMessage(err, { defaultMessage: 'Failed to save order' })`; show `isRetryable` and Retry if applicable. Do not close cart; allow retry or correction.
- **Validation error:** Inline on field (e.g. table required, item required) via RHF; do not use modal for validation summary unless many fields.
- **Offline / network error:** Toast + optional “Retry” when back online; avoid silent failure.

---

## 6. Loading State Design

- **Initial load (categories + items):** Skeleton cards in product grid (same count as placeholder rows); category strip with skeleton chips. Cart zone: “Loading…” or skeleton lines. No full-page spinner over entire screen.
- **Search/filter:** Debounced input; optional small spinner in search field or below; results replace grid (no overlay).
- **Save order:** Button shows loading (disabled, spinner); optional subtle overlay on cart only (e.g. disabled state) to prevent double submit. No dialog spinner that blocks the whole POS.

---

## 7. Performance Considerations

- **Product grid:** Use CSS Grid or Flexbox; virtualize only if item count is very large (e.g. 500+). Prefer pagination or “Load more” over full virtualization for typical menu sizes.
- **Images:** Lazy-load product images (e.g. `loading="lazy"` or Intersection Observer); placeholder for missing image (e.g. placeholder icon).
- **Cart:** Pure list (no DataGrid); re-render only when cart state changes; keep line items in React state or RHF, not in heavy table component.
- **RTK Query:** Use existing `getItems`, `getCategories` (with categoryId filter for grid); prefetch or cache so switching categories is instant. Invalidate on create order as per existing `ordersApi` invalidation.
- **Bundle:** Do not import heavy grid or chart libraries in the POS order-entry view; keep it lightweight.

---

## 8. Implementation Notes (Next.js + MUI)

### 8.1 Route and Entry

- **Option A:** `/tenant/orders` renders the POS order-entry view by default; add a link/button “Order list” that navigates to a full-page list view (e.g. `/tenant/orders/list`), and move current `order-list-view.jsx` to that route.
- **Option B:** Keep `/tenant/orders` as current list view; add `/tenant/orders/new` (or `/tenant/pos`) for the POS order-entry canvas. Nav config: “Orders” → list; “New order” or “POS” → canvas.

Choose one and keep nav/routes consistent.

### 8.2 Components to Reuse (Strict)

- **Form & fields:** `Form`, `Field` from `src/components/hook-form` (Field.Text, Field.Autocomplete, Field.Button, etc.). No raw MUI inputs in forms.
- **Errors:** `getApiErrorMessage` from `src/utils/api-error-message` for all API error display and toasts.
- **Dialogs:** `CustomDialog`, `ConfirmDialog` from `src/components/custom-dialog` for any modal (e.g. table picker, confirm clear cart). Do not stack dialogs in main checkout flow.
- **Validation:** Schemas from `src/schemas` (e.g. `createOrderSchema`); no schema in section-level files.
- **API:** Existing RTK Query hooks: `useGetItemsQuery`, `useGetCategoriesQuery`, `useGetBranchesDropdownQuery`, `useGetStaffDropdownQuery`, `useGetTablesDropdownQuery`, `useGetOrderTypesDropdownQuery`, `useGetPaymentModesDropdownQuery` (if available), `useCreateOrderMutation`. Same base API and tenant context.

### 8.3 POS-Specific Components (New, Minimal)

- **Product grid:** A single component that receives `items` (and optional `categoryId`), renders cards (image, name, price), and calls `onSelectItem(item)` on tap. Use MUI `Card` or `Paper` + `Typography`; min touch target 44px.
- **Category strip:** Horizontal scroll list of chips or buttons; `categories` + `selectedId` + `onSelect(id)`; MUI `Chip` or `ButtonGroup`/toggle; height ≥44px.
- **Cart list:** Presentational list of lines (name, qty controls, disc %, price, edit/remove). Use `Box`/`Stack` and `IconButton` for +/- and remove; ensure 44px targets. Bind to RHF `items` array (same shape as `createOrderSchema`).
- **Order context block:** Table, customer, waiter (and order type if needed). Use `Field.Autocomplete` or `Field.Text` inside a small form or controlled inputs, synced with RHF or local state that feeds submit.

### 8.4 State and Form

- Use one React Hook Form instance for the whole order (branchId, orderTypeId, tableId, staffId, customerId, items, tax, discount, paymentModeId, payment amount, notes). Default values from existing `createOrderSchema` defaults.
- Cart lines = `items` in RHF; product tap = append to `items` with `itemId`, `quantity: 1`, `unitPrice` from item. Use `useFieldArray` for items; cart list component reads from `watch('items')` and calls `remove`/update for qty and remove.
- On Save: `handleSubmit` with `createOrderSchema`; call `createOrder` mutation with transformed body; on success invalidate orders list and show toast; optionally clear form or redirect.

### 8.5 Theming and Accessibility

- Use MUI theme spacing (e.g. 2, 3 = 16px, 24px) for consistency. Grand total and primary button: primary color; secondary actions: default or outlined.
- Contrast: Ensure text and icons meet WCAG AA on background (use theme `text.primary`, `text.secondary`).
- Focus: Visible focus ring on all interactive elements; tab order as in Section 4.
- Optional: Dark mode via existing theme; ensure sufficient contrast in both modes.

---

## 9. QA & Validation

### 9.1 UX Risks

- Too many order-type selectors (header + right pane): Mitigate by having one canonical control (e.g. header) and right pane only for sub-type (Dine In / Service) if needed.
- Small tap targets on edit/delete: Enforce 44px min; use IconButton with `sx={{ minWidth: 44, minHeight: 44 }}`.
- Double submit on Save: Disable button and set loading on submit; use ref guard in submit handler (as in existing OrderFormDialog).

### 9.2 Predicted Cashier Mistakes

- Tapping wrong product (adjacent card): Adequate spacing between cards; consider slight delay or confirm only for high-value items if product allows.
- Forgetting to set table: Optional required validation or prominent “Select table” when table is null and order type is Dine In.
- Entering wrong payment amount: Show cash back prominently; consider calculator-style keypad for payment amount on touch devices.

### 9.3 Stress-Test Scenarios

- **Rush hour:** Rapid add/qty/remove; ensure no dropped taps, no double-add; Save completes or shows clear error.
- **Slow network:** Loading states on initial load and on Save; retry and clear error message; no infinite spinner.
- **Offline:** Toast “You’re offline”; disable Save or show “Save when online”; do not lose cart (optional persist draft to localStorage).

### 9.4 Accessibility Checks

- Contrast: Grand total and primary button vs background ≥4.5:1 (or 3:1 for large text).
- Focus: Tab through header → categories → product grid → cart → payment → Save; focus visible.
- Keyboard: Enter on product card adds item; Enter on Save submits; Escape closes any open popover/dialog.
- Screen reader: Product cards and buttons have clear labels; cart count announced on add/remove if using live region.

---

## 10. Summary

- **Layout:** Two-pane (products left, cart + payment right); categories above products; single order-type source; cart as simple list, not DataGrid.
- **Interaction:** One tap add; inline qty; clear feedback; Save with loading and error handling via `getApiErrorMessage`.
- **Reuse:** Existing design system (Form, Field, CustomDialog, ConfirmDialog, schemas, APIs); new only: product grid, category strip, cart list, order context block.
- **Do not change:** Business logic, API contract, validation schemas, or removal of existing order list view; only layout, interaction, and visual clarity.

This spec is the single source of truth for building the POS order-entry screen at or under `/tenant/orders` with Next.js and MUI while keeping the app lightweight and cashier-first.
