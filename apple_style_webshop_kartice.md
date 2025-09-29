# Apple‑inspirisan Web‑Shop -- Uputstvo za Kartice

## 1️⃣ Osnovni stil kartice

-   **Corner radius:**
    -   Glavni standard: **14--16 px**\
    -   Hero kartice (istaknuti proizvodi): do **20 px**\
    -   Male elemente/tagove: **8--12 px**
-   **Padding unutra:** 16--20 px
-   **Razmak između kartica:** 16 px (mobile), 24 px (desktop grid)

## 2️⃣ Boje i pozadina

-   **Svijetli mod:**
    -   Pozadina: `rgba(255,255,255,0.72)`\
    -   Border: `1px solid rgba(0,0,0,0.04)`
-   **Tamni mod:**
    -   Pozadina: `rgba(18,18,18,0.6)`\
    -   Border: `1px solid rgba(255,255,255,0.04)`
-   **Blur / "glass" efekat (opciono):**
    -   CSS: `backdrop-filter: blur(8px)`\
    -   Figma: *Background Blur* 8--12

## 3️⃣ Shadow (dubina)

Apple preferira **meke, široke, nisko-opačne sjene**:

  -----------------------------------------------------------------------
  Tip kartice         Box-shadow (primjer)
  ------------------- ---------------------------------------------------
  Standard (listing)  `0 6px 18px rgba(0,0,0,0.08)`

  Istaknuta / hover   `0 12px 40px rgba(0,0,0,0.10)`
  -----------------------------------------------------------------------

-   U dark modu: zadrži **opacity ≤0.28**, ali povećaš radius (šira
    sjena).
-   Nikad oštre sjene (bez `0 0 0` tvrdih linija).

## 4️⃣ Tipografija

-   **Font:** San Francisco (SF Pro / SF Text / SF Display)\
-   Pravilo:
    -   Naslovi proizvoda ≥20 px → **SF Display**\
    -   Opis i cijena \<20 px → **SF Text**

## 5️⃣ Animacije i interakcije

Suptilno i brzo (Apple feel):

``` css
.card {
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(0,0,0,0.12);
}
.card:active {
  transform: scale(0.98);
}
```

-   **Hover:** lagano podizanje i blagi shadow boost\
-   **Click:** kratko smanjenje skale (0.98) za „tap feedback"

## ✅ Brza checklist

-   [ ] **Corner radius 14--16 px** (ili 20 px za hero kartice)
-   [ ] System light/dark pozadine i borderi
-   [ ] Mekani shadow (0.08--0.12 opacity)
-   [ ] SF fontovi s pravilnim hijerarhijama
-   [ ] Hover podizanje + tap scale animacija
-   [ ] Test u dark modu i high contrast

------------------------------------------------------------------------

💡 **Savjet za Figma / CSS**\
Napravite **komponentu kartice** sa promjenjivim radiusom (8/14/20 px)
kako biste lako skalirali od malih previewa do velikih hero kartica.
