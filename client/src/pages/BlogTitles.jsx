import React, { useState, useEffect } from "react";
import { Hash, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import Markdown from "react-markdown";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const BlogTitles = () => {
	const blogCategories = ["General", "Technology", "Business", "Health", "Lifestyle", "Education", "Travel", "Food"];

	const [selectedCategory, setSelectedCategory] = useState("General");
	const [input, setInput] = useState("");

	const [loading, setLoading] = useState(false);
	const [content, setContent] = useState("");
	const [remainingBlogTitleCredits, setRemainingBlogTitleCredits] = useState(null);

	const { getToken } = useAuth();

	//  Preload user credits
	useEffect(() => {
		const fetchCredits = async () => {
			try {
				const { data } = await axios.get("/api/user/get-user-credits", {
					headers: { Authorization: `Bearer ${await getToken()}` },
				});
				if (data.success && data.credits?.blogTitle !== undefined) {
					setRemainingBlogTitleCredits(data.credits.blogTitle);
				}
			} catch (error) {
				console.error("Failed to fetch credits:", error);
			}
		};
		fetchCredits();
	}, []);

	const onSubmitHandler = async (e) => {
		e.preventDefault();
		if (remainingBlogTitleCredits === 0) {
			toast.error("No blog title credits left! Upgrade to continue.");
			return;
		}
		try {
			setLoading(true);
			const prompt = `Generate a blog title for the keyword "${input}" in the category "${selectedCategory}"`;

			const { data } = await axios.post("/api/ai/generate-blog-title", { prompt }, { headers: { Authorization: `Bearer ${await getToken()}` } });

			if (data.success) {
				setContent(data.content);

				if (data.remainingCredits !== undefined) {
					setRemainingBlogTitleCredits(data.remainingCredits);
				}
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.message);
		}
		setLoading(false);
	};

	return (
		<div className="h-full overflow-y-scroll p-6 flex flex-col gap-4 text-slate-700">
			{/* Top row: Remaining Blog Title Credits */}
			{remainingBlogTitleCredits === null ? null : (
			<div className="flex justify-between items-start w-72 p-2 px-4 bg-white rounded-xl border border-gray-200">
				<div className="text-slate-600 flex-1">
					{remainingBlogTitleCredits > 0 && <p className="text-sm">Remaining Blog Title Credits</p>}
					<h2 className={`font-semibold ${remainingBlogTitleCredits === 0 ? "text-red-600 font-bold" : "text-lg"}`}>
						{remainingBlogTitleCredits === 0 ? "No credits left! Upgrade to continue." : remainingBlogTitleCredits ?? 0}
					</h2>
				</div>
				<div
					className={`w-10 h-10 rounded-lg flex justify-center items-center ${
						remainingBlogTitleCredits === 0 ? "bg-gray-300" : "bg-gradient-to-br from-[#8E37EB] to-[#C341F6] text-white"
					}`}
				>
					<Sparkles className={`w-4 ${remainingBlogTitleCredits === 0 ? "text-gray-500" : "text-white"}`} />
				</div>
			</div>
			)}

			{/* Second row: Form + Generated Titles side by side */}
			<div className="flex flex-wrap gap-4">
				{/* Left col: Title Generator */}
				<form onSubmit={onSubmitHandler} className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200">
					<div className="flex items-center gap-3">
						<Sparkles className="w-6 text-[#8E37EB]" />
						<h1 className="text-xl font-semibold">AI Blog Title Generator</h1>
					</div>

					<p className="mt-6 text-sm font-medium">Keyword</p>
					<input
						onChange={(e) => setInput(e.target.value)}
						value={input}
						type="text"
						className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
						placeholder="The future of artificial intelligence is..."
						required
					/>

					<p className="mt-4 text-sm font-medium">Category</p>
					<div className="mt-3 flex gap-3 flex-wrap sm:max-w-9/11">
						{blogCategories.map((item) => (
							<span
								onClick={() => setSelectedCategory(item)}
								className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedCategory === item ? "bg-purple-50 text-purple-700" : "text-gray-500 border-gray-300"}`}
								key={item}
							>
								{item}
							</span>
						))}
					</div>

					<br />
					<button
						disabled={loading || remainingBlogTitleCredits === 0}
						className={`w-full flex justify-center items-center gap-2 px-4 py-2 mt-6 text-sm rounded-lg ${
							loading || remainingBlogTitleCredits === 0 ? "cursor-not-allowed opacity-50" : "bg-gradient-to-r from-[#C341F6] to-[#8E37EB] text-white cursor-pointer"
						}`}
					>
						{loading ? <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span> : <Hash className="w-5" />}
						Generate title
					</button>
				</form>

				{/* Right col: Generated Titles */}
				<div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]">
					<div className="flex items-center gap-3">
						<Hash className="w-5 h-5 text-[#8E37EB]" />
						<h1 className="text-xl font-semibold">Generated titles</h1>
					</div>

					{!content ? (
						<div className="flex-1 flex justify-center items-center">
							<div className="text-sm flex flex-col items-center gap-5 text-gray-400">
								<Hash className="w-9 h-9" />
								<p>Enter a topic and click on "Generate title" to get started</p>
							</div>
						</div>
					) : (
						<div className="mt-3 h-full overflow-y-scroll text-sm text-slate-600">
							<div className="reset-tw">
								<Markdown>{content}</Markdown>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default BlogTitles;
