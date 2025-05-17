const express = require("express");
const router = express.Router();
const supabase = require("../config/supabaseClient");
const sendOtp = require("../services/OtpService");
const validateOtp = require("../services/validateOtpService");

// ========== OTP Routes ==========
router.get("/sendOtp/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const info = await sendOtp(id);
    res.json({ info });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/validateOtp/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { otp } = req.query;
    const info = await validateOtp(id, otp);
    res.json({ info });
  } catch (error) {
    console.error("Error validating OTP:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ========== User Routes ==========
router.get("/allusers", async (req, res) => {
  const { data, error } = await supabase.from("user").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
});

router.get("/userById/:Id", async (req, res) => {
  const { Id } = req.params;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", Id)
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

router.get("/user", async (req, res) => {
  const { data, error } = await supabase.from("user").select("*");
  if (error) return res.status(400).json({ error: error.message });
  res.status(200).json(data);
});

// ========== Email & Phone Checks ==========
router.post("/check-email", async (req, res) => {
  const { email } = req.body;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (error) return res.status(400).json({ error: "Error checking email" });
    return res.status(200).json({ exists: !!data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/check-verified", async (req, res) => {
  const { email } = req.body;
  const { data, error } = await supabase
    .from("profiles")
    .select("email_verified")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return res.status(400).json({ error: "Error checking email verification" });
  }

  if (!data) {
    return res.status(404).json({ message: "User not found" });
  }

  const isVerified = data.email_verified === "true";
  return res.status(200).json({ verified: isVerified });
});

router.post("/check-phone", async (req, res) => {
  const { phone } = req.body;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("phone")
      .eq("phone", phone)
      .maybeSingle();

    if (error) return res.status(400).json({ error: "Error checking phone" });
    return res.status(200).json({ exists: !!data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ========== Update Auth Email & Password ==========
router.put("/update-auth-email-pass", async (req, res) => {
  const { old_email, new_email, new_password } = req.body;

  try {
    const { data: users, error: fetchError } =
      await supabase.auth.admin.listUsers();

    if (fetchError) {
      return res.status(400).json({ error: "Error fetching user list" });
    }

    const user = users.users.find((u) => u.email === old_email);
    if (!user) {
      return res.status(404).json({ error: "User with this email not found" });
    }

    const { data, error: updateError } =
      await supabase.auth.admin.updateUserById(user.id, {
        email: new_email,
        password: new_password,
      });

    if (updateError) {
      return res.status(400).json({ error: "Error updating auth credentials" });
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ email: new_email })
      .eq("id", user.id);

    if (profileError) {
      return res.status(400).json({ error: "Error updating profile table" });
    }

    return res
      .status(200)
      .json({ message: "Email and password updated successfully", data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// ========== Update User Details ==========
router.put("/update-user-details", async (req, res) => {
  try {
    const { id, age, gender, phoneNumber, phone_verified, name } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const updateFields = {};
    if (age !== undefined) updateFields.age = age;
    if (gender !== undefined) updateFields.gender = gender;
    if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
    if (phone_verified !== undefined) updateFields.phone_verified = phone_verified;
    if (name !== undefined) updateFields.name = name;

    const { error } = await supabase
      .from("profiles")
      .update(updateFields)
      .eq("id", id);

    if (error) {
      return res.status(400).json({ error: "Error updating user details" });
    }

    res.status(200).json({ message: "User details updated successfully" });
  } catch (error) {
    console.error("Update user details error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
