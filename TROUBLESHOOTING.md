# Troubleshooting: Categories Not Loading

## Quick Fix Steps

### Step 1: Check Browser Console
1. Open your app in browser (`http://localhost:5173/products/create`)
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Look for messages like:
   - `Loading categories...`
   - `Firestore: Found X categories`
   - `Category doc: [id] [data]`
   - `Loaded categories: [array]`

**What to look for:**
- If you see `Firestore: Found 0 categories` → Your categories collection is empty or query failed
- If you see errors in red → Copy the error message
- If you see `Category doc:` logs → Check what fields each category has

---

### Step 2: Verify Your Categories in Firestore

Go to Firebase Console → Firestore Database → `categories` collection

**Check each category document:**

Each document should have:
- **Field**: `name` (type: string) - e.g., `"Embroidery"` or `"Jacquard"`
- **Field**: `active` (type: boolean) - Should be `true` (or can be missing, we'll default to true)

**Example correct structure:**
```
Document ID: embroidery
Fields:
  name: "Embroidery" (string)
  active: true (boolean)
```

**Common mistakes:**
- ❌ Missing `name` field
- ❌ `name` field is empty string
- ❌ `active` is set to `false` (will be filtered out)
- ❌ Document ID doesn't match what you expect

---

### Step 3: Check Firestore Security Rules

Go to Firebase Console → Firestore Database → **Rules** tab

**Your rules should allow authenticated users to read:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**If your rules are different:**
- Make sure authenticated users can read `categories` collection
- If you're in "test mode", it should work (but it's insecure, we'll fix later)

---

### Step 4: Verify You're Logged In

1. Check the top-right corner of your app
2. You should see your email address
3. If you don't see it, you're not logged in
4. Go to `/login` and sign in first

**Why this matters:**
- The Firestore query requires authentication
- If you're not logged in, the query will fail silently or show permission errors

---

### Step 5: Test the Query Manually

Open browser console (F12) and paste this:

```javascript
// First, make sure Firebase is loaded
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { db } from './src/lib/firebase';

// Then run:
const snapshot = await getDocs(collection(db, 'categories'));
console.log('Total docs:', snapshot.docs.length);
snapshot.docs.forEach(doc => {
  console.log('Doc ID:', doc.id, 'Data:', doc.data());
});
```

**What you should see:**
- Number of documents
- Each document's ID and data

---

## Common Issues & Solutions

### Issue 1: "No categories found" message
**Solution:**
- Check that `categories` collection exists in Firestore
- Check that at least one document has `name` field
- Check that `active` is `true` (or missing)

### Issue 2: Categories load but dropdown is empty
**Solution:**
- Check browser console for the actual category data
- Verify `name` field exists and is not empty
- Check that categories array has length > 0

### Issue 3: Permission denied errors
**Solution:**
- Make sure you're logged in
- Check Firestore security rules allow reads for authenticated users
- Verify your Firebase config in `.env.local` is correct

### Issue 4: Network errors
**Solution:**
- Check your internet connection
- Verify Firebase project is active in Firebase Console
- Check `.env.local` has correct `projectId`

---

## Quick Test: Create a Category Manually

If categories still don't load, create one manually to test:

1. Go to Firebase Console → Firestore Database
2. Click `categories` collection (or create it if it doesn't exist)
3. Click **"+ Add document"**
4. **Document ID**: `test-category` (or auto-generate)
5. **Add fields:**
   - Field name: `name`, Type: `string`, Value: `Test Category`
   - Field name: `active`, Type: `boolean`, Value: `true`
6. Click **Save**
7. Refresh your app (`/products/create`)
8. Check browser console - you should see `Firestore: Found 1 categories`

---

## Still Not Working?

Share these details:
1. What you see in browser console (copy all messages)
2. Screenshot of your `categories` collection in Firestore (showing document structure)
3. Screenshot of Firestore Rules tab
4. Whether you're logged in (do you see your email in top-right?)

