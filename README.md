# LabelLens: Evidence-Based Food Intelligence Platform

> **Tagline:** Understand what's in your food. Know what the evidence says.

LabelLens helps users understand packaged food labels, investigate unfamiliar ingredients, compare products, and evaluate items against dietary preferences using actual product data and traceable sources—built on a strict **zero-paid-API architecture**.

---

## Key Features

1. **AI Label Scanner & In-Browser OCR:**
   - Client-side optical character recognition via `Tesseract.js` with high-contrast grayscale Canvas pre-processing.
   - Live barcode and product search powered by the public **Open Food Facts API**.
   - Structured parsing: extracts product title, ingredient lists (handling nested parentheses), declared allergens (`CONTAINS:`), and precautionary statements (`MAY CONTAIN:`).
   - Optical legibility validation and text review/correction step before final report generation.

2. **Ingredient Investigator (Signature Feature):**
   - Curated reference catalog for food additives, emulsifiers, stabilizers, preservatives, and allergens.
   - Distinct breakdown: **What the evidence establishes** vs. **What the evidence does NOT establish**.
   - Direct statutory citations to the Electronic Code of Federal Regulations (**eCFR Title 21**) and **FDA Food Guidance**.
   - Integration with **USDA FoodData Central (FDC)** for verified nutritional and laboratory composition data.

3. **Objective Product Comparison:**
   - Side-by-side comparison of 2 products without arbitrary or opaque "health scores".
   - Set difference detection: shared ingredients, ingredients unique to Product A, and unique to Product B.
   - Dual-baseline nutrition facts: per stated serving and standardized per 100g (essential when portions differ).
   - Declared allergen deltas and voluntary precautionary statement comparison.

4. **Personalized Food Profile:**
   - Major 9 U.S. FDA allergens (FALCPA & FASTER Act sesame declarations).
   - Lifestyle diets (Vegan ambiguous ingredient detection, strict Gluten-Free, No Synthetic Dyes, Palm Oil Free).
   - Custom user-defined ingredient rules with keyword matching.
   - Stored in browser `localStorage` with zero server tracking or telemetry.

5. **Five Audited Demonstration Scenarios:**
   - Clearly labeled sample records for instant testing:
     - *Barista Edition Oat Milk* (Dipotassium phosphate buffering salt, maltose Added Sugars note)
     - *Savory Plant-Based Burger* (Soy leghemoglobin, methylcellulose, allergen declaration)
     - *Ancient Grain & Honey Sesame Snack Bar* (FASTER Act sesame declaration & honey non-vegan alert)
     - *Sparkling Citrus Zero Calorie Beverage* (Aspartame PKU statutory warning, FD&C Yellow 5 dye)
     - *Artisan Sourdough Loaf* (Minimal 4-ingredient fermented grain with wheat gluten)

---

## Zero-Paid-API Architecture

LabelLens does not require or integrate any paid API. All functionality operates at $0 external API cost:

- **OCR:** In-browser `Tesseract.js` worker.
- **Product Records:** Open Food Facts public collaborative API (`world.openfoodfacts.org`).
- **Nutrition Verification:** USDA FoodData Central (`api.nal.usda.gov`) via standard public access (`DEMO_KEY` out-of-the-box, or optional free personal key).
- **Regulatory Guidance:** FDA Title 21 Code of Federal Regulations (`ecfr.gov`).

---

## Setup & Running Locally

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Contents of `.env`:
```ini
# Optional: Free personal USDA FoodData Central key (sign up at https://fdc.nal.usda.gov)
FDC_API_KEY="DEMO_KEY"

APP_URL="http://localhost:3000"
```

### 3. Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### 4. Running Automated Tests
```bash
npm test
```

### 5. Production Build
```bash
npm run build
npm run preview
```

---

## Food Safety & Allergy Notice

LabelLens aids in reading and researching package declarations, but **never certifies any food as safe** for individuals with allergies or celiac disease.
- Precautionary statements (e.g. "May contain peanuts") are voluntary under U.S. law; their absence does not prove an allergen-free facility.
- Food manufacturers reformulate products frequently; database records or photos may differ from the specific lot in your hands.
- In severe medical allergies, always verify directly with the manufacturer's quality assurance team and consult a board-certified medical professional.

---

## Attribution & Licenses

- **Open Food Facts:** Public collaborative database provided under the Open Database License (ODbL). Photos under Creative Commons.
- **USDA FoodData Central:** Agricultural Research Service, U.S. Department of Agriculture (Public Domain).
- **eCFR:** National Archives and Records Administration (NARA) & U.S. FDA (Public Domain).
