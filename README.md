
# FilmElo

**FilmElo** is a visual movie ranking application that transforms your Letterboxd history into a definitive hierarchy using the **Elo rating system**. 

_Built with a bold geometric design system, it uses primary colors and functional art to focus on what matters: the data._

<img width="905" height="366" alt="image" src="https://github.com/user-attachments/assets/078170da-5e80-46b4-ba49-004f1751e268" />



## ✨ Key Features

### 1. 📊 Intelligent Data Import
-   **Letterboxd Support**: Drag & drop your `watched.csv` and `ratings.csv`.
-   **Strategy Selection**:
    -   **Tabula Rasa**: Start all movies at 1200 Elo.
    -   **Star Power**: Initialize Elo based on your existing 0.5-5.0 star ratings (giving favorites a head start).
-   **Smart Merging**: Deduplicates entries and prioritizes rated content.

### 2. ⚔️ The Voting Arena
Compare films in a 1v1 "Face Off" using a Tinder-style decision engine.
-   **Animated Rank Slides**: Watch scores update in real-time with smooth animations.
-   **Elo Algorithm**: Uses dynamic K-Factor for adaptive rating adjustments.
-   **Custom Art**: If posters fail to load, the app generates unique geometric compositions based on the movie ID.
-   **TMDB Integration**: Automatically fetches high-res movie posters via The Movie Database API.
-   **Undo Capability**: Made a mistake? Press `Backspace` to revert.

### 3. 🧠 Neural Projection (Simulation)
Don't want to vote manually forever? Let the AI finish the job.
-   **Monte Carlo Simulation**: The engine simulates hundreds of future matchup rounds based on your current hierarchy.
-   **Live Visualizations**: Watch the "Spaghetti Plot" of Elo trajectories evolve in real-time.
-   **AI Taste Profile**: Once the simulation stabilizes, Google Gemini generates a psychographic profile of your taste, including a "Persona Name" and key themes.

### 4. ♟️ Advanced Analytics & Meta Insights
-   **Deep Stats**: Click any movie to see Peak Elo, Lowest Elo, and Rating Trajectory graphs.
-   **Clutch Factor**: Measures how often a movie wins in close matchups.
-   **Volatility Score**: Identifies "controversial" films with wild rating swings.
-   **Meta Leaderboards**:
    -   **The Giant Slayer**: Single biggest upset victory.
    -   **The Unstoppable**: Longest winning streaks.
    -   **The Divider**: Most polarizing films.

### 5. 🏆 Live Leaderboard
-   **Real-time Ranking**: Watch movies climb or fall as you vote.
-   **Sorting & Filtering**: Sort by Elo, Name, Year, or Match Count. Search instantly.
-   **Export**: Download your re-ranked list as a CSV.

## ⌨️ Keyboard Shortcuts

Speed up your ranking process with keyboard controls:

| Key | Action |
| :--- | :--- |
| **← Left Arrow** | Vote for Left Movie |
| **→ Right Arrow** | Vote for Right Movie |
| **Space** / **↓ Down** | Skip Pair |
| **Backspace** | Undo Last Vote |

## 🚀 Getting Started

### Prerequisites
-   Node.js installed
-   A Letterboxd account (to export your data)
-   (Optional) Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/filmelo.git
    cd filmelo
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root:
    ```env
    API_KEY=your_gemini_api_key
    ```

4.  **Run the App**
    ```bash
    npm start
    ```

## 📸 Screenshots

### File Upload & Configuration
_Choose your starting strategy with a tactile, geometric interface._
![Upload Screen](https://github.com/user-attachments/assets/11c287b7-752f-48a7-a50f-df84ad453681)

### 1v1 Arena
_High-contrast voting cards with generated art and fetched posters._

![Voting Arena](https://github.com/user-attachments/assets/9d9a7d4e-8968-47a3-8311-f2ab79c2048a)

### Advanced Stats Modal
_Deep dive into a film's performance history._

<img width="1019" height="813" alt="image" src="https://github.com/user-attachments/assets/1a6544cf-04f7-40fa-a1dc-1df92ed8439e" />

### Meta Insights Leaderboard
_Discover trends and outliers._


<img width="1018" height="720" alt="image" src="https://github.com/user-attachments/assets/55a813e4-47ab-4b37-8df7-410aa2e64ef9" />
<br><br>

<img width="1009" height="721" alt="image" src="https://github.com/user-attachments/assets/ead27797-3008-40e2-8ff4-3eadcb76cb9a" />

### AI Neural Projection
_Simulates hundreds of matchups based on your past votes and rankings._
<img width="1378" height="655" alt="image" src="https://github.com/user-attachments/assets/0f2ffc9d-48e1-4fea-b53a-a6dc6cea68c1" />


## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript
-   **Styling**: Tailwind CSS
-   **Icons**: Lucide React
-   **AI**: Google GenAI SDK (`@google/genai`)
-   **Data**: LocalStorage persistence
