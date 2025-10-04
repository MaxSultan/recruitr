AI Task Planning Template - Starter Framework
About This Template: This is a systematic framework for planning and executing technical projects with AI assistance. Use this structure to break down complex features, improvements, or fixes into manageable, trackable tasks that AI agents can execute effectively.

1. Task Overview
Task Title
Web Scraping for a high school wrestling ranking system

Goal Statement
Goal: I want to be able to access new high school wrestling data as it arrives on trackwrestling and create a ranking system that will ultimately show me who is the best wrestler and dive me an advantage as a college wrestling coach looking to recruit the best talent, and also hidden gems

2. Project Analysis & Current State
Technology & Architecture
Frameworks & Versions: ExpressJS and Embedded Javascript Templates
Language: Node/Javascript, HTML, CSS
Database & ORM: PostgreSQL with Sequilize
UI & Styling: Embedded Javascript Templates
Authentication: Currently no authentication system
Key Architectural Patterns: Express application, MVC
Current State
We have a small organized Express app with several routes. Currently we scrape trackwrestling and pull results data from state tournaments. this gives us a limited dataset and make us very dependent on high school coaches entering the correct record for athletes at the state tournament. We want something more accurate. We want a way to view head to head results for athletes and rank them. 
we have 2 ranking systems: 
- `utilities/perform-elo-calculation.js` contains a util for performing elo calculations
- `utilities/perform-glicko-calculation.js` contains a util for performing glicko calculations

We want to rank athletes using both and show 2 new UI pages
1) A new table that shows athletes, their wins and losses, win percentage, glicko scores, elo, the table should be paginated, and allow sorting and filtering on mutiple criteria
2) an individual athlete view that shows head to head matches and more statistics 

3. Context & Problem Definition
Problem Statement
Its a lot of work to aggregate all the data necessary for recruiting. On top of aggregating data, you have to watch film, vet athletes for culture fit and grades, and schedule visits

Success Criteria
 [Specific, measurable outcome 1]
 [Specific, measurable outcome 2]
 [Specific, measurable outcome 3]
4. Development Mode Context
Development Mode Context
🚨 Project Stage: this is an early stage development project
Breaking Changes: Breaking changes are acceptable
Data Handling: leave my database alone. migrations are fine, but dont drop tables
User Base: currently no one, no users, early stage project
Priority: stability and speed are 50/50
5. Technical Requirements
Functional Requirements
TODO: Define what users can do and what the system will automatically handle

Example format: "User can [specific action]"
Example format: "System automatically [specific behavior]"
Example format: "When [condition] occurs, then [system response]"
Non-Functional Requirements
Performance: TODO: Define response time and load handling requirements
Security: TODO: Specify authentication and data protection needs
Usability: TODO: Set user experience and accessibility standards
Responsive Design: TODO: Define mobile, tablet, desktop support requirements
Theme Support: TODO: Specify light/dark mode and brand requirements
Technical Constraints
[Must use existing system X]
[Cannot modify database table Y]
[Must maintain compatibility with feature Z]
6. Data & Database Changes
Database Schema Changes
TODO: Add your SQL schema changes here (new tables, columns, indexes, etc.)

Data Model Updates
TODO: Define your TypeScript types, interfaces, and data structure changes

Data Migration Plan
TODO: Plan your data migration steps (backup, apply changes, transform data, validate)

7. API & Backend Changes
Data Access Pattern Rules
TODO: Define where different types of code should go in your project (mutations, queries, API routes)

Server Actions
TODO: List your create, update, delete operations and what they do

Database Queries
TODO: Define your data fetching approach (direct queries vs separate functions)

8. Frontend Changes
New Components
TODO: List the new components you need to create and their purpose

Page Updates
TODO: List the pages that need changes and what modifications are required

State Management
TODO: Define your state management approach and data flow strategy

9. Implementation Plan
TODO: Break your work into phases with specific tasks and file paths

10. Task Completion Tracking
Real-Time Progress Tracking
TODO: Define how you want the AI to track and report progress on tasks

11. File Structure & Organization
TODO: Plan what new files to create and existing files to modify

12. AI Agent Instructions
Implementation Workflow
🎯 MANDATORY PROCESS: TODO:

Communication Preferences
TODO: How do you want the agent to communicate with you

Code Quality Standards
TODO: Any specific code standards

13. Second-Order Impact Analysis
Impact Assessment
TODO: Tell the AI what sections of code you're worried about breaking, performance concerns, and user workflow impacts