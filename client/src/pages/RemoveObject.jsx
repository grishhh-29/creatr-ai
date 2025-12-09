import { Scissors, Sparkles } from "lucide-react";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const RemoveObject = () => {
	const [input, setInput] = useState("");
	const [object, setObject] = useState("");

	const [loading, setLoading] = useState(false);
	const [content, setContent] = useState("");
	const [remainingRemovalCredits, setRemainingRemovalCredits] = useState(null);

	const { getToken } = useAuth();

	// Fetch user credits on mount
	useEffect(() => {
		const fetchCredits = async () => {
			try {
				const { data } = await axios.get("/api/user/get-user-credits", {
					headers: { Authorization: `Bearer ${await getToken()}` },
				});
				if (data.success && data.credits?.removal !== undefined) {
					setRemainingRemovalCredits(data.credits.removal);
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

			if (object.split(" ").length > 1) {
				return toast("Please enter only 1 object name");
			}

			const formData = new FormData();
			formData.append("image", input);
			formData.append("object", object);

			const { data } = await axios.post("/api/ai/remove-image-object", formData, { headers: { Authorization: `Bearer ${await getToken()}` } });

			if (data.success) {
				setContent(data.content);
				if (data.remainingCredits !== undefined) setRemainingRemovalCredits(data.remainingCredits);
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
			{remainingRemovalCredits !== null && (
				<div className="flex justify-between items-start w-72 p-2 px-4 bg-white rounded-xl border border-gray-200">
					<div className="text-slate-600 flex-1">
						{remainingRemovalCredits > 0 && <p className="text-sm">Remaining Removal Credits</p>}
						<h2 className={`font-semibold ${remainingRemovalCredits === 0 ? "text-red-600 font-bold" : "text-lg"}`}>
							{remainingRemovalCredits === 0 ? "No credits left! Upgrade to continue." : remainingRemovalCredits ?? 0}
						</h2>
					</div>
					<div
						className={`w-10 h-10 rounded-lg flex justify-center items-center ${
							remainingRemovalCredits === 0 ? "bg-gray-300" : "bg-gradient-to-br from-[#F6AB41] to-[#FF4938] text-white"
						}`}
					>
						<Sparkles className={`w-4 ${remainingRemovalCredits === 0 ? "text-gray-500" : "text-white"}`} />
					</div>
				</div>
			)}

			{/* Left/Right Columns */}
			<div className="flex flex-wrap gap-4">
				{/* Left col */}
				<form onSubmit={onSubmitHandler} className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200">
					<div className="flex items-center gap-3">
						<Sparkles className="w-6 text-[#FF4938]" />
						<h1 className="text-xl font-semibold">Object Removal</h1>
					</div>
					<p className="mt-6 text-sm font-medium">Upload Image</p>

					<div className="flex w-full border border-gray-300 rounded-md overflow-hidden mt-2">
						<label className="w-2/8 bg-gray-200 text-gray-700 px-3 py-2 cursor-pointer text-center">
							Choose File
							<input
								type="file"
								accept="image/*"
								className="hidden"
								onChange={(e) => setInput(e.target.files[0])} // update state
								required
							/>
						</label>

						{/* Right side: File name (80%) */}
						<span className="w-6/8 bg-white text-gray-500 px-3 py-2 truncate">{input ? input.name : "No file chosen"}</span>
					</div>

					<p className="mt-6 text-sm font-medium">Describe object name to remove</p>

					<textarea
						onChange={(e) => setObject(e.target.value)}
						value={object}
						rows={4}
						className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
						placeholder="eg: watch or spoon, ONLY SINGLE OBJECT NAME"
						required
					/>

					<button
						disabled={loading || remainingRemovalCredits === 0}
						className={`w-full flex justify-center items-center gap-2 px-4 py-2 mt-6 text-sm rounded-lg bg-gradient-to-r from-[#F6AB41] to-[#FF4938] text-white ${
							loading || remainingRemovalCredits === 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer"
						}`}
					>
						{loading ? <span className="w-4 h-4 my-1 rounded-full border-2 border-t-transparent animate-spin"></span> : <Scissors className="w-5" />}
						Remove object
					</button>
				</form>
				{/* Right col */}
				<div className="w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border border-gray-200 min-h-96 max-h-[600px] overflow-y-scroll">
					<div className="flex items-center gap-3">
						<Scissors className="w-5 h-5 text-[#FF4938]" />
						<h1 className="text-xl font-semibold">Processed Image</h1>
					</div>
					{!content ? (
						<div className="flex-1 flex justify-center items-center">
							<div className="text-sm flex flex-col items-center gap-5 text-gray-400">
								<Scissors className="w-9 h-9" />
								<p>Upload an image and click "Remove Object" to get started</p>
							</div>
						</div>
					) : (
						<div className="mt-3">
							<img src={content} alt="image" className="w-full h-full object-contain" />
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default RemoveObject;
