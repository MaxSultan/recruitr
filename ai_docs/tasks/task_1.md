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
Key Architectural Patterns: Express application, MVC, SOLID principles
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


Approach

Goal:
Elo and glicko ratings 

1. create a new set of ranking data
Scrape data from track wrestling seasons
For each event, parse and construct a set of matches
for each match, 
- calculate the new elo and glicko ranks, 
- update the data point on the athlete
- create a RankingMatch model listing the winner, looser, and their old and new elo and glicko ratings
- 


i need to access a browser in order to get the data im interested in. create an API route that allows me to spin up a browser and performs a set of interactions and then parses data into matches.

the url we should navigate to is https://www.trackwrestling.com/seasons/index.jsp after authenticating. 

from there we want to look at the a tags to select the one with the target season and target level. A season will be a link with the text 2025-26 High School Boys. If the desired link isnt visible, we may need to click the a tag with the class icon-arrow_r dgNext. 

Clicking a seasons a tag will open a modal. Inside the modal we need to select and option from the select with id=gbId

we want to select a value of 50 for utah (but in the future we want to be able to select other seasons) 
then click the input with type=button and value="Login" 

increase the pagination on this page by finding an input of type="text" and maxlength="5" and increase it to 10000. then push the enter button.

on the next page there is a table that has a class="dataGrid". find all tr with the a class="dataGridRow". find the 3 td in that row, save all the links. (or we could call openEvent(x) where x is 0 - number of events)

inside the div with id="teamsFrame" get all links, for each link, visit the link, find the table with class="dataGrid". For each tr with a class="dataGridRow" find the 2nd child td. inside that td is the weight class. find the 3rd td. inside the 3rd td is a div with a span child. inside that is links and text that are in this format 165
Aubrey Hastings (Cumberland HS) over Jillian Boncore (Alvirne) (Fall 3:47)
Jillian Boncore (Alvirne) over Caeleigh White (Vergennes) (Dec 4-2)
Cons. Semis - Logan McNally (Wasatch) over Adam Mitchell (Cedar Valley) (MD 9-1)
Cons. Round 2 - Uriel Castillo (Cedar Valley) over Joaquin Hernandez (Hunter) (TF 21-3 5:02)

Aubrey Hastings and Jillian Boncore could be the innerText of a link or if there is no link it could be text

we need to parse that string into 
tournamentRound - winnerFirstName winnerLastName (winnerHighSchool) "over" loserFirstName loserLastName (loserHighSchool) (matchResult score if dec/major or time if fall technical fall)

tournamentRound may not exist


this will give us duplicate matches, since we view results for each team, the same match will appear 2 times in each set of results. dedupe the matches, so we only do the eloc and glicko calculations and MatchRank creation for one match and not the duplicate match


updates: 
Chronological order for matches
1. get the date of the events
2. for tournaments get the correct order of matches by looking at the round

run the script to get matches as a background job on a cron once a week
one every one, caluclate where we left off and start from there.

make the audit trail a separate page

complete separation between season aggregate data and individual matches 

