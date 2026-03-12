// --- FIREBASE SETUP ---
// Note: Ensure you have Firebase SDKs included in your index.html head. 
// E.g. <script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore-compat.js"></script>

const firebaseConfig = {
    apiKey: "AIzaSyAM6CRs7ahy4qdH1kblN-ZN25IFMReuUDU",
    authDomain: "flappy-india.firebaseapp.com",
    projectId: "flappy-india",
    storageBucket: "flappy-india.firebasestorage.app",
    messagingSenderId: "256590287009",
    appId: "1:256590287009:web:7886c3015aee6fca1d20e0",
    measurementId: "G-QV4VZ6Q1CM"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- AUTHENTICATION STATE & GUEST MODE ---
let currentUser = null;
let isGuest = true;

// Listen for Auth changes
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        isGuest = false;
        console.log("Logged in as:", user.email); // Debugging
        // Optional: Trigger UI updates here if needed, like hiding login buttons.
    } else {
        currentUser = null;
        isGuest = true;
        console.log("Operating in Guest Mode");
    }
});

// --- HELPER: Username to Dummy Email ---
// Since Firebase requires an email, we create a dummy one using the username.
function getDummyEmail(username) {
    // E.g. "player1" becomes "player1@flappyindia.app"
    return username.toLowerCase() + "@flappyindia.app";
}

// --- AUTHENTICATION FUNCTIONS ---

// 1. Register User (Requires Username & Password. Email mapped automatically)
async function registerUser(username, password) {
    try {
        const dummyEmail = getDummyEmail(username);
        
        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(dummyEmail, password);
        const user = userCredential.user;

        // Create user profile in Firestore directly under /users/{uid}
        await db.collection('users').doc(user.uid).set({
            username: username, // Important: Store original username
            dummyEmail: dummyEmail,
            bestScore: 0,
            gamesPlayed: 0,
            totalScore: 0,
            averageScore: 0,
            joinDate: firebase.firestore.FieldValue.serverTimestamp() // Sets correct time on server
        });

        alert("Registration Successful!");
        return true; 
    } catch (error) {
        console.error("Registration Error:", error);
        alert(error.message);
        return false;
    }
}

// 2. Login User (Username & Password)
async function loginUser(username, password) {
    try {
        const dummyEmail = getDummyEmail(username);
        await auth.signInWithEmailAndPassword(dummyEmail, password);
        alert("Login Successful!");
        return true;
    } catch (error) {
        console.error("Login Error:", error);
        alert(error.message);
        return false;
    }
}

// 3. Logout
async function logoutUser() {
    try {
        await auth.signOut();
        alert("Logged out successfully.");
        // Redirect to main screen or update UI
        window.location.reload(); 
    } catch (error) {
         console.error("Logout Error:", error);
    }
}

// --- PROFILE & SCORE FUNCTIONS ---

// Update score after a game ends
async function saveGameScore(score) {
    if (isGuest) {
        console.log("Guest mode: Score not saved.");
        return; // Don't save for guests
    }

    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        
        // Use a transaction to safely update stats
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) throw "User document does not exist!";

            const data = userDoc.data();
            const newTotalScore = (data.totalScore || 0) + score;
            const newGamesPlayed = (data.gamesPlayed || 0) + 1;
            const newAverageScore = newTotalScore / newGamesPlayed;
            const newBestScore = score > (data.bestScore || 0) ? score : data.bestScore;

            transaction.update(userRef, {
                totalScore: newTotalScore,
                gamesPlayed: newGamesPlayed,
                averageScore: newAverageScore,
                bestScore: newBestScore
            });
        });
        console.log("Score updated successfully.");
    } catch (error) {
        console.error("Error saving score:", error);
    }
}

// Fetch user profile data (RACE CONDITION FIXED)
async function getUserProfile() {
    const user = firebase.auth().currentUser; // Naya fix: Seedha firebase se check karega
    if (!user) return null;
    
    try {
        const doc = await db.collection('users').doc(user.uid).get();
        if (doc.exists) {
            return doc.data();
        } else {
             console.log("No profile found.");
             return null;
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
    }
}

// --- GLOBAL LEADERBOARD ---

// Fetch Top 10 Players
async function getGlobalLeaderboard() {
    try {
        // Fetch top 10 users ordered by bestScore
        const snapshot = await db.collection('users')
                                 .orderBy('bestScore', 'desc')
                                 .limit(10)
                                 .get();
        
        const leaderboard = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            leaderboard.push({
                username: data.username,
                bestScore: data.bestScore
            });
        });
        
        return leaderboard; // Returns array of objects
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return [];
    }
}

// --- UTILITY ---
// Download APK logic (call this when the button is clicked)
function downloadAPK() {
    const a = document.createElement('a');
    a.href = './downloads/flappy_india.apk'; // Ensure this path matches your folder structure
    a.download = 'FlappyIndia.apk'; // The name the file will have when downloaded
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Export functions if using modules, otherwise they are globally available.
// If you use type="module" in your script tag, uncomment below:
// export { registerUser, loginUser, logoutUser, saveGameScore, getUserProfile, getGlobalLeaderboard, downloadAPK, isGuest };
// ==========================================
// --- NAYA: PAYMENT & GATEWAY LOGIC ---
// ==========================================

// 1. Device ID Generator
function generateDeviceId() {
    let id = localStorage.getItem('flappy_device_id');
    if (!id) {
        id = 'device_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('flappy_device_id', id);
    }
    return id;
}

// 2. UTR Submit
async function submitUTR(utrNumber) {
    const deviceId = generateDeviceId();
    try {
        await db.collection('payments').doc(deviceId).set({
            utrNumber: utrNumber,
            status: 'pending',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            isPromoUsed: false
        });
        return true;
    } catch (error) {
        console.error("UTR Submit Error: ", error);
        return false;
    }
}

// 3. Admin Approval Listener
function listenForApproval(onStatusChange) {
    const deviceId = generateDeviceId();

    db.collection('payments').doc(deviceId).onSnapshot((doc) => {
        if (doc.exists) {
            const status = doc.data().status;
            onStatusChange(status);
        }
    });
}