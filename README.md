# Drifter Good Dog Club — MVP

A lightweight Drifter Christchurch-branded prototype for hosting calm local-dog social sessions for travellers.

## What the prototype demonstrates

- Guest landing page and RSVP flow
- Local dog-owner application flow
- Dream Host approval/dashboard workflow
- Session check-in concept and safety checklist
- Participation / guest-experience insight layer
- Founding-venue subscription screen
- Browser persistence via localStorage for demo submissions
- `/health` endpoint and Railway-compatible `npm start`

## Positioning

The product is framed as a social wellbeing / hosted dog-visit experience, **not a clinical animal-therapy service**.

Before a live venue rollout, Drifter management should confirm its own animal-entry, hygiene, allergy, insurance, incident and handler requirements.

## Run locally

```bash
npm start
```

Open `http://localhost:3000`.

## Railway

This repository is deployment-ready for Railway:

- runtime: Node 20+
- start command: `npm start`
- port: reads `PORT`
- health: `/health`

## MVP → live version

1. Replace localStorage with Postgres.
2. Add venue/admin login.
3. Add persistent dog, handler, session, RSVP and feedback records.
4. Add email confirmations / reminders.
5. Add recurring Stripe checkout and subscription status.
6. Add venue-configurable waivers, safety criteria and owner rewards.
7. Add multi-venue white-labelling if Drifter wants to extend it to other properties.

## Commercial test

- Free private demo
- Founding venue: NZ$89/month

Price is a validation hypothesis and can be changed before live checkout is connected.
