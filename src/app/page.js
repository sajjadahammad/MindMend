import { HuggingFaceChatbot } from "@/components/huggingface-chatbot";
import Link from "next/link";


export default function Home() {
  return (
    <div className="grid grid-cols-2 bg-gray-950  items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Link href={'/text'} className="text-white border border-zinc-50 rounded-sm p-24">Text</Link>
      <Link href={'/audio'} className="text-white">Audio</Link>
    </div>
  );
}
