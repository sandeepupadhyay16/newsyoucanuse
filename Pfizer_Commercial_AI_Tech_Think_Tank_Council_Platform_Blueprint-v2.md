# Blueprint & Technical Specifications: Pfizer Commercial AI Tech Think Tank Council Platform

## 1. Document Purpose & System Overview
This document outlines the operational and technical specifications for the **AI Tech Think Tank Council Platform**. Sponsored by the Chief Marketing Officer (CMO) organization, this enterprise web ecosystem acts as a specialized, intelligence-driven engine designed to **harvest, curate, and schedule emerging AI ideas** for future Tech Council sessions. 

Rather than serving as a standard life sciences project management application, the platform's primary purpose is commercial ideation governance: transforming raw signals from internal conversations, global commercial news sources, and curated newsletters into structured, prioritized meeting agendas. By deploying an AI-first orchestration layer, the council can proactively track horizon-three technologies, evaluate their disruptive commercial potential, and match them with relevant experts to present at upcoming councils.

---

## 2. Core Features (The 6-Pillar Framework)

### Pillar 1: Homepage & Landing Page
Serves as the internal front door for Pfizer's commercial and technical teams, defining the council's vision, active strategic focus, and standard operating remit.
* **Vision & Governance Mandate:** Publicly outlines the framework for evaluating frontier AI capabilities to ensure topics align with commercial excellence and corporate responsibility.
* **Council Structure:** Displays the core steering committee leaders and upcoming council session dates.

### Pillar 2: The Curated Idea Backlog
A dynamic repository showing all harvested AI concepts currently under evaluation for future meeting agendas. Clicking any concept opens a structured **Idea Dossier**:
* **Problem/Disruption Statement:** Defines how the technology answers a commercial bottleneck or shifts current capabilities.
* **Source Attribution:** Tracks whether the idea originated from an internal meeting transcript, a global news feed, or a specific AI newsletter.
* **Relevancy Metrics:** Displays the automated system grades across the core think tank evaluation vectors.
* **Target Audience Focus:** Classifies the concept across commercial functional domains (e.g., Omnichannel Intelligence, Campaign Measurement Intelligence, Patient Identification) and broad therapeutic units (e.g., Oncology, Vaccines, Rare Diseases).

### Pillar 3: Agenda Builder & Session Scheduler
An interactive planning interface used by council owners to transition curated ideas into finalized meeting structures.
* **Kanban Workflow:** Drag-and-drop ideas through pipeline stages (*Harvested, Curated/Approved, Scheduled, Discussed*).
* **Agenda Construction:** Allows admins to select multiple approved ideas, allocate time blocks, assign guest speakers from the Expert Panel, and generate an executable session agenda file.

### Pillar 4: Internal Ingestion & Discovery Hub
A backend processing module focused on mining ideas from internal communications.
* **Transcript Ingestion:** Accepts direct text or file uploads of previous council transcripts, workshop summaries, or strategy briefs.
* **LLM Extraction Engine:** An underlying model scans the text file, isolates conversational contexts where a potential use case or novel approach was raised, and extracts them into structured records directly inside the Curated Idea Backlog.

### Pillar 5: External Horizon Scanning & Ingestion Feed
An automated, continuous scanning engine designed to source disruptive concepts from the broader market.
* **Ingestion Pipelines:** Regularly pulls unstructured content via secure RSS, API, or web scraping from global commercial news portals and curated industry AI newsletter feeds.
* **Algorithmic Relevancy Scorecard:** The LLM evaluates every incoming external story and assigns a calculated **Relevancy Score** from $0.0$ to $100.0$ using a specialized multi-vector formula:

$$	ext{Relevancy Score} = w_1 W_k + w_2 W_d + w_3 C$$

*Where:*
* $W_k$ = **Impact on Future Ways of Working** (Changes to commercial operations, field force execution, or marketing strategies)
* $W_d$ = **Impact on Ways of Development** (Shifts in data engineering, commercial software synthesis, code generation, or ML implementation)
* $C$ = **Commercial Feasibility & Scalability** (Direct applicability to market reach, customer engagement models, brand optimization, or operational business value)
* $w_n$ = Vector weights predefined by Council Leadership

### Pillar 6: Expert Panel & Invitation Directory
A directory used to identify and track thought leaders, researchers, and external vendors to be invited to future Tech Council meetings.
* **Expert Mapping:** Profiles contain standard capability tags, operational availability status, and semantic links back to specific backlog ideas they specialize in.
* **Invitation Workflow:** Integrated scheduling buttons allow council owners to easily contact, track response status, and block out speaking time slots during active agenda building.

---

## 3. Detailed LLM Features & Integrations

The platform relies on an enterprise-secure, isolated Large Language Model (LLM) to drive its core curation workflows:

```
+---------------------------------------------------------------------------------+
|                              Core LLM Engine Layers                             |
+---------------------------------------------------------------------------------+
| [Transcript Extractor] --> Parses raw meeting data to isolate hidden ideas     |
| [External Horizon Scan] --> Evaluates web/news feeds for market & tech updates  |
| [Predictive Evaluator] --> Calculates Relevancy Scores via multi-vector math   |
| [RAG Knowledge Base]   --> Allows natural language Q&A across the entire backlog |
+---------------------------------------------------------------------------------+
```

### 3.1. Internal Transcript Idea Harvesting
When raw conversational transcripts are submitted to the Internal Ingestion module, the LLM processes the unstructured logs. It filters out pleasantries or procedural discussions and targets conceptual ideas. The model maps out a concise title, problem description, and functional area mapping, creating a clean record for the council to review without requiring human manual sorting.

### 3.2. External Feed Parsing & Auto-Classification
The LLM continuously monitors inbound content from news sources and AI newsletters. It strips out marketing clutter and translates complex technological concepts into crisp summaries focused strictly on their commercial impact. The model classifies the story based on whether it represents a shift in commercial *ways of working*, operational *ways of development*, or generalized commercial scalability.

### 3.3. Conversational Backlog Q&A Layer
Utilizing a secure Retrieval-Augmented Generation (RAG) architecture, council owners can query the total pool of ideas, external feeds, and expert notes using plain language:
* *"Summarize the top three newsletter items harvested this week that impact our ways of working in the Omnichannel space."*
* *"Find an external expert in our directory who specializes in generative text models that could present on the campaign measurement idea we extracted from last week's meeting transcript."*

---

## 4. Integration Specifications

The platform establishes continuous endpoints to ensure constant access to external intelligence and internal tools:

| Target System | Integration Protocol | Data Flow Frequency | Core Data Elements Exchanged |
| :--- | :--- | :--- | :--- |
| **News Portals & AI Newsletters** | RSS Feeds / Web REST APIs | Daily Automated Poll | Raw article text, metadata, publish dates, and author properties. |
| **Internal Meeting/Audio Tools** | REST API File Transfer | Ad-hoc (Post-Meeting) | Session audio transcripts, speaker logs, and raw text workshop notes. |
| **Microsoft Outlook Calendar** | Microsoft Graph API | On-Demand | Free/busy calendar status lookups for council members and automated speaker invitation delivery. |
| **Enterprise Identity Management** | OAuth2 / SAML Single Sign-On | Instant (Session-based) | Verification of Pfizer credentials and population of role-based administration privileges. |

---

## 5. Security & Compliance Requirements
* **Data Tenancy:** All ingested transcript data, meeting summaries, and internal strategies are processed within a dedicated enterprise private infrastructure partition to guarantee corporate confidentiality.
* **Audit Trails:** Comprehensive log streaming tracking every state change, scorecard adjustment, score override, or user access request to meet strict legal and corporate compliance frameworks.
