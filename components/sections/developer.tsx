import Image from "next/image";
import Link from "next/link";
import { Mail, Github, Linkedin } from "lucide-react";

export default function Developer() {
    return (
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
            <div className="container px-4 mx-auto">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-12 text-gray-900 dark:text-white">Meet the Developer</h2>

                    <div className="flex flex-col items-center">
                        <div className="relative w-48 h-48 mb-6 rounded-full overflow-hidden border-4 border-white shadow-lg">
                            <Image
                                src="/developer1.png"
                                alt="Shreyas Patil"
                                fill
                                className="object-cover"
                            />
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Shreyas Patil</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">Full Stack Developer & AI Enthusiast</p>

                        <div className="flex items-center justify-center gap-6">
                            <Link
                                href="mailto:shreyaspatil8049@gmail.com"
                                className="flex flex-col items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
                            >
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-md group-hover:shadow-lg transition-all">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-medium">Email</span>
                            </Link>

                            <Link
                                href="https://www.linkedin.com/in/shreyas-patil-526a89319/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 text-gray-600 hover:text-blue-700 transition-colors group"
                            >
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-md group-hover:shadow-lg transition-all">
                                    <Linkedin className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-medium">LinkedIn</span>
                            </Link>

                            <Link
                                href="https://github.com/Shreyaspatil21"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-col items-center gap-2 text-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors group"
                            >
                                <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-md group-hover:shadow-lg transition-all">
                                    <Github className="w-6 h-6" />
                                </div>
                                <span className="text-sm font-medium">GitHub</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
