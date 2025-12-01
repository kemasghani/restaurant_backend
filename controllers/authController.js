import supabase from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ======================= REGISTER =======================
export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // check existing user
    const { data: existing, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (checkError) throw checkError;
    if (existing.length > 0)
      return res.status(400).json({ message: "Email already registered" });

    // hash password
    const hashed = await bcrypt.hash(password, 10);

    // insert user
    const { error } = await supabase
      .from("users")
      .insert([{ name, email, password: hashed, role }]);

    if (error) throw error;

    res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};


// ======================= LOGIN =======================
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // get user by email
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .limit(1);

    if (error) throw error;

    const user = users[0];
    if (!user)
      return res.status(404).json({ message: "User not found" });

    // check password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Invalid password" });

    // generate token
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};
