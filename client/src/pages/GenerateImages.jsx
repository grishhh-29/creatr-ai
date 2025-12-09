import { Image, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Markdown from "react-markdown";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const GenerateImages = () => {
	const imageStyle = ["Realistic", "Ghibli style", "Anime style", "Cartoon", "Fantasy", "3D style", "Portrait"];

	const [selectedStyle, setSelectedStyle] = useState("Realistic");
	const [input, setInput] = useState("");

	const [publish, setPublish] = useState(false);

	const [loading, setLoading] = useState(false);
	const [content, setContent] = useState("");
	const [remainingImageCredits, setRemainingImageCredits] = useState(null);

	const { getToken } = useAuth();

	// Fetch user credits on mount
	useEffect(() => {
		const fetchCredits = async () => {
			try {
				const { data } = await axios.get("/api/user/get-user-credits", {
					headers: { Authorization: `Bearer ${await getToken()}` },
				});
				if (data.success && data.credits?.image !== undefined) {
					setRemainingImageCredits(data.credits.image);
				}
			} catch (error) {
				console.error("Failed to fetch image credits:", error);
			}
		};
		fetchCredits();
	}, []);

	const onSubmitHandler = async (e) => {
		e.preventDefault();
		try {
			setLoading(true);
			const prompt = `Generate an image of ${input} in the style ${selectedStyle}`;

			const { data } = await axios.post("/api/ai/generate-image", { prompt, publish }, { headers: { Authorization: `Bearer ${await getToken()}` } });

			if (data.success) {
				setContent(data.content);
				if (data.remainingCredits !== undefined) setRemainingImageCredits(data.remainingCredits);
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
			{/* Top row: Remaining Image Credits */}
			{remainingImageCredits === null ? null : (
				<div className="flex justify-between items-start w-72 p-2 px-4 bg-white rounded-xl border border-gray-200">
					<div className="text-slate-600 flex-1">
						{remainingImageCredits > 0 && <p className="text-sm">Remaining Image Credits</p>}
						<h2 className={`font-semibold ${remainingImageCredits === 0 ? "text-red-600 font-bold" : "text-lg"}`}>
							{remainingImageCredits === 0 ? "No credits left! Upgrade to continue." : remainingImageCredits ?? 0}
						</h2>
					</div>
					<div
						className={`w-10 h-10 rounded-lg flex justify-center items-center ${
							remainingImageCredits === 0 ? "bg-gray-300" : "bg-gradient-to-br from-[#00AD25] to-[#04FF50] text-white"
						}`}
					>
						<Sparkles className={`w-4 ${remainingImageCredits === 0 ? "text-gray-500" : "text-white"}`} />
					</div>
				</div>
			)}

			{/* Second row: Form + Generated Image side by side */}
			<div className="flex flex-wrap gap-4">
				{/* Left col: Image Generator */}
				<form onSubmit={onSubmitHandler} className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200">
					<div className="flex items-center gap-3">
						<Sparkles className="w-6 text-[#00AD25]" />
						<h1 className="text-xl font-semibold">AI Image Generator</h1>
					</div>

					<p className="mt-6 text-sm font-medium">Describe Your Image</p>
					<textarea
						onChange={(e) => setInput(e.target.value)}
						value={input}
						rows={4}
						className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
						placeholder="Describe what you want to see in the image..."
						required
					/>

					<p className="mt-4 text-sm font-medium">Style</p>
					<div className="mt-3 flex gap-3 flex-wrap sm:max-w-9/11">
						{imageStyle.map((item) => (
							<span
								onClick={() => setSelectedStyle(item)}
								className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${selectedStyle === item ? "bg-purple-50 text-purple-700" : "text-gray-500 border-gray-300"}`}
								key={item}
							>
								{item}
							</span>
						))}
					</div>

					<div className="my-6 flex items-center gap-2">
						<label className="relative cursor-pointer">
							<input type="checkbox" onChange={(e) => setPublish(e.target.checked)} checked={publish} className="sr-only peer" />
							<div className="w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-green-500 transition"></div>
							<span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-4"></span>
						</label>
						<p className="text-sm">Make this image Public</p>
					</div>

					<button
						disabled={loading || remainingImageCredits === 0}
						className={`w-full flex justify-center items-center gap-2 px-4 py-2 mt-6 text-sm rounded-lg bg-gradient-to-r from-[#00AD25] to-[#04FF50] text-white ${
							loading || remainingImageCredits === 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer"
						}`}
					>
						{loading ? <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span> : <Image className="w-5" />}
						Generate Image
					</button>
				</form>

				{/* Right col: Generated Image */}
				<div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px]">
					<div className="flex items-center gap-3">
						<Image className="w-5 h-5 text-[#00AD25]" />
						<h1 className="text-xl font-semibold">Generated image</h1>
					</div>

					{!content ? (
						<div className="flex-1 flex justify-center items-center">
							<div className="text-sm flex flex-col items-center gap-5 text-gray-400">
								<Image className="w-9 h-9" />
								<p>Enter a topic and click on "Generate image" to get started</p>
							</div>
						</div>
					) : (
						<div className="mt-3 h-full overflow-y-scroll">
							<img src={content} alt="image" className="w-full h-full" />
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default GenerateImages;
