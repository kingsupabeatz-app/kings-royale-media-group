# King's Royale Media Group — website

Production website + streamable beat store for **King Supa Beatz** (Houston, TX).
Static HTML/CSS/JS — no build step. Auto-deploys to Netlify on every push to `main`.

## Pages
`index` · `beatstore` · `recording` · `services` · `memberships` · `book` · `contact`

## Updating the beat catalog
The store streams the live catalog (covers, 35s watermarked previews, prices). To
refresh it after adding/tagging beats, from the project root run:

```
python -m beatlabel store
```

That regenerates `beats-data.js`, `previews/`, `covers/`, and `sync.html` here.
Then commit + push — Netlify redeploys automatically.

## Integrations
- **Lead capture:** Netlify Forms (`free-beats` form) → Netlify dashboard → Forms.
- **Checkout:** Airbit (instant delivery) + Cash App / email direct deals.
- **Card payments:** paste Stripe Payment Links into `stripe-links.js`.
- **Booking:** Calendly (`book.html`).
