# Firestore Setup Guide

Before you can create products, you need to seed some initial data in Firestore.

## Step 1: Create Categories

Go to Firestore Database → Data → Start collection

**Collection ID**: `categories`

Create these documents:

### Document 1:
- **Document ID**: `embroidery` (or auto-generate)
- **Fields**:
  - `name` (string): `Embroidery`
  - `active` (boolean): `true`

### Document 2:
- **Document ID**: `jacquard` (or auto-generate)
- **Fields**:
  - `name` (string): `Jacquard`
  - `active` (boolean): `true`

---

## Step 2: Create Sub-categories

**Collection ID**: `subcategories`

### For Embroidery category:

#### Document 1:
- **Document ID**: Auto-generate or `embroidery-allover`
- **Fields**:
  - `name` (string): `Allover`
  - `categoryId` (string): `embroidery` (must match the category doc ID)
  - `active` (boolean): `true`

#### Document 2:
- **Document ID**: Auto-generate or `embroidery-daman`
- **Fields**:
  - `name` (string): `Daman`
  - `categoryId` (string): `embroidery`
  - `active` (boolean): `true`

#### Document 3:
- **Document ID**: Auto-generate or `embroidery-blouse`
- **Fields**:
  - `name` (string): `Blouse`
  - `categoryId` (string): `embroidery`
  - `active` (boolean): `true`

### For Jacquard category:

#### Document 1:
- **Document ID**: Auto-generate or `jacquard-allover`
- **Fields**:
  - `name` (string): `Allover`
  - `categoryId` (string): `jacquard`
  - `active` (boolean): `true`

#### Document 2:
- **Document ID**: Auto-generate or `jacquard-saree`
- **Fields**:
  - `name` (string): `Saree`
  - `categoryId` (string): `jacquard`
  - `active` (boolean): `true`

#### Document 3:
- **Document ID**: Auto-generate or `jacquard-dupatta`
- **Fields**:
  - `name` (string): `Dupatta`
  - `categoryId` (string): `jacquard`
  - `active` (boolean): `true`

---

## Step 3: Create Fabric Types

**Collection ID**: `fabricTypes`

### For "Allover" sub-category (Embroidery):

#### Document 1:
- **Document ID**: Auto-generate
- **Fields**:
  - `name` (string): `Satin 44"`
  - `subcategoryId` (string): `embroidery-allover` (or whatever ID you used)
  - `active` (boolean): `true`

#### Document 2:
- **Document ID**: Auto-generate
- **Fields**:
  - `name` (string): `Tissue 44"`
  - `subcategoryId` (string): `embroidery-allover`
  - `active` (boolean): `true`

#### Document 3:
- **Document ID**: Auto-generate
- **Fields**:
  - `name` (string): `Dola 44"`
  - `subcategoryId` (string): `embroidery-allover`
  - `active` (boolean): `true`

#### Document 4:
- **Document ID**: Auto-generate
- **Fields**:
  - `name` (string): `Ho 44"`
  - `subcategoryId` (string): `embroidery-allover`
  - `active` (boolean): `true`

### For "Dupatta" sub-category (Jacquard):

#### Document 1:
- **Document ID**: Auto-generate
- **Fields**:
  - `name` (string): `Satin 44"`
  - `subcategoryId` (string): `jacquard-dupatta` (or whatever ID you used)
  - `active` (boolean): `true`

#### Document 2:
- **Document ID**: Auto-generate
- **Fields**:
  - `name` (string): `Dola 44"`
  - `subcategoryId` (string): `jacquard-dupatta`
  - `active` (boolean): `true`

#### Document 3:
- **Document ID**: Auto-generate
- **Fields**:
  - `name` (string): `Dola 36"`
  - `subcategoryId` (string): `jacquard-dupatta`
  - `active` (boolean): `true`

#### Document 4:
- **Document ID**: Auto-generate
- **Fields**:
  - `name` (string): `Tissue 44"`
  - `subcategoryId` (string): `jacquard-dupatta`
  - `active` (boolean): `true`

---

## Important Notes

1. **Document IDs**: You can use auto-generated IDs or custom ones. Just make sure `categoryId` and `subcategoryId` references match the actual document IDs you created.

2. **Testing**: After creating at least one category, subcategory, and fabric type, try creating a product in the app. The dropdowns should populate dynamically.

3. **Admin UI**: In Step 10, we'll build an admin UI to manage these collections, so you won't need to do this manually forever.

---

## Quick Test Checklist

- [ ] Created at least 1 category (`embroidery` or `jacquard`)
- [ ] Created at least 1 subcategory linked to that category
- [ ] Created at least 1 fabric type linked to that subcategory
- [ ] Try creating a product in the app - dropdowns should work!

