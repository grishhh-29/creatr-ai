import React, { useEffect, useState } from "react";
import { dummyCreationData } from "../assets/assets";
import { Gem, HeartCrack, HeartHandshake, HeartHandshakeIcon, HeartOff, Sparkles } from "lucide-react";
import { Protect, useAuth } from "@clerk/clerk-react";
import CreationItem from "../components/CreationItem";
import axios from "axios";
import toast from "react-hot-toast";
import Markdown from "react-markdown";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;
const Dashboard = () => {
	const [creations, setCreations] = useState([]);

	const [loading, setLoading] = useState(true);
	const [expandedText, setExpandedText] = useState(null);
	const [expanded, setExpanded] = useState(null); // expanded item (text or image)

	const { getToken } = useAuth();

	const getDashboardData = async () => {
		try {
			const { data } = await axios.get("/api/user/get-user-creations", { headers: { Authorization: `Bearer ${await getToken()}` } });

			if (data.success) {
				setCreations(data.creations);
			} else {
				toast.error(data.message);
			}
		} catch (error) {
			toast.error(error.message);
		}
		setLoading(false);
	};

	useEffect(() => {
		getDashboardData();
	}, []);

	return (
		<div className="h-full overflow-y-scroll p-6">
			<div className="flex justify-start gap-4 flex-wrap">
				{/* Total Creations Card */}
				<div className="flex justify-between items-center w-72 p-2 px-4 bg-white rounded-xl border border-gray-200">
					<div className="text-slate-600">
						<p className="text-sm">Total Creations</p>
						<h2 className="text-lg font-semibold">{creations.length}</h2>
					</div>
					<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF3CAC] to-[#7A004B] text-white flex  justify-center items-center">
						<Sparkles className="w-4 text-white" />
					</div>
				</div>

				{/* Active Plan Card */}
				<div className="flex justify-between items-center w-72 p-2 px-4 bg-white rounded-xl border border-gray-200">
					<div className="text-slate-600">
						<p className="text-sm">Active Plan</p>
						<h2 className="text-lg font-semibold">
							<Protect plan="premium" fallback="Free">
								Premium
							</Protect>
						</h2>
					</div>

					<Protect
						plan="premium"
						fallback={
							<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-300 to-gray-500 flex justify-center items-center">
								<Gem className="w-5 text-gray-700" />
							</div>
						}
					>
						<div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF3CAC] to-[#7A004B] flex justify-center items-center">
							<Gem className="w-5 text-white" />
						</div>
					</Protect>
				</div>
			</div>

			{loading ? (
				<div className="flex justify-center items-center h-3/4">
					<div className="animate-spin rounded-full h-11 w-11 border-3 border-purple-500 border-t-transparent"></div>
				</div>
			) : (
				<div className="mt-6">
					<p className="mb-4 text-lg font-semibold">Recent Creations</p>

					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
						{creations.map((item) => (
							<div
								key={item.id}
								className="bg-white rounded-lg overflow-hidden shadow-[0_4px_6px_rgba(120,0,75,0.3)] hover:shadow-[0_10px_15px_rgba(120,0,75,0.5)] transition-shadow duration-200 cursor-pointer"
								onClick={() => setExpanded(item)}
							>
								{item.type === "image" ? (
									<img src={item.content} alt={item.prompt || "Creation Image"} className="w-full h-48 object-cover" />
								) : (
									<div className="p-3 h-48 overflow-hidden">
										<p className="text-sm text-gray-700 line-clamp-6">
											<Markdown>{item.content || item.prompt || "No content available"}</Markdown>
										</p>
									</div>
								)}

								<div className="p-3 border-t border-gray-100">
									<p className="text-s text-gray-900 truncate">{item.prompt}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Modal for expanded content */}
			{expanded && (
				<div
					className="fixed inset-0 bg-black/30 flex justify-center items-center z-50"
					onClick={() => setExpanded(null)} // click outside closes
				>
					<div
						className="bg-white max-w-3xl w-11/12 max-h-[80vh] p-6 rounded-lg shadow-lg relative overflow-y-auto"
						onClick={(e) => e.stopPropagation()} // prevent modal close when clicking inside
					>
						<button className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-lg font-bold p-1 z-50 cursor-pointer" onClick={() => setExpanded(null)}>
							✕
						</button>
						<div className="p-4 relative">
							{/* Close button */}

							{expanded.type === "image" ? (
								<img src={expanded.content} alt={expanded.prompt || "Expanded Image"} className="w-full max-h-[70vh] object-contain" />
							) : (
								<div>
									<h2 className="text-lg font-semibold mb-4">{expanded.prompt}</h2>
									<p className="text-gray-700 whitespace-pre-line">
										<Markdown>{expanded.content}</Markdown>
									</p>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default Dashboard;
