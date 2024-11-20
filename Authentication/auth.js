const admin = require('./serviceAccount');
const axios = require('axios');

const register = async (req, res) => {
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
};

// Fungsi login
const login = async (req, res) => {
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
};

// Mengekspor fungsi register dan login
module.exports = { register, login };