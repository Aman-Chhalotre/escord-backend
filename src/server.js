const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const userroutes = require("./routes/UserRoutes")
const escortRoutes = require("./routes/escortRoutes");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path")
dotenv.config();
connectDB();
const app = express();
const corsOptions = {
     origin: [
          "https://escort-beta.vercel.app", // Vercel origin
          "http://localhost:5173"           // Local development origin
        ], // Allow your frontend running on localhost:5173
     methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
     credentials: true, // Allow cookies to be sent along with requests
};

app.use(cors(corsOptions)); // Apply the CORS configuration globally
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.json());
// Serve static files from the "uploads" folder inside "src"
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')), (req, res, next) => {
//      console.log(`Serving file: ${req.url}`);
//      next();
//    });
//    console.log(path.join(__dirname, 'uploads'));

// app.use('/uploads', express.static(path.join(__dirname, 'src', 'uploads')));
app.get('/', (req, res) => {
     res.send("Hello Escort for deploy");
});
app.use("/api/users", userroutes);
app.use("/api/escorts", escortRoutes); // Use Escort routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));