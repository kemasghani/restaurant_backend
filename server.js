import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import bahanRoutes from "./routes/bahanRoutes.js";
import bahanMasukRoutes from "./routes/bahanMasukRoutes.js";
import bahanKeluarRoutes from "./routes/bahanKeluarRoutes.js";
import satuanRoutes from "./routes/satuanRoutes.js";
import kategoriRoutes from "./routes/kategoriRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/bahan-keluar", bahanKeluarRoutes);
app.use("/api/orders", bahanMasukRoutes);
app.use("/api/bahan", bahanRoutes);
app.use("/api/satuan", satuanRoutes);
app.use("/api/kategori", kategoriRoutes);
app.use("/api/users", userRoutes);


app.listen(process.env.PORT || 5000, () => {
    console.log("Server running on port " + (process.env.PORT || 5000));
});
