import { FileText, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import Markdown from "react-markdown";
import { useAuth } from "@clerk/clerk-react";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const ReviewResume = () => {
	const [input, setInput] = useState("");

	const [loading, setLoading] = useState(false);
	const [content, setContent] = useState("");

	const [remainingResumeReviewCredits, setRemainingResumeReviewCredits] = useState(null);

	const { getToken } = useAuth();

	// Fetch user credits on mount
	useEffect(() => {
		const fetchCredits = async () => {
			try {
				const { data } = await axios.get("/api/user/get-user-credits", {
					headers: { Authorization: `Bearer ${await getToken()}` },
				});
				if (data.success && data.credits?.resumeReview !== undefined) {
					setRemainingResumeReviewCredits(data.credits.resumeReview);
				}
			} catch (error) {
				console.error("Failed to fetch removal credits:", error);
			}
		};
		fetchCredits();
	}, []);

	const onSubmitHandler = async (e) => {
		e.preventDefault();
		try {
			setLoading(true);

			const formData = new FormData();
			formData.append("resume", input);

			const { data } = await axios.post("/api/ai/resume-review", formData, { headers: { Authorization: `Bearer ${await getToken()}` } });

			if (data.success) {
				setContent(data.content);
				if (data.remainingCredits !== undefined) setRemainingResumeReviewCredits(data.remainingCredits);
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
			{/* Top row: Remaining Removal Credits */}
			{remainingResumeReviewCredits !== null && (
				<div className="flex justify-between items-start w-72 p-2 px-4 bg-white rounded-xl border border-gray-200">
					<div className="text-slate-600 flex-1">
						{remainingResumeReviewCredits > 0 && <p className="text-sm">Remaining Resume Credits</p>}
						<h2 className={`font-semibold ${remainingResumeReviewCredits === 0 ? "text-red-600 font-bold" : "text-lg"}`}>
							{remainingResumeReviewCredits === 0 ? "No credits left! Upgrade to continue." : remainingResumeReviewCredits ?? 0}
						</h2>
					</div>
					<div
						className={`w-10 h-10 rounded-lg flex justify-center items-center ${
							remainingResumeReviewCredits === 0 ? "bg-gray-300" : "bg-gradient-to-br from-[#00DA83] to-[#009BB3] text-white"
						}`}
					>
						<Sparkles className={`w-4 ${remainingResumeReviewCredits === 0 ? "text-gray-500" : "text-white"}`} />
					</div>
				</div>
			)}

			{/* Left/Right Columns */}
			<div className="flex flex-wrap gap-4">
				{/* Left col */}
				<form onSubmit={onSubmitHandler} className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200">
					<div className="flex items-center gap-3">
						<Sparkles className="w-6 text-[#00DA83]" />
						<h1 className="text-xl font-semibold">Resume Review</h1>
					</div>
					<p className="mt-6 text-sm font-medium">Upload Resume</p>

					<div className="flex w-full border border-gray-300 rounded-md overflow-hidden mt-2">
						<label className="w-2/8 bg-gray-200 text-gray-700 px-3 py-2 cursor-pointer text-center">
							Choose File
							<input
								type="file"
								accept="application/pdf"
								className="hidden"
								onChange={(e) => setInput(e.target.files[0])} // keeps your state
								required
							/>
						</label>
						<span className="w-6/8 bg-white text-gray-500 px-3 py-2 truncate">
							{input ? input.name : "No file chosen"} {/* show selected file */}
						</span>
					</div>

					<p className="text-xs text-gray-500 font-light mt-1">Supports PDF format only</p>

					<button
						disabled={loading || remainingResumeReviewCredits === 0}
						className={`w-full flex jusify-center items-center gap-2 px-4 py-2 mt-6 text-sm rounded-lg bg-gradient-to-r from-[#00DA83] to-[#009BB3] text-white ${
							loading || remainingResumeReviewCredits === 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer"
						}`}
					>
						{loading ? <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span> : <FileText className="w-5" />}
						Review Resume
					</button>
				</form>
				{/* Right col */}
				<div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px] overflow-y-scroll">
					<div className="flex items-center gap-3">
						<FileText className="w-5 h-5 text-[#00DA83]" />
						<h1 className="text-xl font-semibold">Analysis Results</h1>
					</div>

					{!content ? (
						<div className="flex-1 flex justify-center items-center">
							<div className="text-sm flex flex-col items-center gap-5 text-gray-400">
								<FileText className="w-9 h-9" />
								<p>Upload a resume and click "Review Resume" to get started</p>
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

export default ReviewResume;
