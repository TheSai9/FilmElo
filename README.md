# CineRank Elo

**CineRank Elo** is a visual movie ranking application that transforms your Letterboxd history into a definitive hierarchy using the **Elo rating system**. 

Built with a bold **Bauhaus Design System**, it rejects generic web aesthetics in favor of constructivist geometry, primary colors, and functional art.

![CineRank Hero Image](https://github.com/user-attachments/assets/2ba48387-703e-4d25-8fc9-fc1e979bb2a9)


## ✨ Key Features

### 1. 📊 Intelligent Data Import
-   **Letterboxd Support**: Drag & drop your `watched.csv` and `ratings.csv`.
-   **Strategy Selection**:
    -   **Tabula Rasa**: Start all movies at 1200 Elo.
    -   **Star Power**: Initialize Elo based on your existing 0.5-5.0 star ratings (giving favorites a head start).
-   **Smart Merging**: Deduplicates entries and prioritizes rated content.

### 2. ⚔️ The Voting Arena (Now Faster!)
Compare films in a 1v1 "Face Off" using a Tinder-style decision engine.
-   **Animated Rank Slides**: Watch scores update in real-time with smooth, high-speed animations. Winners glow green, losers slide away.
-   **Elo Algorithm**: Uses K-Factor 32 for dynamic rating adjustments.
-   **Generative Art**: If posters fail to load, the app generates unique geometric Bauhaus compositions deterministically based on the movie ID.
-   **TMDB Integration**: Automatically fetches high-res movie posters via The Movie Database API.
-   **Undo Capability**: Made a mistake? Press `Backspace` or the Undo button to revert the last duel.

### 3. ♟️ Advanced Analytics & Meta Insights
Go beyond simple rankings with chess-style performance metrics.
-   **Deep Stats**: Click any movie to see Peak Elo, Lowest Elo, and Rating Trajectory graphs.
-   **Clutch Factor**: Measures how often a movie wins in close matchups (within 50 Elo).
-   **Volatility Score**: Identifies "controversial" films with wild rating swings.
-   **Meta Leaderboards**:
    -   **The Giant Slayer**: Single biggest upset victory.
    -   **The Unstoppable**: Longest winning streaks.
    -   **The Divider**: Most polarizing films.

### 4. 🧠 AI Vibe Check
Powered by **Google Gemini 2.5 Flash**:
-   Stuck on a tough choice? Click "Ask AI".
-   Get a generated "Vibe Check" comparing the two films.
-   Receives detailed analysis on strengths and a final recommendation.

### 5. 🏆 Live Leaderboard
-   **Real-time Ranking**: Watch movies climb or fall as you vote.
-   **Sorting & Filtering**: Sort by Elo, Name, Year, or Match Count. Search instantly.
-   **Export**: Download your re-ranked list as a CSV.
-   **Visuals**: Rank badges and thumbnails in a high-contrast data grid.

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
-   (Optional) TMDB API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/cinerank-elo.git
    cd cinerank-elo
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root:
    ```env
    # Optional: For AI Features
    API_KEY=your_gemini_api_key
    
    # Optional: For Posters (Defaults provided for demo)
    TMDB_API_KEY=your_tmdb_key
    TMDB_READ_TOKEN=your_tmdb_read_token
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


## 🛠️ Tech Stack

-   **Frontend**: React 19, TypeScript
-   **Styling**: Tailwind CSS (Custom Config)
-   **Icons**: Lucide React
-   **AI**: Google GenAI SDK (`@google/genai`)
-   **Data**: LocalStorage persistence
