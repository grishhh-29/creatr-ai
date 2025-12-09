import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";

const AI = new OpenAI({
	apiKey: process.env.GEMINI_API_KEY,
	baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export const generateArticle = async (req, res) => {
	try {
		const { userId } = req.auth();
		const { prompt, length } = req.body;
		const credits = req.credits;

		// Check if user has enough credits
		if (credits.article <= 0) {
			return res.json({
				success: false,
				message: "You have no article credits left. Upgrade to continue.",
			});
		}

		// Call AI API
		const response = await AI.chat.completions.create({
			model: "gemini-2.0-flash",
			messages: [{ role: "user", content: prompt }],
			temperature: 0.7,
			max_tokens: length,
		});

		const content = response.choices[0].message.content;

		// Save creation to DB
		await sql`INSERT INTO creations (user_id, prompt, content, type) 
               VALUES (${userId}, ${prompt}, ${content}, 'article')`;

		// Deduct 1 article credit
		const updatedCredits = { ...credits, article: credits.article - 1 };
		await clerkClient.users.updateUserMetadata(userId, {
			privateMetadata: { credits: updatedCredits },
		});

		res.json({ success: true, content, remainingCredits: updatedCredits.article });
	} catch (error) {
		console.log(error.response?.data || error);
		res.json({
			success: false,
			message: error.response?.data?.error?.message || error.message,
		});
	}
};

export const generateBlogTitle = async (req, res) => {
	try {
		const { userId } = req.auth();
		const { prompt } = req.body;
		const credits = req.credits;

		// Check if user has enough blog title credits
		if (credits.blogTitle <= 0) {
			return res.json({
				success: false,
				message: "You have no blog title credits left. Upgrade to continue.",
			});
		}

		// Call AI API
		const response = await AI.chat.completions.create({
			model: "gemini-2.0-flash",
			messages: [{ role: "user", content: prompt }],
			temperature: 0.7,
			max_tokens: 100,
		});

		const content = response.choices[0].message.content;

		// Save creation to DB
		await sql`INSERT INTO creations (user_id, prompt, content, type)
                   VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`;

		// Deduct 1 blog title credit
		const updatedCredits = { ...credits, blogTitle: credits.blogTitle - 1 };
		await clerkClient.users.updateUserMetadata(userId, {
			privateMetadata: { credits: updatedCredits },
		});

		res.json({ success: true, content, remainingCredits: updatedCredits.blogTitle });
	} catch (error) {
		console.log(error.response?.data || error);
		res.json({
			success: false,
			message: error.response?.data?.error?.message || error.message,
		});
	}
};

export const generateImage = async (req, res) => {
	try {
		const { userId } = req.auth();
		const { prompt, publish } = req.body;
		const credits = req.credits;

		// Check if user has enough image credits
		if (credits.image <= 0) {
			return res.json({
				success: false,
				message: "You have no image generation credits left. Upgrade to continue.",
			});
		}

		// Prepare prompt for external API
		const formData = new FormData();
		formData.append("prompt", prompt);

		const { data } = await axios.post("https://clipdrop-api.co/text-to-image/v1", formData, {
			headers: { "x-api-key": process.env.CLIPDROP_API_KEY },
			responseType: "arraybuffer",
		});

		const base64Image = `data:image/png;base64,${Buffer.from(data, "binary").toString("base64")}`;

		const { secure_url } = await cloudinary.uploader.upload(base64Image);

		// Save to DB
		await sql`INSERT INTO creations (user_id, prompt, content, type, publish) 
                   VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;

		// Deduct 1 image credit
		const updatedCredits = { ...credits, image: credits.image - 1 };
		await clerkClient.users.updateUserMetadata(userId, {
			privateMetadata: { credits: updatedCredits },
		});

		// Return remaining credits
		res.json({ success: true, content: secure_url, remainingCredits: updatedCredits.image });
	} catch (error) {
		console.log(error.response?.data || error);
		res.json({
			success: false,
			message: error.response?.data?.error?.message || error.message,
		});
	}
};

export const removeImageBackground = async (req, res) => {
	try {
		const { userId } = req.auth();
		const image = req.file;
		const credits = req.credits; // Get user credits

		// Check if user has enough image credits
		if (credits.removal <= 0) {
			return res.json({
				success: false,
				message: "You have no removal credits left. Upgrade to continue.",
			});
		}

		// Remove background via Cloudinary
		const { secure_url } = await cloudinary.uploader.upload(image.path, {
			transformation: [
				{
					effect: "background_removal",
					background_removal: "remove_the_background",
				},
			],
		});

		// Save to DB
		await sql`INSERT INTO creations (user_id, prompt, content, type) 
                  VALUES (${userId}, 'Removed background from image', ${secure_url}, 'image')`;

		// Deduct 1 removal credit
		const updatedCredits = { ...credits, removal: credits.removal - 1 };
		await clerkClient.users.updateUserMetadata(userId, {
			privateMetadata: { credits: updatedCredits },
		});

		// Return success with remaining credits
		res.json({ success: true, content: secure_url, remainingCredits: updatedCredits.removal });
	} catch (error) {
		console.log(error.response?.data || error);
		res.json({
			success: false,
			message: error.response?.data?.error?.message || error.message,
		});
	}
};

export const removeImageObject = async (req, res) => {
	try {
		const { userId } = req.auth();
		const { object } = req.body;
		const credits = req.credits; // Get user credits

		// Check if user has enough image credits
		if (credits.removal <= 0) {
			return res.json({
				success: false,
				message: "You have no removal credits left. Upgrade to continue.",
			});
		}

		const { public_id } = await cloudinary.uploader.upload(image.path);

		const imageUrl = cloudinary.url(public_id, {
			transformation: [{ effect: `gen_remove:${object}` }],
			resource_type: "image",
		});

		await sql` INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')`;

		// Deduct 1 removal credit
		const updatedCredits = { ...credits, removal: credits.removal - 1 };
		await clerkClient.users.updateUserMetadata(userId, {
			privateMetadata: { credits: updatedCredits },
		});

		res.json({ success: true, content: secure_url, remainingCredits: updatedCredits.removal });
	} catch (error) {
		console.log(error.response?.data || error);
		res.json({
			success: false,
			message: error.response?.data?.error?.message || error.message,
		});
	}
};

export const resumeReview = async (req, res) => {
	try {
		const { userId } = req.auth();
		const resume = req.file;
		const credits = req.credits; // Get user credits

		// Check if user has enough image credits
		if (credits.resumeReview <= 0) {
			return res.json({
				success: false,
				message: "You have no resume review credits left. Upgrade to continue.",
			});
		}
		if (resume.size > 5 * 1024 * 1024) {
			return res.json({ success: false, message: "Resume file size exceeds allowed size (5MB)." });
		}

		const dataBuffer = fs.readFileSync(resume.path);
		const pdfData = await pdf(dataBuffer);

		const prompt = `Review the following resume and provide constructive feeback on its strengths, weaknesses, and areas for improvement. Resume Content:\n\n${pdfData.text}`;

		const response = await AI.chat.completions.create({
			model: "gemini-2.0-flash",
			messages: [
				{
					role: "user",
					content: prompt,
				},
			],
			temperature: 0.7,
			max_tokens: 1200,
		});

		const content = response.choices[0].message.content;

		await sql` INSERT INTO creations (user_id, prompt, content, type) 
        VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;

		// Deduct 1 removal credit
		const updatedCredits = { ...credits, resumeReview: credits.resumeReview - 1 };
		await clerkClient.users.updateUserMetadata(userId, {
			privateMetadata: { credits: updatedCredits },
		});

		res.json({ success: true, content, remainingCredits: updatedCredits.resumeReview });
	} catch (error) {
		console.log(error.response?.data || error);
		res.json({
			success: false,
			message: error.response?.data?.error?.message || error.message,
		});
	}
};
