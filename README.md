# 🎯 Multiplayer Bingo Web App

🌐 **Live Website:**  
https://bingo-era.vercel.app/

A real-time **Multiplayer Bingo game** built with modern web technologies.  
Players can create or join game rooms, arrange their Bingo boards, and compete live with others.  
The game synchronizes all moves instantly using **Socket.io**, providing a smooth multiplayer experience on both **mobile and desktop**.

---

# 🚀 Features

✔ Real-time multiplayer gameplay  
✔ Create or join rooms using a **6-digit code**  
✔ Player profile with **name and avatar**  
✔ Interactive **5×5 Bingo board** (numbers 1–25)  
✔ Players can arrange numbers before the game starts  
✔ Game begins only when **all players are ready**  
✔ Real-time number selection using **Socket.io**  
✔ Visual feedback:
- 🔴 Called numbers turn **Red**
- 🟢 Completed lines turn **Green**

✔ B I N G O progress tracker  
✔ Winner announcement popup  
✔ **Play Again** or **Exit** options  
✔ Works on **Mobile + Desktop**  
✔ **PWA support** (installable web app)

---

# 🧠 Game Flow

1. Player enters **name and avatar**  
2. Player can **Create Room** or **Join Room**  
3. A **6-digit room code** is generated  
4. Players arrange numbers **1–25 on a 5×5 grid**  
5. Game starts once **all players are ready**  
6. Players select numbers during the game  
7. When a row/column/diagonal completes → **BINGO letter fills**  
8. First player to complete **B I N G O** wins 🎉

---

# 🛠 Tech Stack

### Frontend
- React + Vite
- TypeScript
- Socket.io Client
- CSS

### Backend
- Node.js
- Express.js
- Socket.io

### Deployment
- Frontend → **Vercel**
- Backend → **Render**

### Other
- Progressive Web App (PWA)
- Real-time WebSocket communication

---

# 📂 Project Structure

```
project-root
│
├── backend
│   └── server.js
│
├── public
│   └── manifest.json
│
├── src
│   ├── App.tsx
│   ├── main.tsx
│   ├── socket.ts
│   └── styles
│
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

# ⚡ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/multiplayer-bingo.git
cd multiplayer-bingo
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Run Backend

```bash
cd backend
node server.js
```

---

### 4️⃣ Run Frontend

```bash
npm run dev
```

---

# 🎮 How to Play

1. Open the website  
2. Enter your **name and avatar**  
3. Create a room or join with a **6-digit code**  
4. Arrange your Bingo numbers  
5. Wait until all players are ready  
6. Start marking numbers  
7. Complete **B I N G O** to win the match!

---

# 📱 PWA Support

This application supports **Progressive Web App features**.

You can:
- Install it on mobile
- Use it like a native app
- Play directly from your home screen

---

# 🏆 Future Improvements

- Chat inside game rooms  
- Spectator mode  
- Leaderboard system  
- Sound effects and animations  
- Tournament mode  

---

# 👨‍💻 Author

**Chakradhar Chowdary Gunnam**

AI & ML Student | Full-Stack Developer | Competitive Programmer

---

⭐ If you like this project, consider **starring the repository**!