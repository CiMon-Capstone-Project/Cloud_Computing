const express = require('express');
const { db, createTable }= require ('./database/db');
const axios = require('axios');
const multer = require('multer')
const path = require('path');
var admin = require("firebase-admin");


var serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const app = express();

app.use(express.json())

const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

//setup multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  });
  
const upload = multer({ storage: storage });

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];
        if (!token) {
            return res.status(401).json({ 
              status: 'error',
              message: 'No token provided' });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ 
          status: "error",
          message: 'Invalid token' });
    }
};

//register
app.post('/register', async (req, res) => {
    try {
        const user = req.body;
        
        if (!user.email || !user.password) {
            return res.status(400).json({ 
              status: 'error',
              message: "Email and password are required" 
            });
        }
  
        const userResponse = await admin.auth().createUser({
            email: user.email,
            password: user.password,
            emailVerified: false,
            disabled: false,
        });
  
        const customToken = await admin.auth().createCustomToken(userResponse.uid);
  
        res.status(201).json({
            status: 'success',
            message: "User created successfully",
            data: {
              token: customToken,
              uid: userResponse.uid,
              email: userResponse.email,
              emailVerified: userResponse.emailVerified
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(400).json({ 
          status: 'error',
          message: error.message
        });
    }
});

//login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
              status: 'error',
              message: "Email and password are required"
            });
        }
  
        // Verify password using Firebase Auth REST API
        const response = await axios.post(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyCSNgeTFAuSOBEzFN2gmMlXJqlMfjGdIOk`,
            {
                email,
                password,
                returnSecureToken: true
            }
        );
  
        // If we get here, the password was correct
        const firebaseUser = response.data;
        
        // Get additional user info from Admin SDK
        const user = await admin.auth().getUserByEmail(email);
        
        // Create a custom token
        const customToken = await admin.auth().createCustomToken(user.uid);
        
        res.status(201).json({
          status: 'success',
          message: "Successfully signed in",
          data: {
            token: customToken,
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            idToken: firebaseUser.idToken  // This is the Firebase ID token
            }
        });
    } catch (error) {
        console.error('Error signing in:', error);
        
        let errorMessage = "Authentication failed";
        let statusCode = 401;
        
        // Handle Firebase Auth REST API errors
        if (error.response) {
            const errorCode = error.response.data.error.message;
            switch (errorCode) {
                case 'EMAIL_NOT_FOUND':
                    errorMessage = "No user found with this email";
                    break;
                case 'INVALID_PASSWORD':
                    errorMessage = "Invalid password";
                    break;
                case 'USER_DISABLED':
                    errorMessage = "This account has been disabled";
                    break;
                default:
                    statusCode = 500;
                    errorMessage = "Internal server error";
            }
        }
        
        res.status(statusCode).json({
          status: 'error',
          message: errorMessage,
          error: error.response?.data?.error?.message || error.message
        });
    }
});

//upload gambar 
// Upload gambar ke local storage sekaligus ke database
app.post('/upload', verifyToken, upload.single('gambar'), async (req, res) => {
    try {
        // Periksa apakah file sudah diunggah
        if (!req.file) {
            return res.status(400).json({ 
                status: "error", 
                message: "Tidak ada file gambar yang diunggah" 
            });
        }

        const { title } = req.body;
        const file = req.file;
        const user_id = req.user.uid; // Mendapatkan UID user dari token
        
        // Validasi jika title kosong
        if (!title) {
            return res.status(400).json({
                status: "error",
                message: "Judul dibutuhkan"
            });
        }

        // Menentukan deskripsi berdasarkan title
        let description = '';
        if (title.toLowerCase() === 'cabe merah') {
            description = "Ini deskripsi cabe merah";
        } else if (title.toLowerCase() === 'cabe hijau') {
            description = "Ini deskripsi cabe hijau";
        } else {
            description = "Deskripsi tidak tersedia";
        }

        // Menentukan URL lokal tempat file tersimpan
        const imageUrl = `uploads/${file.filename}`;

        // Simpan metadata gambar ke database
        const query = `INSERT INTO images (user_id, image_url, title, description) VALUES (?, ?, ?, ?)`;
        db.query(query, [user_id, imageUrl, title, description], (err, result) => {
            if (err) {
                console.log("Error:", err);
                return res.status(400).json({ 
                    status: "error", 
                    message: "Error menambahkan metadata gambar ke database" 
                });
            }

            // Kirimkan response berhasil
            res.status(201).json({
                status: "success",
                message: "Berhasil mengunggah gambar",
                data: {
                    user_id,
                    image_url: imageUrl,
                    title,
                    description
                }
            });
        });

    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Internal server error' 
        });
    }
});


//get gambar
app.get("/images", verifyToken, async (req,res) => {
    const { title } = req.query
    const user_id = req.user.uid

    if(!title) {
        console.log("eRROR =", err)
        return res.status(400).json({ status: 'error', message: 'title harus diisi'})
    }

    const query = `SELECT image_url, title, description FROM images WHERE user_id = ? AND title = ?`
    db.query(query, [user_id, title], (err, result) => {
        if(err) {
            console.log("eRROR =", err)
            return res.status(400).json({ status: 'error', message: 'gagal menampilkan data'})
        }

        if(result.length === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'gada gambar nya bang'
            })
        }

        res.status(200).json({
            status: "success",
            message: "berhasil menampilkan gambar",
            data: result
        })
    })

})

app.listen(3000, ()=> {
    console.log("Server berjalan di port 3000")
})