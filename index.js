import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { SarvamAIClient } from "sarvamai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// =============================
// SARVAM AI CONFIG
// =============================
const aiClient = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY,
});

// =============================
// EMAIL CONFIG
// =============================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// =============================
// HEALTH API
// =============================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Server running successfully",
  });
});

// =============================
// AI API
// =============================
app.post("/api/ai", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    const response = await aiClient.chat.completions({
      model: "sarvam-m",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "AI response generated successfully",
      data: response.choices[0].message.content,
    });
  } catch (error) {
    console.log("AI Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate AI response",
      error: error.message,
    });
  }
});

// =============================
// SEND EMAIL API
// =============================
app.post("/api/send-mail", async (req, res) => {
  try {
    const {
      to,
      subject,
      html,
    } = req.body;

    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        message: "to, subject and html are required",
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.log("Mail Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error.message,
    });
  }
});

// =============================
// SERVER START
// =============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});