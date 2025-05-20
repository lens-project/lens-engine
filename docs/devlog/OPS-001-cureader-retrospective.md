# Overview

Cureader is a free iOS app for conscious, distraction-free content consumption via RSS. Built with React Native and Expo, and powered by Supabase and react-native-rss-parser, Cureader was designed as an open-source alternative to algorithmic social feeds. It’s designed to support users in developing a healthier, more intentional relationship with digital reading - without ads, without engagement metrics, and without manipulation.

This retrospective outlines the technical and design decisions behind the project, what went wrong, what worked, and where it stands now.

# Why Cureader Exists

I built Cureader because I wanted a mindful reading option for when you are spending time on your phone. Today’s content delivery pipelines (e.g. Social media, Reddit, etc) are optimized for engagement, not depth or intention. When browsing with popular options, I found myself constantly and consistently delivered content I didn’t consciously choose. I wanted to reverse that relationship. RSS offered decentralization and an open format with no engagement loops or algorithmic prioritization of content.

I wasn’t trying to compete with RSS power users, as they seem to stick to custom-built or open source RSS aggregators, or long-time users were tied to familiar systems. This app was for people who were curious about RSS but didn’t know where to look or couldn’t find an entry-level option. I focused on users who wanted something accessible and low-friction.

From the beginning, I felt that the content should be independent of the app. That separation between delivery mechanism and content was a principle of Cureader. The app is just a tool, not a gatekeeper.

# Architecture and Tech Stack

- **Frontend:** React Native with Expo (for initial scaffolding and App Store deployment)
- **Backend:** Supabase (PostgreSQL DB, authentication, storage)
- **Content Parsing:** Client-side using react-native-rss-parser
- **Data Handling:** Local state management with minimal context abstraction
- **Deployment Target:** iOS only, tested minimally on Android

# Development Notes

## 1. Initial Motivation and Setup

The first goal was straightforward: use React Native and make an RSS reader that felt good. Expo was my starting point. It helped ship fast, but became limiting early. The first roadblock I found was that neither React Query or Zustand cooperated with Expo, which exacerbated state management issues. Native dependencies and state management libraries required workarounds to implement, if they were able to at all. In retrospect, I should have ditched Expo earlier - but I kept it for its easy iOS publishing pipeline.

## 2. Backend Choices

Using Supabase was a win. Postgres familiarity, seamless auth, and generous free tier allowed me to skip infrastructure setup and stay focused on product work. I did most RSS parsing on-device as I found the process lightweight. It worked fine in the short term, however, I knew backend parsing and caching were inevitable needs if usage grew and I wanted more complicated backend queries. That became technical debt.

A better setup would be to defer parsing and storage server-side, allowing for more complex automation like tag generation, image scrubbing, and excerpt curation, reducing frontend complexity. That’s especially important if AI-based tagging or summary generation ever becomes part of the roadmap.

# Design Priorities

I focused on native iOS familiarity: clear layouts, legible type, muted tones, no clutter. The goal was to communicate authority through calmness and simplicity. The design heavily referenced Apple’s Human Interface Guidelines to reinforce a native feel.

Interaction patterns were intentionally simple. No new paradigms, no clever gestures. I used conventional navigational models and patterns because I could build them confidently, and because they matched user expectations. Simplicity was a principle, so these did not feel like a compromise.

I did not receive any feedback regarding confusion by the interface. That said, discoverability - especially of new RSS feed streams - remained an unresolved UX issue.

# Pain Points

## 1. State Management Between Feed Actions

Subscribing to feeds or saving articles required backend sync. This caused friction. I didn't architect a robust state layer early on, so states were often out of sync. I tried band-aid fixes, but the truth is I needed a global store and proper async handling - something like React Query or Zustand. At the time, I chose to ship rather than refactor. It worked, but barely.

## 2. Feed Discovery and Naming Conventions

Feed metadata was inconsistent. Title like: “newyorktimes.com | New York Times | RSS Feeds | Most Popular” made scanning a list of feeds painful. I hardcoded cleanup rules to normalize names, images, headlines, and excerpts. Every feed was different, there’s no RSS standard for naming or media metadata. The long trail of broken or janky feed formatting hurt UX.

I added the ability for sixers to suggest edits for feed names, thumbnails, and other data, which helped, but cultivating and tagging feeds manually quickly became unsustainable.

## 3. Manual Tagging and Content Curation

To improve discoverability and organization, I tagged every feed by hand so users could filter by topic. That task ballooned fast. ~70 feeds in, I knew this had to be automated. I did not implement language processing models or topic classification and I regretted it. This could be improved greatly with basic LLM APIs or open-source models.

## 4. Lack of Backend Content Processing

Parsing, transformations, and caching all occurred on the client side, which resulted in limited scalability. It was faster and more lightweight than expected, but I understood this model would hit a ceiling as Cureader scaled. Deferring parsing and metadata normalization to a server function or Supabase Edge function would have enabled better indexing, sorting, and topic tagging.

# Technical Wins

- RSS parsing on-device was efficient, fast, and rarely broke. React Native RSS Parser performed well. Required few changes and worked well on-device.
- Supabase handled authentication and storage with zero friction. PostgreSQL familiarity helped reduce cognitive overhead.
- The app respected user privacy: no ads, no behavioral tracking, no engagement farming.
- The whole architecture was lightweight, and memory usage on-device was never an issue.
- The search functionality added new resources and connected to existing ones. Functional and intuitive.

# Metrics Used

- Total signups
- Number of users who subscribed to a feed
- Number of saved articles

These rough metrics gave enough insight to gauge engagement while prioritizing privacy.

# UX Feedback and Observations

Users comfortable with RSS liked Cureader. Newer users didn’t understand why some feeds “didn’t work.” Explaining RSS was necessary, even if only once. The UX needed a stronger tutorial or maybe even an onboarding story that explains what RSS is and isn’t, and why Cureader is different.

Biggest user request: “Where do I find good feeds?” This is the core unsolved problem. Most people don’t know what to read until they’re told what’s good. There was no recommendation system, no trending topics, no collaborative filtering.

Next iteration must solve for:
- Better feed search and discovery
- Topic classification
- Feed suggestions based on reading history (with minimal to no behavioral surveillance)

# Lessons Learned

- RSS as a delivery mechanism still works. It holds up well as a fair and low-friction content protocol. It’s resilient, open, and respects user agency.
- AI-assisted classification and auto-tagging should be built in from the start. Feed curation at scale is not a manual task.
- Don’t underestimate state management. Build a predictable, testable system before designing UI.
- Don’t rely on RSS metadata being sane. You’ll need normalization, fallbacks, and user-facing editing options.
- Avoid Expo beyond MVP stage unless absolutely necessary. Eject early if needed.

# What I’d Do Differently

- Build my own feed parser server-side
- Use React Query for async state management and caching
- Integrate AI tools for tagging and recommendations
- Drop Expo, configure bare React Native for deployment
- Design the architecture assuming growth, not hardcoded shortcuts
- Add more analytics upfront (retention, engagement depth, time-in-app)
- Remove emphasis on thumbnails and photos, focus on scanability and headlines.

# Current Status

The iOS app is currently not live, but actively working to restore it on the Apple App Store. No Android version yet. I’m considering a rebuild for the next version - cleaner backend, better tooling, server-side parsing, and smarter discovery features. React Native’s ecosystem has matured since I started, and I now have the experience to build something more maintainable.

# Conclusion

Cureader was built to create a better relationship between people and information. It succeeded modestly in that goal, but revealed just how rough the RSS ecosystem is - and how much infrastructure is needed for usability at scale.. The future of this idea will depend on automation, smarter content discovery, and better architecture. But I believe that the core hypothesis still stands: that RSS can be a fair and mindful alternative to algorithmic feeds.