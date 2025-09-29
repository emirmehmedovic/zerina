{
  "design_direction_prompt": {
    "name": "Modern Glassmorphism with BentoGrid (Tailwind CSS)",
    "description": "Dizajn pravac koji stvara osjećaj dubine i modernosti koristeći Glassmorphism (Frosted Glass) efekte, implementiran kroz Tailwind CSS. Stil se oslanja na prozirne pozadine, pozadinski blur (backdrop-blur), suptilne ivice i meke sjene. Layout je organizovan po BentoGrid principu.",
    "core_principles": [
      "Slojevitost i dubina",
      "Sadržaj na prvom mjestu",
      "Vizualna hijerarhija kroz prozirnost i blur",
      "Velikodušan prazan prostor"
    ],
    "background_requirements": {
      "important": "Glassmorphism efekat je vidljiv jedino ako postoji vizualno interesantna pozadina iza 'staklenih' elemenata. Najbolje funkcioniše preko gradijenata, fotografija ili apstraktnih oblika.",
      "suggestion": "Koristiti suptilni, spori gradijent ili kvalitetnu pozadinsku sliku na 'body' elementu."
    },
    "tailwind_config": {
      "theme": {
        "extend": {
          "colors": {
            "light": {
              "background": "#F7F8FA", // Koristi se za osnovnu pozadinu ako nema slike
              "text": "#111827",
              "muted": "#374151",
              "accent": "#007AFF",
              "glass-border": "rgba(255, 255, 255, 0.3)"
            },
            "dark": {
              "background": "#0A0A0A",
              "text": "#E5E7EB",
              "muted": "#A1A1AA",
              "accent": "#0A84FF",
              "glass-border": "rgba(255, 255, 255, 0.1)"
            }
          },
          "borderRadius": {
            "card": "1rem",      // 16px
            "card-lg": "1.5rem" // 24px
          },
          "boxShadow": {
            "card": "0px 8px 32px rgba(0, 0, 0, 0.1)",
            "card-hover": "0px 12px 40px rgba(0, 0, 0, 0.15)"
          },
          "fontFamily": {
            "sans": ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "Noto Sans", "sans-serif"]
          },
          "spacing": {
            "card-p": "1.5rem",
            "card-p-lg": "2rem",
            "grid-gap": "1rem"
          },
          "backdropBlur": {
            "card": "16px"
          }
        }
      }
    },
    "implementation_examples": {
      "bento_grid_layout": {
        "description": "Isti princip kao prije: `grid` kontejner sa `gap-4`. Najbolje izgleda preko pozadine sa gradijentom ili slikom.",
        "html_class_example": "<div class='grid grid-cols-4 auto-rows-fr gap-4 p-4'>"
      },
      "card_component_glass": {
        "description": "Ovo je ključni element. Koristi prozirnu pozadinu, backdrop-blur, suptilnu ivicu i sjenu za stvaranje 'staklenog' efekta.",
        "light_mode_classes": "bg-white/30 text-light-text border border-light-glass-border rounded-card-lg p-card-p shadow-card backdrop-blur-card hover:shadow-card-hover hover:border-white/50 hover:-translate-y-1 transition-all duration-300",
        "dark_mode_classes": "dark:bg-zinc-800/30 dark:text-dark-text dark:border-dark-glass-border dark:hover:border-white/20"
      },
      "primary_button": {
        "description": "Primarno dugme je i dalje najbolje da bude **neprozirno (opaque)** zbog čitljivosti i pristupačnosti (Accessibility).",
        "html_class_example": "<button class='bg-light-accent text-white font-medium py-2 px-4 rounded-lg shadow-md hover:opacity-90 transition-all'>"
      },
      "secondary_button_glass": {
        "description": "Sekundarno ili 'ghost' dugme može koristiti glassmorphism efekat.",
        "html_class_example": "<button class='bg-white/20 backdrop-blur-sm border border-light-glass-border text-light-text font-medium py-2 px-4 rounded-lg hover:bg-white/30 transition-colors'>"
      },
      "typography": {
        "h1": "text-4xl font-bold text-light-text dark:text-dark-text",
        "p_muted": "text-light-muted dark:text-dark-muted"
      },
      "advanced_touch": {
        "description": "Za dodatni 'liquid glass' osjećaj, može se dodati suptilni, prozirni gradijent na ivicu kartice koristeći pseudo-elemente (`::before`, `::after`) ili `background-clip: padding-box, border-box`.",
        "note": "Ovo je naprednija tehnika i nije direktno podržana osnovnim Tailwind klasama, zahtijeva custom CSS ili Tailwind plugin."
      }
    }
  }
}