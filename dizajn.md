{
  "design_direction_prompt": {
    "name": "Modern Minimalist with Soft UI & BentoGrid (Tailwind CSS)",
    "description": "Dizajn pravac fokusiran na čistoću i strukturu, implementiran kroz Tailwind CSS. Koristi minimalističku paletu, zaobljene uglove i meke sjene. Layout je organizovan po BentoGrid principu, a stil izričito izbjegava staklene efekte, jake gradijente i prozirnost.",
    "core_principles": [
      "Jasnoća ispred dekoracije",
      "Sadržaj na prvom mjestu",
      "Velikodušan prazan prostor (whitespace)",
      "Konzistentnost i hijerarhija"
    ],
    "tailwind_config": {
      "theme": {
        "extend": {
          "colors": {
            "light": {
              "background": "#F7F8FA",
              "card": "#FFFFFF",
              "text": "#111827",
              "muted": "#6B7280",
              "border": "#E5E7EB",
              "accent": "#007AFF"
            },
            "dark": {
              "background": "#0A0A0A",
              "card": "#1A1A1A",
              "text": "#E5E7EB",
              "muted": "#9CA3AF",
              "border": "#27272A",
              "accent": "#0A84FF"
            }
          },
          "borderRadius": {
            "card": "1rem",      // 16px
            "card-lg": "1.5rem" // 24px
          },
          "boxShadow": {
            "card": "0px 8px 24px rgba(0, 0, 0, 0.05)",
            "card-hover": "0px 12px 32px rgba(0, 0, 0, 0.08)"
          },
          "fontFamily": {
            "sans": ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", "sans-serif"]
          },
          "spacing": {
            "card-p": "1.5rem",     // 24px
            "card-p-lg": "2rem", // 32px
            "grid-gap": "1rem"    // 16px
          }
        }
      }
    },
    "implementation_examples": {
      "bento_grid_layout": {
        "description": "Koristiti `grid` i `gap-4` (ili `gap-grid-gap` ako je definisano) za kontejner. Pojedinačne kartice mogu zauzimati više kolona/redova sa `col-span-2` ili `row-span-2`.",
        "html_class_example": "<div class='grid grid-cols-4 auto-rows-fr gap-4 p-4'>"
      },
      "card_component": {
        "description": "Osnovna kartica koja koristi definisane Tailwind tokene. Puna boja, zaobljeni uglovi i suptilna ivica. Tranzicija za gladak hover efekat.",
        "light_mode_classes": "bg-light-card text-light-text border border-light-border rounded-card p-card-p shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300",
        "dark_mode_classes": "dark:bg-dark-card dark:text-dark-text dark:border-dark-border"
      },
      "primary_button": {
        "description": "Dugme koje koristi akcentnu boju.",
        "html_class_example": "<button class='bg-light-accent text-white font-medium py-2 px-4 rounded-lg hover:opacity-90 transition-opacity'>"
      },
      "typography": {
        "h1": "text-4xl font-bold text-light-text dark:text-dark-text",
        "p_muted": "text-light-muted dark:text-dark-muted"
      },
      "iconography": {
        "description": "Koristiti SVG ikone (npr. iz Heroicons biblioteke) sa `stroke-1.5` ili `stroke-2`.",
        "svg_class_example": "<svg class='w-6 h-6 text-light-muted' stroke-width='1.5' ...>"
      }
    }
  }
}
