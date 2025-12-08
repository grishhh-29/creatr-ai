import React from "react";
import { assets } from "../assets/assets";

const Footer = () => {
	return (
		<footer className="px-6 md:px-16 lg:px-24 xl:px-32 pt-8 w-full text-gray-500">
			<div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-500/30 pb-6">
				<div className="md:max-w-96">
					<img className="h-9" src={assets.logo} alt="logo" />

					<p className="mt-6 text-sm">
						Experience the power of AI with creatr.ai <br />
						Transform your content creation with our suite of premium AI tools. Write articles, generate images, and enhance your workflow.
					</p>
				</div>
			</div>
			<p className="pt-4 text-center text-xs md:text-sm pb-5">Copyright 2025 © GP. All Right Reserved.</p>
		</footer>
	);
};

export default Footer;
