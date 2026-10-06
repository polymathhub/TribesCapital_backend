# Auth Experience and Social Login Update

Date: 2026-10-06

## Overview

This document captures the work completed to modernize the authentication experience and extend social sign-in support for the Tribes Capital app.

The update focused on two major areas:

1. A redesigned desktop authentication screen with a branded visual panel and responsive mobile fallback
2. Support for additional social login providers, including LinkedIn and X, alongside Google

---

## Completed UI Improvements

### Desktop authentication layout

The auth screen now uses a split-screen desktop composition:

- left or right visual panel for branded storytelling and energy-themed imagery
- form panel for the login or sign-up experience
- large, high-contrast presentation suitable for a premium fintech / climate / investment platform

The form layout remains centered and card-based on mobile devices, preserving the original mobile-first UX while improving the desktop experience.

### Hero visual panel

The visual panel was upgraded to include:

- multiple image slides instead of a single static background
- continuous transition between energy-themed visuals
- a dark overlay for readability and a more cinematic look
- animated typewriter-style headline motion for the hero text
- white accent styling for the energy labels and text

### Branding polish

The visual panel uses the Tribes Capital brand more cleanly:

- the Tribes Capital logo is emphasized in the hero area
- the smaller pill badge around the logo was removed for a cleaner premium look
- the text under the logo was reduced to energy-focused labels only, such as Clean Energy, Powering Change, and Global Impact
- the color treatment was adjusted toward white highlights to match the intended visual direction

---

## Social Authentication Updates

The auth flow was expanded to support additional third-party identity providers:

- Google
- LinkedIn
- X

This includes support for both the frontend redirect flow and backend OAuth handling.

### Frontend behavior

The auth pages include provider buttons for the external sign-in methods, with loading state handling and consistent styling.

### Backend behavior

The backend OAuth flow includes:

- callback routing for social providers
- state handling and redirect generation
- token exchange logic
- user profile retrieval
- account creation or sign-in logic for external users

---

## Files Updated

Key implementation areas include:

- `frontend/src/pages/AuthPage.jsx`
- `frontend/src/components/Logo.jsx`
- `src/modules/auth/auth.controller.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/social-auth.service.ts`

These files cover the visual redesign, provider button UI, redirect flow handling, and external authentication logic.

---

## Notes and Considerations

### Responsive behavior

The desktop design was intentionally separated from the mobile design so the original mobile login experience remains intact and familiar.

### Production configuration

The social login providers require valid environment configuration and callback URLs in a live deployment environment. This includes:

- Google OAuth credentials
- LinkedIn OAuth / OpenID configuration
- X developer app credentials
- correct frontend redirect URLs

---

## Outcome

The app now has a stronger brand-first desktop authentication experience plus expanded social sign-in capabilities that align with the Tribes Capital product direction and user experience goals.
